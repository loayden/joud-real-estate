"use client";

import { useEffect, useState } from "react";

function normalizeClientFeatureFlagKey(key: string) {
  return key
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
}

export function useFeatureFlag(key: string) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const normalizedKey = normalizeClientFeatureFlagKey(key);

    async function loadFlag() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/feature-flags/${normalizedKey}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          success: boolean;
          data?: { enabled: boolean };
          error?: string;
        };

        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? "Unable to load feature flag");
        }

        setEnabled(Boolean(payload.data?.enabled));
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }

        setError(caught instanceof Error ? caught.message : "Unknown error");
        setEnabled(false);
      } finally {
        setLoading(false);
      }
    }

    void loadFlag();

    return () => controller.abort();
  }, [key]);

  return { enabled, error, loading };
}
