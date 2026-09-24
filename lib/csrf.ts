// Edge-compatible CSRF via double-submit cookie pattern.
// Works in Edge runtime, Node.js, and browsers (Web Crypto only — no node:crypto).

const CSRF_TOKEN_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateCsrfToken(): string {
  return randomHex(32);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function validateCsrfToken(
  headerToken: string | null,
  cookieToken: string | null,
): boolean {
  if (!headerToken || !cookieToken) return false;
  if (headerToken.length !== 64 || cookieToken.length !== 64) return false;
  return constantTimeEqual(headerToken, cookieToken);
}

function parseCookies(cookieHeader: string | null): Map<string, string> {
  const map = new Map<string, string>();
  if (!cookieHeader) return map;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    map.set(part.slice(0, idx).trim(), part.slice(idx + 1).trim());
  }
  return map;
}

export function getCsrfHeaderToken(req: Request): string | null {
  return req.headers.get(CSRF_HEADER_NAME);
}

export function getCsrfCookieToken(req: Request): string | null {
  return parseCookies(req.headers.get("cookie")).get(CSRF_TOKEN_NAME) ?? null;
}

// Back-compat single-arg helper (header preferred, else cookie). Prefer
// getCsrfHeaderToken/getCsrfCookieToken + validateCsrfToken(header, cookie).
export function getCsrfTokenFromRequest(req: Request): string | null {
  return getCsrfHeaderToken(req) ?? getCsrfCookieToken(req);
}

export function buildCsrfSetCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "Secure; " : "";
  return `${CSRF_TOKEN_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; ${secure}Max-Age=31536000`;
}

export { CSRF_TOKEN_NAME, CSRF_HEADER_NAME };
