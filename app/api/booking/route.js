// app/api/bookings/route.js
import { NextResponse } from "next/server";
import { _addBookedDates, _isBooked } from "../availability/route";

function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function datesBetween(startStr, endStr) {
  // nights: start inclusive, end exclusive
  const start = new Date(`${startStr}T00:00:00`);
  const end = new Date(`${endStr}T00:00:00`);
  const out = [];
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    out.push(ymd(d));
  }
  return out;
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { start, end, guests, name, email } = body || {};

  if (!start || !end) {
    return NextResponse.json({ ok: false, error: "Missing dates." }, { status: 400 });
  }

  const nights = datesBetween(start, end);
  if (nights.length < 1) {
    return NextResponse.json({ ok: false, error: "Select at least 1 night." }, { status: 400 });
  }

  const conflict = nights.find((d) => _isBooked(d));
  if (conflict) {
    return NextResponse.json(
      { ok: false, error: `Those dates include an unavailable day (${conflict}).` },
      { status: 409 }
    );
  }

  // In a real app: save to DB + email you. Here we mark as booked (runtime memory).
  _addBookedDates(nights);

  console.log("NEW BOOKING REQUEST:", { start, end, guests, name, email, nights: nights.length });

  return NextResponse.json({
    ok: true,
    bookingId: `PC-${Date.now().toString(36).toUpperCase()}`,
    nights: nights.length,
  });
}
