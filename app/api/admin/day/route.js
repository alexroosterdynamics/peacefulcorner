import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { ObjectId } from "mongodb";

const KEY = "peacefulcorner";

/** ---------- Date helpers ---------- */
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

function sortDates(dates) {
  return Array.from(new Set(dates.map(String))).sort();
}

function ensureContiguousNights(sortedDates) {
  for (let i = 1; i < sortedDates.length; i++) {
    if (sortedDates[i] !== addDays(sortedDates[i - 1], 1)) return false;
  }
  return true;
}

function eachNightDates(checkIn, checkOut) {
  const out = [];
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) out.push(d);
  return out;
}

/** ---------- DB helpers (self-heal schemas) ---------- */
async function getPricing(col) {
  const p = await col.findOne({ _type: "pricing", key: KEY });
  if (!p) {
    return { _type: "pricing", key: KEY, basePrice: 220, currency: "RON", overrides: [] };
  }
  if (!Array.isArray(p.overrides)) {
    await col.updateOne({ _id: p._id }, { $set: { overrides: [], updatedAt: new Date() } });
    return { ...p, overrides: [] };
  }
  return p;
}

/**
 * IMPORTANT:
 * - We must NOT combine $setOnInsert { dates: [] } with $pull/$addToSet on dates in the same update.
 *   Mongo rejects it with: "Updating the path 'dates' would create a conflict at 'dates'"
 * - So: upsert doc first, then apply $pull/$addToSet in a second update.
 */
async function ensureBlockedDoc(col) {
  // 1) Ensure document exists (no conflict ops here)
  await col.updateOne(
    { _type: "blocked", key: KEY },
    { $setOnInsert: { _type: "blocked", key: KEY, dates: [], createdAt: new Date() } },
    { upsert: true }
  );

  // 2) Self-heal if dates is corrupted (non-array)
  const b = await col.findOne({ _type: "blocked", key: KEY }, { projection: { dates: 1 } });
  if (b && !Array.isArray(b.dates)) {
    await col.updateOne({ _id: b._id }, { $set: { dates: [], updatedAt: new Date() } });
  }
}

async function getBlockedSet(col) {
  await ensureBlockedDoc(col);
  const b = await col.findOne({ _type: "blocked", key: KEY }, { projection: { dates: 1 } });
  const arr = Array.isArray(b?.dates) ? b.dates : [];
  return new Set(arr.map(String));
}

