import { Bath, BedDouble, MapPin, Maximize2, Star } from "lucide-react";
import Image from "next/image";

import { ComparisonToggleButton } from "@/components/property/ComparisonDrawer";
import { FavoriteButton } from "@/components/property/FavoriteButton";
import type { PropertyListItem } from "@/lib/property-listing";
import { Link, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    sale: "للبيع",
    rent: "للإيجار",
    featured: "مميز",
    areaUnit: "م²",
    pricePerSqm: "ج.م/م²",
    today: "اليوم",
    thisWeek: "هذا الأسبوع",
    beds: "غرف",
    baths: "حمامات",
  },
  en: {
    sale: "For sale",
    rent: "For rent",
    featured: "Featured",
    areaUnit: "sqm",
    pricePerSqm: "EGP/sqm",
    today: "Today",
    thisWeek: "This week",
    beds: "Beds",
    baths: "Baths",
  },
} as const;

function formatPrice(property: PropertyListItem, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    currency: property.currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(property.price);
}

function localizeName(
  value: { nameAr: string; nameEn: string },
  locale: Locale,
) {
  return locale === "ar" ? value.nameAr : value.nameEn;
}

export function PropertyCard({
  property,
  locale,
  priority = false,
  variant = "grid",
  initialFavorited = false,
  showFavoriteButton = true,
  onFavoriteChange,
}: {
  property: PropertyListItem;
  locale: Locale;
  priority?: boolean;
  variant?: "grid" | "list";
  initialFavorited?: boolean;
  showFavoriteButton?: boolean;
  onFavoriteChange?: (favorited: boolean) => void;
}) {
  const text = copy[locale];
  const title =
    locale === "ar" || !property.titleEn ? property.titleAr : property.titleEn;
  const imageUrl =
    property.primaryImageUrl ?? `/api/pexels/placeholder?seed=${property.id}`;
  const isList = variant === "list";
  const pricePerSqm =
    property.area && property.area > 0
      ? Math.round(property.price / property.area)
      : null;
  const publishedDate = property.publishedAt
    ? new Date(property.publishedAt)
    : null;
  const now = new Date();
  const freshness = publishedDate
    ? (() => {
        const hoursAgo =
          (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60);
        if (hoursAgo < 24) return text.today;
        if (hoursAgo < 168) return text.thisWeek;
        return null;
      })()
    : null;

  return (
    <article
      className={cn(
        "transition-all-fast group overflow-hidden rounded-xl border border-border bg-card hover:shadow-md",
        isList && "grid md:grid-cols-[300px_1fr]",
      )}
    >
      {/* Image */}
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          isList ? "aspect-[4/3] md:aspect-auto" : "aspect-[4/3]",
        )}
      >
        <Link
          aria-label={title}
          className="absolute inset-0"
          href={`/property/${property.slug}`}
        >
          <Image
            alt={title}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            fill
            priority={priority}
            sizes={
              isList
                ? "(min-width: 768px) 300px, 100vw"
                : "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
            }
            src={imageUrl}
          />
        </Link>

        {/* Status badge */}
        <span
          className={cn(
            "absolute start-3 top-3 rounded-md px-2.5 py-1 text-caption font-semibold text-white",
            property.listingType === "SALE" ? "bg-success" : "bg-primary",
          )}
        >
          {property.listingType === "SALE" ? text.sale : text.rent}
        </span>

        {/* Featured / Freshness badge */}
        {property.isFeatured ? (
          <span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-md bg-gold px-2.5 py-1 text-caption font-semibold text-gold-foreground">
            <Star className="size-3" />
            {text.featured}
          </span>
        ) : freshness ? (
          <span className="absolute end-3 top-3 rounded-md bg-foreground/80 px-2.5 py-1 text-caption font-semibold text-white backdrop-blur-sm">
            {freshness}
          </span>
        ) : null}

        {/* Favorite */}
        {showFavoriteButton ? (
          <FavoriteButton
            className="absolute bottom-3 end-3"
            compact
            initialFavorited={initialFavorited}
            locale={locale}
            onFavoriteChange={onFavoriteChange}
            propertyId={property.id}
          />
        ) : null}
      </div>

      {/* Content */}
      <div className="grid gap-3 p-4">
        {/* Price */}
        <div className="text-h4 font-bold text-foreground">
          {formatPrice(property, locale)}
        </div>

        {/* Title */}
        <Link href={`/property/${property.slug}`}>
          <h3 className="transition-colors-fast line-clamp-2 text-body font-medium text-foreground hover:text-primary">
            {title}
          </h3>
        </Link>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-small text-muted-foreground">
          <MapPin className="size-3.5 shrink-0 text-muted-foreground/60" />
          <span className="truncate">
            {localizeName(property.city, locale)}
            {locale === "ar" ? "،" : ", "}
            {localizeName(property.region, locale)}
          </span>
        </div>

        {/* Specs — clean, no chips */}
        <div className="flex items-center gap-3 text-small text-muted-foreground">
          {property.bedrooms !== null ? (
            <span className="flex items-center gap-1">
              <BedDouble className="size-3.5" />
              {property.bedrooms} {text.beds}
            </span>
          ) : null}
          {property.bathrooms !== null ? (
            <span className="flex items-center gap-1">
              <Bath className="size-3.5" />
              {property.bathrooms} {text.baths}
            </span>
          ) : null}
          {property.area ? (
            <span className="flex items-center gap-1">
              <Maximize2 className="size-3.5" />
              {property.area} {text.areaUnit}
            </span>
          ) : null}
        </div>

        {/* Price per sqm */}
        {pricePerSqm ? (
          <p className="text-caption text-muted-foreground">
            {formatPrice({ ...property, price: pricePerSqm }, locale)}/
            {text.areaUnit}
          </p>
        ) : null}

        {/* Compare toggle */}
        <div className="pt-1">
          <ComparisonToggleButton
            locale={locale}
            property={{
              id: property.id,
              slug: property.slug,
              title,
              price: property.price,
              currency: property.currency,
            }}
          />
        </div>
      </div>
    </article>
  );
}
