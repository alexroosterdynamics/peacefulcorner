import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key") || "peacefulcorner";
  const lang = searchParams.get("lang") || "ro";

  const col = await getCollection();
  const doc = await col.findOne({ _type: "content", key });

  if (!doc) {
    return NextResponse.json({ ok: false, error: "Content not found" }, { status: 404 });
  }

  const pick = (obj) => obj?.[lang] || obj?.ro || obj?.en || obj?.it || "";

  // Build the content object the page expects (strings in selected language)
  const content = {
    title: pick(doc.title),
    tagline: pick(doc.tagline),
    description: pick(doc.description),
    address: pick(doc.address),
    city: pick(doc.city),
    country: pick(doc.country),

    rating: doc.rating ?? 4.9,
    reviews: doc.reviews ?? 127,

    images: doc.images || [],

    highlights: (doc.highlights || []).map((h) => ({
      iconKey: h.iconKey,
      title: pick(h.title),
      subtitle: pick(h.subtitle),
    })),

    amenities: (doc.amenities || []).map((a) => ({
      iconKey: a.iconKey,
      name: pick(a.name),
      description: pick(a.description),
    })),

    hosts: (doc.hosts || []).map((h) => ({
      name: pick(h.name),
      role: pick(h.role),
      bio: pick(h.bio),
      image: h.image,
    })),

    ui: {
      bookNow: pick(doc.ui?.bookNow),
      checkAvailability: pick(doc.ui?.checkAvailability),
      about: pick(doc.ui?.about),
      offers: pick(doc.ui?.offers),
      amenitiesTitle: pick(doc.ui?.amenitiesTitle),
      hostsTitle: pick(doc.ui?.hostsTitle),
      bookingTitle: pick(doc.ui?.bookingTitle),
      bookingSubtitle: pick(doc.ui?.bookingSubtitle),
      infoTitle: pick(doc.ui?.infoTitle),
      addressLabel: pick(doc.ui?.addressLabel),
      phoneLabel: pick(doc.ui?.phoneLabel),
      emailLabel: pick(doc.ui?.emailLabel),
      contact: pick(doc.ui?.contact),
      rights: pick(doc.ui?.rights),
    },
  };

  return NextResponse.json({ ok: true, content });
}
