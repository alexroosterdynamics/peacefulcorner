import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const date = String(body.date || "");
  const price = body.price === "" || body.price == null ? null : Number(body.price);
  const isAvailable = Boolean(body.isAvailable);

  if (!date) {
    return NextResponse.json({ ok: false, error: "Missing date" }, { status: 400 });
  }
  if (price !== null && (Number.isNaN(price) || price < 0)) {
    return NextResponse.json({ ok: false, error: "Invalid price" }, { status: 400 });
  }

  const col = await getCollection();
  const update = {
    $set: {
      _type: "day",
      date,
      isAvailable,
      updatedAt: new Date(),
    },
  };
  if (price !== null) update.$set.price = price;

  await col.updateOne({ _type: "day", date }, update, { upsert: true });

  return NextResponse.json({ ok: true });
}
