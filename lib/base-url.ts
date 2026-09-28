// Safe base-URL resolution for metadata, sitemap, canonical URLs and emails.
//
// Vercel env vars can exist but resolve to an *empty string*. `??` does not
// catch that case, so `new URL("")` throws `TypeError: Invalid URL`.
// This module is plain TypeScript with no Node-only imports, so it stays
// safe for the Edge runtime (middleware) and client bundles.

const FALLBACK_URL = "http://localhost:3000";

function clean(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/\/+$/, "");
  return trimmed ? trimmed : undefined;
}

function withProtocol(host: string): string {
  return host.startsWith("http://") || host.startsWith("https://")
    ? host
    : `https://${host}`;
}

export function isValidHttpUrl(value: string | undefined | null): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// Priority: explicit app URL -> Auth.js URL -> Vercel production URL ->
// Vercel preview URL -> localhost. Never returns an empty or invalid URL,
// so callers can safely pass the result to `new URL()`.
export function getBaseUrl(): string {
  const explicit =
    clean(process.env.NEXT_PUBLIC_APP_URL) ?? clean(process.env.AUTH_URL);
  if (explicit && isValidHttpUrl(explicit)) return explicit;

  const vercelProd = clean(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercelProd && isValidHttpUrl(withProtocol(vercelProd))) {
    return withProtocol(vercelProd);
  }

  const vercelPreview = clean(process.env.VERCEL_URL);
  if (vercelPreview && isValidHttpUrl(withProtocol(vercelPreview))) {
    return withProtocol(vercelPreview);
  }

  return FALLBACK_URL;
}
