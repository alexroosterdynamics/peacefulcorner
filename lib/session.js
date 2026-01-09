import crypto from "crypto";

const COOKIE_NAME = "pc_session";

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}
function unbase64url(input) {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function signSession(payload, maxAgeSeconds = 60 * 60 * 12) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing AUTH_SECRET");

  const now = Math.floor(Date.now() / 1000);
  const data = {
    ...payload,
    iat: now,
    exp: now + maxAgeSeconds,
  };

  const body = base64url(JSON.stringify(data));
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySession(token) {
  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret) return null;
    if (!token) return null;

    const [body, sig] = token.split(".");
    if (!body || !sig) return null;

    const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

    const payload = JSON.parse(unbase64url(body));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
