import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { sendBookingEmail } from "@/lib/email";

const KEY = "peacefulcorner";

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

function eachNightDates(checkIn, checkOut) {
  const out = [];
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) out.push(d);
  return out; // nights only, excludes checkout date
}

function coversNight(booking, dateStr) {
  return booking.checkIn <= dateStr && dateStr < booking.checkOut;
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  const checkIn = String(body.checkIn || "");
  const checkOut = String(body.checkOut || "");
  const adults = Number(body.adults || 1);
  const children = Number(body.children || 0);
  const pets = body.pets || { hasPets: false, count: 0 };

  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();

  if (!checkIn || !checkOut || !name || !phone) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }
  if (Number.isNaN(adults) || adults < 1) {
    return NextResponse.json({ ok: false, error: "Adults must be at least 1" }, { status: 400 });
  }
  if (Number.isNaN(children) || children < 0) {
    return NextResponse.json({ ok: false, error: "Children invalid" }, { status: 400 });
  }
  if (checkOut <= checkIn) {
    return NextResponse.json({ ok: false, error: "Invalid date range" }, { status: 400 });
  }

  const nights = eachNightDates(checkIn, checkOut);
  if (nights.length < 1) {
    return NextResponse.json({ ok: false, error: "Select at least 1 night" }, { status: 400 });
  }

  const col = await getCollection();

  // Pricing doc
  const pricing =
    (await col.findOne({ _type: "pricing", key: KEY })) || {
      _type: "pricing",
      key: KEY,
      basePrice: 220,
      currency: "RON",
      overrides: [],
    };

  const overrideMap = new Map(
    (pricing.overrides || []).map((o) => [String(o.date), Number(o.price)])
  );

  // Blocked doc
  const blocked =
    (await col.findOne({ _type: "blocked", key: KEY })) || {
      _type: "blocked",
      key: KEY,
      dates: [],
    };
  const blockedSet = new Set((blocked.dates || []).map(String));

  // Approved bookings overlapping these nights (pending does NOT block)
  const approvedBookings = await col
    .find(
      {
        _type: "booking",
        key: KEY,
        status: "approved",
        checkIn: { $lt: checkOut },
        checkOut: { $gt: checkIn },
      },
      { projection: { _id: 1, checkIn: 1, checkOut: 1 } }
    )
    .toArray();

  // Validate availability + compute price
  let subtotal = 0;

  for (const date of nights) {
    if (blockedSet.has(date)) {
      return NextResponse.json({ ok: false, error: `Not available on ${date}` }, { status: 409 });
    }

    // check if covered by any approved booking
    for (const b of approvedBookings) {
      if (coversNight(b, date)) {
        return NextResponse.json({ ok: false, error: `Not available on ${date}` }, { status: 409 });
      }
    }

    const price = overrideMap.has(date) ? overrideMap.get(date) : Number(pricing.basePrice || 220);
    subtotal += price;
  }

  const booking = {
    _type: "booking",
    key: KEY,
    status: "pending",
    createdAt: new Date(),
    name,
    phone,
    checkIn,
    checkOut,
    guests: { adults, children },
    pets: { hasPets: Boolean(pets.hasPets), count: Number(pets.count || 0) },
    pricing: {
      currency: pricing.currency || "RON",
      nights: nights.length,
      subtotal,
      total: subtotal, // ✅ no fees
    },
    source: "guest",
  };

  const insert = await col.insertOne(booking);
  const bookingId = String(insert.insertedId);

  // Email notifications
  try {
    await sendBookingEmail({ booking: { ...booking, _id: bookingId } });
  } catch (e) {
    return NextResponse.json({
      ok: true,
      bookingId,
      warning: "Booking saved, but email failed. Check SMTP settings.",
    });
  }

  return NextResponse.json({ ok: true, bookingId });
}
