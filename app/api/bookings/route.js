import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { sendBookingEmail } from "@/lib/email";

function ymd(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function eachNightDates(checkIn, checkOut) {
  const a = new Date(checkIn + "T00:00:00Z");
  const b = new Date(checkOut + "T00:00:00Z");
  const out = [];
  for (let d = new Date(a); d < b; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(ymd(d));
  }
  return out; // nights only, excludes checkout date
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  const checkIn = String(body.checkIn || "");
  const checkOut = String(body.checkOut || "");
  const adults = Number(body.adults || 1);
  const children = Number(body.children || 0);
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

  const nights = eachNightDates(checkIn, checkOut);
  if (nights.length < 1) {
    return NextResponse.json({ ok: false, error: "Select at least 1 night" }, { status: 400 });
  }

  const col = await getCollection();
  const settings = (await col.findOne({ _type: "settings" })) || {
    basePrice: 45,
    currency: "EUR",
    cleaningFee: 15,
    serviceFee: 20,
  };

  // Load day overrides
  const overrides = await col
    .find({ _type: "day", date: { $in: nights } })
    .toArray();

  const byDate = new Map(overrides.map((d) => [d.date, d]));

  // Check availability and compute price
  let subtotal = 0;
  for (const date of nights) {
    const day = byDate.get(date);
    const isAvailable = day ? day.isAvailable !== false : true;
    if (!isAvailable) {
      return NextResponse.json({ ok: false, error: `Not available on ${date}` }, { status: 409 });
    }
    const price = day && typeof day.price === "number" ? day.price : settings.basePrice;
    subtotal += price;
  }

  const cleaningFee = Number(settings.cleaningFee || 0);
  const serviceFee = Number(settings.serviceFee || 0);
  const total = subtotal + cleaningFee + serviceFee;

  const booking = {
    _type: "booking",
    status: "pending",
    createdAt: new Date(),
    name,
    phone,
    checkIn,
    checkOut,
    guests: { adults, children },
    pricing: { currency: settings.currency || "EUR", nights: nights.length, subtotal, cleaningFee, serviceFee, total },
  };

  const insert = await col.insertOne(booking);
  booking._id = insert.insertedId;

  // Block nights (set isAvailable=false). Preserve price if already set; otherwise set base price.
  const bulk = nights.map((date) => ({
    updateOne: {
      filter: { _type: "day", date },
      update: {
        $set: {
          _type: "day",
          date,
          isAvailable: false,
          price: byDate.get(date)?.price ?? settings.basePrice,
          updatedAt: new Date(),
        },
      },
      upsert: true,
    },
  }));
  if (bulk.length) await col.bulkWrite(bulk);

  // Email notifications
  try {
    await sendBookingEmail({ booking });
  } catch (e) {
    // Booking stays created even if email fails
    return NextResponse.json({
      ok: true,
      bookingId: String(booking._id),
      warning: "Booking saved, but email failed. Check SMTP settings.",
    });
  }

  return NextResponse.json({ ok: true, bookingId: String(booking._id) });
}
