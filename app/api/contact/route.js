// app/api/contact/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { name, email, message } = body || {};

  if (!name || !email || !message) {
    return NextResponse.json({ ok: false, error: "Please fill all fields." }, { status: 400 });
  }

  // In a real app: send email (Resend/Nodemailer) or store in DB.
  console.log("CONTACT MESSAGE:", { name, email, message });

  return NextResponse.json({ ok: true });
}
