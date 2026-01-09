import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

const KEY = "peacefulcorner";

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

function eachDate(from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

function coversNight(booking, dateStr) {
  // booking nights: checkIn <= date < checkOut
  return booking.checkIn <= dateStr && dateStr < booking.checkOut;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ ok: false, error: "Missing from/to" }, { status: 400 });
  }

  const col = await getCollection();

  // Pricing doc (single)
  const pricing =
    (await col.findOne({ _type: "pricing", key: KEY }, { projection: { _id: 0 } })) || {
      _type: "pricing",
      key: KEY,
      basePrice: 220,
      currency: "RON",
      overrides: [],
    };

  // Blocked doc (single)
  const blocked =
    (await col.findOne({ _type: "blocked", key: KEY }, { projection: { _id: 0 } })) || {
      _type: "blocked",
      key: KEY,
      dates: [],
    };

  const blockedSet = new Set((blocked.dates || []).map(String));
  const overrideMap = new Map(
    (pricing.overrides || []).map((o) => [String(o.date), Number(o.price)])
  );

  // Load bookings that overlap this range (pending + approved) for admin calendar display.
  // Overlap rule: booking.checkIn < to+1 AND booking.checkOut > from
  const toPlus1 = addDays(to, 1);

  const bookings = await col
    .find(
      {
        _type: "booking",
        key: KEY,
        checkIn: { $lt: toPlus1 },
        checkOut: { $gt: from },
      },
      { projection: { _id: 1, key: 1, status: 1, createdAt: 1, approvedAt: 1, name: 1, phone: 1, checkIn: 1, checkOut: 1, guests: 1, pets: 1, pricing: 1, source: 1 } }
    )
    .toArray();

  const approved = bookings.filter((b) => b.status === "approved");
  const pending = bookings.filter((b) => b.status === "pending");

  // Build fast maps for day flags
  const approvedByDate = new Map(); // date -> approved booking (first)
  const pendingByDate = new Map();  // date -> array of pending bookings

  const dates = eachDate(from, to);

  for (const dateStr of dates) {
    // approved
    for (const b of approved) {
      if (coversNight(b, dateStr)) {
        if (!approvedByDate.has(dateStr)) approvedByDate.set(dateStr, b);
        break;
      }
    }
    // pending list
    for (const b of pending) {
      if (coversNight(b, dateStr)) {
        const arr = pendingByDate.get(dateStr) || [];
        arr.push(b);
        pendingByDate.set(dateStr, arr);
      }
    }
  }

  // Produce "days" array for BOTH public booking widget + admin calendar.
  // Public cares about: date, isAvailable, price.
  // Admin also uses: blocked, booked, pendingCount, pendingIds.
  const days = dates.map((date) => {
    const price = overrideMap.has(date) ? overrideMap.get(date) : Number(pricing.basePrice || 220);

    const isBlocked = blockedSet.has(date);
    const booked = approvedByDate.get(date) || null;
    const pendings = pendingByDate.get(date) || [];

    const isAvailable = !isBlocked && !booked; // ✅ pending does NOT block availability

    return {
      date,
      price,
      isAvailable,
      blocked: isBlocked,
      booked: booked
        ? {
            id: String(booked._id),
            name: booked.name,
            phone: booked.phone,
            guests: booked.guests,
            pets: booked.pets,
            checkIn: booked.checkIn,
            checkOut: booked.checkOut,
            pricing: booked.pricing,
          }
        : null,
      pendingCount: pendings.length,
      pendingIds: pendings.map((p) => String(p._id)),
    };
  });

  return NextResponse.json({
    ok: true,
    settings: { basePrice: pricing.basePrice, currency: pricing.currency },
    pricing,
    blockedDates: Array.from(blockedSet),
    bookings: bookings.map((b) => ({
      id: String(b._id),
      status: b.status,
      createdAt: b.createdAt,
      approvedAt: b.approvedAt,
      name: b.name,
      phone: b.phone,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      guests: b.guests,
      pets: b.pets,
      pricing: b.pricing,
      source: b.source || "guest",
    })),
    days,
  });
}
