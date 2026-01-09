import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  // CASCADE DELETE: This finds every document where booked.id matches and clears it
  if (body.deleteBookingId) {
    const col = await getCollection();
    await col.updateMany(
      { "booked.id": String(body.deleteBookingId) },
      { 
        $set: { isAvailable: true, updatedAt: new Date() },
        $unset: { booked: "" } 
      }
    );
    return NextResponse.json({ ok: true });
  }

  if (body.bulk && Array.isArray(body.dates)) {
    return handleBulk(body);
  }
  
  return handleSingle(body);
}

async function handleSingle(body) {
  const date = String(body.date || "");
  const price = body.price === "" || body.price == null ? null : Number(body.price);
  const isAvailable = body.isAvailable !== undefined ? Boolean(body.isAvailable) : undefined;
  const booked = body.booked; 

  if (!date) return NextResponse.json({ ok: false, error: "Missing date" }, { status: 400 });

  const col = await getCollection();
  const update = { $set: { _type: "day", date, updatedAt: new Date() } };

  if (price !== null) update.$set.price = price;
  if (isAvailable !== undefined) update.$set.isAvailable = isAvailable;
  
  if (booked !== undefined) {
    if (booked === null) update.$unset = { booked: "" };
    else update.$set.booked = booked;
  }

  await col.updateOne({ _type: "day", date }, update, { upsert: true });
  return NextResponse.json({ ok: true });
}

async function handleBulk(body) {
  const { dates, price, isAvailable, booked } = body;
  if (!dates || dates.length === 0) return NextResponse.json({ ok: false }, { status: 400 });

  const col = await getCollection();
  const now = new Date();
  
  const bulkOps = dates.map(date => {
    const update = { $set: { _type: "day", date: String(date), updatedAt: now } };
    if (isAvailable !== undefined) update.$set.isAvailable = Boolean(isAvailable);
    if (price !== null) update.$set.price = Number(price);
    
    if (booked !== undefined) {
      if (booked === null) {
        if (!update.$unset) update.$unset = {};
        update.$unset.booked = "";
      } else {
        update.$set.booked = booked; // This includes the .id
      }
    }
    
    return {
      updateOne: {
        filter: { _type: "day", date: String(date) },
        update,
        upsert: true,
      },
    };
  });
  
  await col.bulkWrite(bulkOps);
  return NextResponse.json({ ok: true });
}