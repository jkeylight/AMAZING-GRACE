import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "library_session";
const SESSION_VALUE = "authenticated";

function getSecret() {
  return process.env.AUTH_SECRET || process.env.LIBRARY_PASSWORD || "dev-secret-change-me";
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export function createSessionToken() {
  const secret = getSecret();
  return createHmac("sha256", secret).update(SESSION_VALUE).digest("hex");
}

export function verifySessionToken(token: string | undefined | null) {
  if (!token) return false;
  const expected = createSessionToken();
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyPassword(password: string) {
  const expected = process.env.LIBRARY_PASSWORD || "";
  if (!expected) return false;
  try {
    const a = Buffer.from(password);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isAuthConfigured() {
  return Boolean(process.env.LIBRARY_PASSWORD && process.env.AUTH_SECRET);
}
