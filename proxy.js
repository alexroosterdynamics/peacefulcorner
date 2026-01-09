import { NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "./lib/session";

export function proxy(req) {
  const { pathname } = req.nextUrl;

  // Only protect admin API
  const isAdminApi = pathname.startsWith("/api/admin");
  if (!isAdminApi) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySession(token);

  if (session) return NextResponse.next();

  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