/** ---------- Main handler ---------- */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const col = await getCollection();

    // ✅ SET BASE PRICE (new)
    if (body.setBasePrice !== undefined && body.setBasePrice !== null && body.setBasePrice !== "") {
      const nextBase = Number(body.setBasePrice);
      if (Number.isNaN(nextBase) || nextBase <= 0) {
        return NextResponse.json({ ok: false, error: "Invalid base price" }, { status: 400 });
      }

      const pricing = await getPricing(col);
      const overrideMap = new Map((pricing.overrides || []).map((o) => [String(o.date), Number(o.price)]));

      // ✅ Optional clean: remove overrides that equal the new base
      for (const [date, price] of overrideMap.entries()) {
        if (Number(price) === nextBase) overrideMap.delete(date);
      }

      const newOverrides = Array.from(overrideMap.entries()).map(([date, price]) => ({ date, price }));

      await col.updateOne(
        { _type: "pricing", key: KEY },
        {
          $set: {
            _type: "pricing",
            key: KEY,
            basePrice: nextBase,
            currency: pricing.currency || "RON",
            overrides: newOverrides,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      return NextResponse.json({ ok: true });
    }

    // ✅ CLEAR ALL OVERRIDES (new)
    if (body.clearAllOverrides === true) {
      const pricing = await getPricing(col);
      await col.updateOne(
        { _type: "pricing", key: KEY },
        {
          $set: {
            _type: "pricing",
            key: KEY,
            basePrice: Number(pricing.basePrice || 220),
            currency: pricing.currency || "RON",
            overrides: [],
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      return NextResponse.json({ ok: true });
    }

    // ✅ Approve pending booking -> becomes approved, delete overlapping pending bookings
    if (body.approveBookingId) {
      const id = String(body.approveBookingId);
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ ok: false, error: "Invalid booking id" }, { status: 400 });
      }

      const booking = await col.findOne({ _type: "booking", key: KEY, _id: new ObjectId(id) });
      if (!booking) return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 });
      if (booking.status !== "pending") {
        return NextResponse.json({ ok: false, error: "Booking is not pending" }, { status: 400 });
      }

      // Validate no conflict with blocked or approved bookings
      const blockedSet = await getBlockedSet(col);
      const nights = eachNightDates(booking.checkIn, booking.checkOut);

      for (const date of nights) {
        if (blockedSet.has(date)) {
          return NextResponse.json({ ok: false, error: `Blocked on ${date}` }, { status: 409 });
        }
      }

      const approvedConflict = await col
        .find({
          _type: "booking",
          key: KEY,
          status: "approved",
          _id: { $ne: booking._id },
          checkIn: { $lt: booking.checkOut },
          checkOut: { $gt: booking.checkIn },
        })
        .limit(1)
        .toArray();

      if (approvedConflict.length) {
        return NextResponse.json({ ok: false, error: "Conflicts with an approved booking" }, { status: 409 });
      }

      await col.updateOne(
        { _type: "booking", key: KEY, _id: booking._id },
        { $set: { status: "approved", approvedAt: new Date() } }
      );

      // Delete ALL overlapping pending bookings (trace removed)
      const del = await col.deleteMany({
        _type: "booking",
        key: KEY,
        status: "pending",
        _id: { $ne: booking._id },
        checkIn: { $lt: booking.checkOut },
        checkOut: { $gt: booking.checkIn },
      });

      return NextResponse.json({ ok: true, deletedOverlappingPending: del.deletedCount || 0 });
    }

    // ✅ Delete booking (pending or approved) from DB
    if (body.deleteBookingId) {
      const id = String(body.deleteBookingId);
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ ok: false, error: "Invalid booking id" }, { status: 400 });
      }
      await col.deleteOne({ _type: "booking", key: KEY, _id: new ObjectId(id) });
      return NextResponse.json({ ok: true });
    }

    // ✅ Create approved booking manually from selected nights
    if (body.createBooking && Array.isArray(body.dates) && body.dates.length) {
      const dates = sortDates(body.dates);
      if (!ensureContiguousNights(dates)) {
        return NextResponse.json(
          { ok: false, error: "Selection must be one continuous range of nights." },
          { status: 400 }
        );
      }

      const checkIn = dates[0];
      const checkOut = addDays(dates[dates.length - 1], 1);

      const pricing = await getPricing(col);
      const overrideMap = new Map((pricing.overrides || []).map((o) => [String(o.date), Number(o.price)]));

      const blockedSet = await getBlockedSet(col);
      for (const d of dates) {
        if (blockedSet.has(d)) {
          return NextResponse.json({ ok: false, error: `Blocked on ${d}` }, { status: 409 });
        }
      }

      const conflicts = await col
        .find({
          _type: "booking",
          key: KEY,
          status: "approved",
          checkIn: { $lt: checkOut },
          checkOut: { $gt: checkIn },
        })
        .limit(1)
        .toArray();

      if (conflicts.length) {
        return NextResponse.json({ ok: false, error: "Conflicts with an approved booking" }, { status: 409 });
      }

      let subtotal = 0;
      for (const d of dates) {
        const price = overrideMap.has(d) ? overrideMap.get(d) : Number(pricing.basePrice || 220);
        subtotal += price;
      }

      const b = body.booking || {};
      const bookingDoc = {
        _type: "booking",
        key: KEY,
        status: "approved",
        createdAt: new Date(),
        approvedAt: new Date(),
        source: "manual",
        name: String(b.name || "").trim() || "Manual",
        phone: String(b.phone || "").trim(),
        checkIn,
        checkOut,
        guests: { adults: Number(b.people || 1), children: 0 },
        pets: { hasPets: Number(b.pets || 0) > 0, count: Number(b.pets || 0) },
        pricing: { currency: pricing.currency || "RON", nights: dates.length, subtotal, total: subtotal },
      };

      await col.insertOne(bookingDoc);
      return NextResponse.json({ ok: true });
    }

    // ✅ Bulk operations: block/unblock dates OR set price overrides
    if (body.bulk && Array.isArray(body.dates)) {
      const dates = sortDates(body.dates);
      if (!dates.length) return NextResponse.json({ ok: false, error: "No dates" }, { status: 400 });

      // BULK PRICE
      if (body.price !== undefined && body.price !== null && body.price !== "") {
        const price = Number(body.price);
        if (Number.isNaN(price)) {
          return NextResponse.json({ ok: false, error: "Invalid price" }, { status: 400 });
        }

        const pricing = await getPricing(col);
        const base = Number(pricing.basePrice || 220);

        const overrideMap = new Map((pricing.overrides || []).map((o) => [String(o.date), Number(o.price)]));

        for (const d of dates) {
          if (price === base) overrideMap.delete(d); // ✅ remove override if equals base
          else overrideMap.set(d, price);
        }

        const newOverrides = Array.from(overrideMap.entries()).map(([date, p]) => ({ date, price: p }));

        await col.updateOne(
          { _type: "pricing", key: KEY },
          {
            $set: {
              _type: "pricing",
              key: KEY,
              basePrice: base,
              currency: pricing.currency || "RON",
              overrides: newOverrides,
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );

        return NextResponse.json({ ok: true });
      }

      // BULK BLOCK / UNBLOCK
      const isAvailable = body.isAvailable !== undefined ? Boolean(body.isAvailable) : undefined;

      if (isAvailable === false) {
        await ensureBlockedDoc(col);
        await col.updateOne(
          { _type: "blocked", key: KEY },
          {
            $addToSet: { dates: { $each: dates } },
            $set: { updatedAt: new Date() },
          }
        );
        return NextResponse.json({ ok: true });
      }

      if (isAvailable === true) {
        await ensureBlockedDoc(col);
        await col.updateOne(
          { _type: "blocked", key: KEY },
          {
            $pull: { dates: { $in: dates } },
            $set: { updatedAt: new Date() },
          }
        );
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: false, error: "Unsupported bulk action" }, { status: 400 });
    }

    // Single-date availability (legacy-safe)
    if (body.date && (body.isAvailable === true || body.isAvailable === false)) {
      const date = String(body.date);
      const isAvailable = Boolean(body.isAvailable);

      if (isAvailable === false) {
        await ensureBlockedDoc(col);
        await col.updateOne(
          { _type: "blocked", key: KEY },
          {
            $addToSet: { dates: date },
            $set: { updatedAt: new Date() },
          }
        );
        return NextResponse.json({ ok: true });
      }

      if (isAvailable === true) {
        await ensureBlockedDoc(col);
        await col.updateOne(
          { _type: "blocked", key: KEY },
          {
            $pull: { dates: date },
            $set: { updatedAt: new Date() },
          }
        );
        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: false, error: "Unsupported request" }, { status: 400 });
  } catch (err) {
    console.error("[api/admin/day] ERROR:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
