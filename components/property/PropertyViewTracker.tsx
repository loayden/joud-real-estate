"use client";

import { useEffect } from "react";

import { apiFetch } from "@/lib/api-client";

const RECENTLY_VIEWED_KEY = "joud:recently-viewed";
const MAX_RECENT = 12;

type PropertySnapshot = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string | null;
  price: number;
  currency: string;
  listingType: "SALE" | "RENT";
  primaryImageUrl: string | null;
  city: { nameAr: string; nameEn: string; slug: string };
  region: { nameAr: string; nameEn: string; slug: string };
  category: { nameAr: string; nameEn: string; slug: string };
  type: { nameAr: string; nameEn: string; slug: string };
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  status: string;
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function PropertyViewTracker({
  propertyId,
  property,
}: {
  propertyId: string;
  property?: PropertySnapshot;
}) {
  useEffect(() => {
    const key = `joud:viewed:${propertyId}`;

    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Browsers can disable sessionStorage.
    }

    void apiFetch(`/api/properties/${propertyId}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // Ignore storage failures.
      }
    });

    if (property) {
      try {
        const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
        const items: Array<PropertySnapshot & { viewedAt: number }> = stored
          ? JSON.parse(stored)
          : [];

        const filtered = items.filter((item) => item.id !== propertyId);
        const next = [{ ...property, viewedAt: Date.now() }, ...filtered].slice(
          0,
          MAX_RECENT,
        );

        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
    }
  }, [propertyId, property]);

  return null;
}
