import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCollection } from "@/lib/db";
import { signSession, SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(req) {
    const body = await req.json().catch(() => ({}));
    const username = String(body.username || "");
    const password = String(body.password || "");

    const col = await getCollection();
    const admin = await col.findOne({ _type: "admin", username });

    if (!admin) {
        return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
        return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    const session = { sub: String(admin._id), username: admin.username };
    const token = signSession(session);

    const res = NextResponse.json({ ok: true, session });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 12,
    });

    return res;
}
