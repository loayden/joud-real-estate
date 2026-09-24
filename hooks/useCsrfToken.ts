"use client";

import { useCallback, useEffect, useState } from "react";

export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchToken = useCallback(async () => {
    try {
      const response = await fetch("/api/csrf", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success && data.data?.token) {
        setToken(data.data.token);
      }
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const refreshToken = useCallback(async () => {
    setLoading(true);
    await fetchToken();
  }, [fetchToken]);

  return { token, loading, refreshToken };
}

export function useCsrfFetch() {
  const { token, loading, refreshToken } = useCsrfToken();

  const csrfFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (loading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (!token) {
        await refreshToken();
      }

      const headers = new Headers(options.headers);
      if (token) {
        headers.set("x-csrf-token", token);
      }

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      if (response.status === 403) {
        const data = await response.json().catch(() => ({}));
        if (data.code === "CSRF_INVALID") {
          await refreshToken();
          const newHeaders = new Headers(options.headers);
          newHeaders.set("x-csrf-token", token || "");
          return fetch(url, {
            ...options,
            headers: newHeaders,
            credentials: "include",
          });
        }
      }

      return response;
    },
    [token, loading, refreshToken],
  );

  return { csrfFetch, loading, refreshToken };
}
