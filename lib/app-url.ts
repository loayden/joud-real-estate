// Single source of truth for the public app origin.
//
// Vercel env vars can resolve to an *empty string* (var exists but has no
// value). `??` does NOT catch that case, so every previous caller using
// `process.env.X ?? fallback` would keep "" and later crash in `new URL("")`
// with `TypeError: Invalid URL` (input: ''). All helpers here treat "", whitespace,
// and non-http(s) values as missing and fall back safely — `new URL()` must
// never receive an empty string.

const FALLBACK_URL = "http://localhost:3000";

function cleanEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/\/$/, "");
  return trimmed ? trimmed : undefined;
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

export function getAppUrl(): string {
  const candidate =
    cleanEnv(process.env.NEXT_PUBLIC_APP_URL) ??
    cleanEnv(process.env.AUTH_URL) ??
    FALLBACK_URL;

  if (isValidHttpUrl(candidate)) return candidate;

  // Last resort: never return an invalid URL — callers feed this into `new URL()`.
  // Prefer a same-origin Vercel URL when available, else localhost.
  const vercelUrl = cleanEnv(process.env.VERCEL_URL);
  if (vercelUrl && isValidHttpUrl(`https://${vercelUrl}`)) {
    return `https://${vercelUrl}`;
  }

  return FALLBACK_URL;
}

/** Safe `metadataBase` for Next.js metadata — never throws. */
export function getSafeMetadataBase(): URL {
  try {
    return new URL(getAppUrl());
  } catch {
    return new URL(FALLBACK_URL);
  }
}

/** Safe Sentry DSN: empty string counts as "not configured". */
export function getSafeSentryDsn(): string | undefined {
  const raw =
    cleanEnv(process.env.SENTRY_DSN) ??
    cleanEnv(process.env.NEXT_PUBLIC_SENTRY_DSN);
  return raw && !raw.includes("xxx") ? raw : undefined;
}
