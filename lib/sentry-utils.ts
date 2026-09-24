const DEFAULT_PRODUCTION_TRACE_RATE = 0.1;

const SENSITIVE_HEADER_NAMES = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-auth-token",
  "x-csrf-token",
  "x-vercel-protection-bypass",
]);

type SentryRequest = {
  headers?: Record<string, unknown>;
  cookies?: unknown;
  data?: unknown;
};

type SentryEventLike = {
  request?: SentryRequest;
  user?: Record<string, unknown>;
  extra?: Record<string, unknown>;
};

export function getSentryTraceSampleRate(
  rawValue: string | undefined,
  fallback = DEFAULT_PRODUCTION_TRACE_RATE,
) {
  if (!rawValue) return fallback;

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return fallback;
  }

  return parsed;
}

export function scrubSentryEvent<T extends SentryEventLike>(event: T) {
  if (event.request?.headers) {
    for (const headerName of Object.keys(event.request.headers)) {
      if (SENSITIVE_HEADER_NAMES.has(headerName.toLowerCase())) {
        delete event.request.headers[headerName];
      }
    }
  }

  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
  }

  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.phone;
  }

  return event;
}
