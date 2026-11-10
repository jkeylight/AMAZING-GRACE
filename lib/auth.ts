const COOKIE_NAME = "library_session";
const SESSION_VALUE = "authenticated";

function getSecret() {
  return process.env.AUTH_SECRET || process.env.LIBRARY_PASSWORD || "dev-secret-change-me";
}

function getSecretKey(secret: string) {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export async function createSessionToken() {
  const secret = getSecret();
  const key = await getSecretKey(secret);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(SESSION_VALUE));
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) return false;
  try {
    const expected = await createSessionToken();
    const a = new TextEncoder().encode(token);
    const b = new TextEncoder().encode(expected);
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  } catch {
    return false;
  }
}

export function verifyPassword(password: string) {
  const expected = process.env.LIBRARY_PASSWORD || "";
  if (!expected) return false;
  try {
    const a = new TextEncoder().encode(password);
    const b = new TextEncoder().encode(expected);
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  } catch {
    return false;
  }
}

export function isAuthConfigured() {
  return Boolean(process.env.LIBRARY_PASSWORD && process.env.AUTH_SECRET);
}
