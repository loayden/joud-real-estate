// Shared client for cookie-authenticated mutating API calls.
// Attaches the CSRF double-submit token (see lib/csrf.ts) and retries once
// with a fresh token when the server reports CSRF_INVALID.
"use client";

import { CSRF_HEADER_NAME } from "@/lib/csrf";

let cachedToken: string | null = null;
let inflight: Promise<string | null> | null = null;

async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  if (!inflight) {
    inflight = fetch("/api/csrf", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        cachedToken = d?.data?.token ?? null;
        return cachedToken;
      })
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function invalidateCsrfToken() {
  cachedToken = null;
}

/** Raw token accessor for non-fetch transports (e.g. XMLHttpRequest). */
export async function getCsrfToken(): Promise<string | null> {
  return getToken();
}

export async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers);
  const token = await getToken();
  if (token) headers.set(CSRF_HEADER_NAME, token);

  let res = await fetch(url, { ...options, headers, credentials: "include" });

  if (res.status === 403) {
    const data = (await res
      .clone()
      .json()
      .catch(() => null)) as {
      code?: string;
    } | null;
    if (data?.code === "CSRF_INVALID") {
      invalidateCsrfToken();
      const fresh = await getToken();
      const retryHeaders = new Headers(options.headers);
      if (fresh) retryHeaders.set(CSRF_HEADER_NAME, fresh);
      res = await fetch(url, {
        ...options,
        headers: retryHeaders,
        credentials: "include",
      });
    }
  }

  return res;
}
