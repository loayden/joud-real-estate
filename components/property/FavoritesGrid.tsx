"use client";

import { Heart } from "lucide-react";
import { useState } from "react";

import { PropertyCard } from "@/components/property/PropertyCard";
import { Button } from "@/components/ui/button";
import { Link, type Locale } from "@/i18n/routing";
import type { FavoriteListItem } from "@/lib/favorites";

const copy = {
  ar: {
    emptyTitle: "لا توجد عقارات في المفضلة",
    emptyDescription:
      "احفظ العقارات المهمة من صفحات التصفح أو التفاصيل لتظهر هنا.",
    browse: "تصفح العقارات",
  },
  en: {
    emptyTitle: "No favorite properties",
    emptyDescription:
      "Save important listings from browse or detail pages and they will appear here.",
    browse: "Browse properties",
  },
} as const;

export function FavoritesGrid({
  initialFavorites,
  locale,
}: {
  initialFavorites: FavoriteListItem[];
  locale: Locale;
}) {
  const text = copy[locale];
  const [favorites, setFavorites] = useState(initialFavorites);

  if (favorites.length === 0) {
    return (
      <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-border bg-background p-8 text-center">
        <div className="grid max-w-md justify-items-center gap-3">
          <Heart className="size-11 text-muted-foreground" />
          <h2 className="text-2xl font-bold">{text.emptyTitle}</h2>
          <p className="leading-7 text-muted-foreground">
            {text.emptyDescription}
          </p>
          <Button asChild>
            <Link href="/properties">{text.browse}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {favorites.map((favorite, index) => (
        <PropertyCard
          key={favorite.id}
          locale={locale}
          priority={index < 3}
          property={favorite.property}
          initialFavorited
          onFavoriteChange={(favorited) => {
            if (!favorited) {
              setFavorites((current) =>
                current.filter((item) => item.id !== favorite.id),
              );
            }
          }}
        />
      ))}
    </div>
  );
}
