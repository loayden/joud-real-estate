"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "joud:recently-viewed";
const MAX_ITEMS = 12;

type RecentlyViewedItem = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string | null;
  price: number;
  currency: string;
  listingType: "SALE" | "RENT";
  primaryImageUrl: string | null;
  city: { nameAr: string; nameEn: string };
  region: { nameAr: string; nameEn: string };
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  viewedAt: number;
};

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const trackView = useCallback(
    (property: Omit<RecentlyViewedItem, "viewedAt">) => {
      setItems((prev) => {
        const filtered = prev.filter((item) => item.id !== property.id);
        const next = [{ ...property, viewedAt: Date.now() }, ...filtered].slice(
          0,
          MAX_ITEMS,
        );

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }

        return next;
      });
    },
    [],
  );

  const clearRecent = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { items, trackView, clearRecent };
}

export type { RecentlyViewedItem };
