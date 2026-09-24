"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

import { PropertyCard } from "@/components/property/PropertyCard";
import type { PropertyListItem } from "@/lib/property-listing";
import type { Locale } from "@/i18n/routing";

const RECENTLY_VIEWED_KEY = "joud:recently-viewed";

type PropertySnapshot = Pick<
  PropertyListItem,
  | "id"
  | "slug"
  | "titleAr"
  | "titleEn"
  | "price"
  | "currency"
  | "listingType"
  | "primaryImageUrl"
  | "city"
  | "region"
  | "bedrooms"
  | "bathrooms"
  | "area"
  | "category"
  | "type"
  | "status"
  | "isFeatured"
  | "publishedAt"
  | "createdAt"
  | "updatedAt"
> & { viewedAt: number };

const copy = {
  ar: {
    title: "شوهدت مؤخراً",
    empty: "لم تشاهد أي عقارات بعد.",
  },
  en: {
    title: "Recently Viewed",
    empty: "You have not viewed any properties yet.",
  },
} as const;

export function RecentlyViewed({
  locale,
  favoriteIds = [],
}: {
  locale: Locale;
  favoriteIds?: string[];
}) {
  const text = copy[locale];
  const [items, setItems] = useState<PropertySnapshot[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PropertySnapshot[];
        setItems(parsed.slice(0, 6));
      }
    } catch {
      // ignore
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <Clock className="size-5 text-muted-foreground" />
        <h2 className="text-2xl font-bold tracking-normal">{text.title}</h2>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item, index) => (
          <PropertyCard
            key={item.id}
            locale={locale}
            priority={index < 2}
            property={item}
            initialFavorited={favoriteIds.includes(item.id)}
          />
        ))}
      </div>
    </section>
  );
}
