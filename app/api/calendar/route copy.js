import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ ok: false, error: "Missing from/to" }, { status: 400 });
  }

  const col = await getCollection();
  const settings = await col.findOne({ _type: "settings" }, { projection: { _id: 0 } });

  const days = await col
    .find({ _type: "day", date: { $gte: from, $lte: to } }, { projection: { _id: 0 } })
    .toArray();

  return NextResponse.json({
    ok: true,
    settings: settings || { basePrice: 45, currency: "EUR", cleaningFee: 15, serviceFee: 20 },
    days,
  });
}
