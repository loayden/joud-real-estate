import { Bath, BedDouble, MapPin, Maximize2, Star } from "lucide-react";
import Image from "next/image";

import { ComparisonToggleButton } from "@/components/property/ComparisonDrawer";
import { FavoriteButton } from "@/components/property/FavoriteButton";
import { Skeleton } from "@/components/ui/skeleton";
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
        "transition-lift group overflow-hidden rounded-2xl border border-border bg-card shadow-xs hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift",
        isList && "grid sm:grid-cols-[280px_1fr]",
      )}
    >
      {/* Image */}
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          isList ? "aspect-[16/10] sm:aspect-auto sm:min-h-52" : "aspect-[4/3]",
        )}
      >
        {/* Decorative image link — the title link below is the accessible one */}
        <Link
          aria-hidden
          className="absolute inset-0"
          href={`/property/${property.slug}`}
          tabIndex={-1}
        >
          <Image
            alt=""
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            fill
            priority={priority}
            sizes={
              isList
                ? "(min-width: 640px) 280px, 100vw"
                : "(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            }
            src={imageUrl}
          />
        </Link>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        {/* Status badge */}
        <span
          className={cn(
            "tnum absolute start-3 top-3 rounded-full px-3 py-1 text-caption font-bold text-white shadow-sm",
            property.listingType === "SALE" ? "bg-success" : "bg-primary",
          )}
        >
          {property.listingType === "SALE" ? text.sale : text.rent}
        </span>

        {/* Featured / Freshness badge */}
        {property.isFeatured ? (
          <span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1 text-caption font-bold text-gold-foreground shadow-sm">
            <Star className="size-3 fill-current" />
            {text.featured}
          </span>
        ) : freshness ? (
          <span className="absolute end-3 top-3 rounded-full bg-black/55 px-3 py-1 text-caption font-bold text-white">
            {freshness}
          </span>
        ) : null}

        {/* Favorite */}
        {showFavoriteButton ? (
          <FavoriteButton
            className="absolute bottom-3 end-3 shadow-md"
            compact
            initialFavorited={initialFavorited}
            locale={locale}
            onFavoriteChange={onFavoriteChange}
            propertyId={property.id}
          />
        ) : null}
      </div>

      {/* Content */}
      <div className="grid content-start gap-2.5 p-4 sm:p-5">
        {/* Price */}
        <div className="tnum text-xl font-bold tracking-tight text-foreground">
          {formatPrice(property, locale)}
        </div>

        {/* Title */}
        <Link href={`/property/${property.slug}`}>
          <h3 className="transition-colors-fast line-clamp-2 text-pretty text-body font-medium leading-snug text-foreground hover:text-primary">
            {title}
          </h3>
        </Link>

        {/* Location */}
        <div className="flex min-w-0 items-center gap-1.5 text-small text-muted-foreground">
          <MapPin className="size-3.5 shrink-0 text-muted-foreground/60" />
          <span className="truncate">
            {localizeName(property.city, locale)}
            {locale === "ar" ? "،" : ", "}
            {localizeName(property.region, locale)}
          </span>
        </div>

        {/* Specs */}
        <div className="tnum flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-muted-foreground">
          {property.bedrooms !== null ? (
            <span className="inline-flex items-center gap-1">
              <BedDouble className="size-3.5" />
              {property.bedrooms} {text.beds}
            </span>
          ) : null}
          {property.bathrooms !== null ? (
            <span className="inline-flex items-center gap-1">
              <Bath className="size-3.5" />
              {property.bathrooms} {text.baths}
            </span>
          ) : null}
          {property.area ? (
            <span className="inline-flex items-center gap-1">
              <Maximize2 className="size-3.5" />
              {property.area} {text.areaUnit}
            </span>
          ) : null}
        </div>

        {/* Price per sqm */}
        {pricePerSqm ? (
          <p className="tnum text-caption text-muted-foreground">
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

export function PropertyCardSkeleton({
  variant = "grid",
}: {
  variant?: "grid" | "list";
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card",
        variant === "list" && "grid sm:grid-cols-[280px_1fr]",
      )}
    >
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="grid content-start gap-3 p-4 sm:p-5">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <div className="flex gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
