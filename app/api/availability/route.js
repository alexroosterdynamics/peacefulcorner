// app/api/availability/route.js
import { NextResponse } from "next/server";
import { initialBooked } from "@/lib/availability";

let BOOKED = new Set(initialBooked);

export function GET() {
  return NextResponse.json({ booked: Array.from(BOOKED) });
}

// used by bookings route
export function _addBookedDates(dates) {
  dates.forEach((d) => BOOKED.add(d));
}

export function _isBooked(dateStr) {
  return BOOKED.has(dateStr);
}
