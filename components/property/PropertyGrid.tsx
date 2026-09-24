import type { Locale } from "@/i18n/routing";
import type { PropertyListItem } from "@/lib/property-listing";
import { cn } from "@/lib/utils";

import { PropertyCard } from "./PropertyCard";

export function PropertyGrid({
  properties,
  locale,
  priorityCount = 0,
  view = "grid",
  favoriteIds = [],
  showFavoriteButton = true,
}: {
  properties: PropertyListItem[];
  locale: Locale;
  priorityCount?: number;
  view?: "grid" | "list";
  favoriteIds?: string[];
  showFavoriteButton?: boolean;
}) {
  const favoriteIdSet = new Set(favoriteIds);

  return (
    <div
      className={cn(
        view === "grid"
          ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
          : "grid gap-4",
      )}
    >
      {properties.map((property, index) => (
        <PropertyCard
          key={property.id}
          locale={locale}
          priority={index < priorityCount}
          property={property}
          initialFavorited={favoriteIdSet.has(property.id)}
          showFavoriteButton={showFavoriteButton}
          variant={view}
        />
      ))}
    </div>
  );
}
