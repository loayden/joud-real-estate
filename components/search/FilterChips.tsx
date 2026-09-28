"use client";

import { X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";

import { usePathname, useRouter, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import type { SearchFilterLookups } from "./types";

type Chip = {
  key: string;
  label: string;
  params: string[];
};

const copy = {
  ar: {
    search: "بحث",
    listingType: "نوع الإعلان",
    sale: "للبيع",
    rent: "للإيجار",
    region: "المنطقة",
    city: "المدينة",
    category: "التصنيف",
    type: "النوع",
    minPrice: "من",
    maxPrice: "إلى",
    minArea: "مساحة من",
    maxArea: "مساحة إلى",
    bedrooms: "غرف نوم",
    bathrooms: "دورات مياه",
    remove: "إزالة",
    clearAll: "مسح الكل",
    egp: "ج.م",
    sqm: "م²",
  },
  en: {
    search: "Search",
    listingType: "Listing",
    sale: "For sale",
    rent: "For rent",
    region: "Region",
    city: "City",
    category: "Category",
    type: "Type",
    minPrice: "From",
    maxPrice: "To",
    minArea: "Area from",
    maxArea: "Area to",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    remove: "Remove",
    clearAll: "Clear all",
    egp: "EGP",
    sqm: "sqm",
  },
} as const;

function localize(
  item: { nameAr: string; nameEn: string } | undefined,
  locale: Locale,
) {
  if (!item) return undefined;
  return locale === "ar" ? item.nameAr : item.nameEn;
}

function formatNumber(value: string, locale: Locale) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;

  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function FilterChips({
  locale,
  lookups,
  className,
}: {
  locale: Locale;
  lookups: SearchFilterLookups;
  className?: string;
}) {
  const text = copy[locale];
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const chips = useMemo<Chip[]>(() => {
    const regionValue =
      searchParams.get("regionId") ??
      searchParams.get("region") ??
      searchParams.get("regionSlug");
    const cityValue =
      searchParams.get("cityId") ??
      searchParams.get("city") ??
      searchParams.get("citySlug");
    const categoryId = searchParams.get("categoryId");
    const typeId = searchParams.get("typeId");
    const region = lookups.regions.find(
      (item) => item.id === regionValue || item.slug === regionValue,
    );
    const city =
      lookups.regions
        .flatMap((item) => item.cities)
        .find((item) => item.id === cityValue || item.slug === cityValue) ??
      undefined;
    const category = lookups.categories.find((item) => item.id === categoryId);
    const type =
      lookups.categories
        .flatMap((item) => item.types)
        .find((item) => item.id === typeId) ?? undefined;

    const nextChips: Chip[] = [];
    const q = searchParams.get("q");
    const listingType = searchParams.get("listingType");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minArea = searchParams.get("minArea");
    const maxArea = searchParams.get("maxArea");
    const bedrooms = searchParams.get("bedrooms");
    const bathrooms = searchParams.get("bathrooms");

    if (q) {
      nextChips.push({
        key: "q",
        label: `${text.search}: ${q}`,
        params: ["q"],
      });
    }

    if (listingType === "SALE" || listingType === "RENT") {
      nextChips.push({
        key: "listingType",
        label: `${text.listingType}: ${listingType === "SALE" ? text.sale : text.rent}`,
        params: ["listingType"],
      });
    }

    if (region) {
      nextChips.push({
        key: "region",
        label: `${text.region}: ${localize(region, locale)}`,
        params: ["regionId", "region", "cityId", "city"],
      });
    }

    if (city) {
      nextChips.push({
        key: "city",
        label: `${text.city}: ${localize(city, locale)}`,
        params: ["cityId", "city"],
      });
    }

    if (category) {
      nextChips.push({
        key: "category",
        label: `${text.category}: ${localize(category, locale)}`,
        params: ["categoryId", "typeId"],
      });
    }

    if (type) {
      nextChips.push({
        key: "type",
        label: `${text.type}: ${localize(type, locale)}`,
        params: ["typeId"],
      });
    }

    if (minPrice) {
      nextChips.push({
        key: "minPrice",
        label: `${text.minPrice}: ${formatNumber(minPrice, locale)} ${text.egp}`,
        params: ["minPrice"],
      });
    }

    if (maxPrice) {
      nextChips.push({
        key: "maxPrice",
        label: `${text.maxPrice}: ${formatNumber(maxPrice, locale)} ${text.egp}`,
        params: ["maxPrice"],
      });
    }

    if (minArea) {
      nextChips.push({
        key: "minArea",
        label: `${text.minArea}: ${formatNumber(minArea, locale)} ${text.sqm}`,
        params: ["minArea"],
      });
    }

    if (maxArea) {
      nextChips.push({
        key: "maxArea",
        label: `${text.maxArea}: ${formatNumber(maxArea, locale)} ${text.sqm}`,
        params: ["maxArea"],
      });
    }

    if (bedrooms) {
      nextChips.push({
        key: "bedrooms",
        label: `${text.bedrooms}: ${formatNumber(bedrooms, locale)}+`,
        params: ["bedrooms"],
      });
    }

    if (bathrooms) {
      nextChips.push({
        key: "bathrooms",
        label: `${text.bathrooms}: ${formatNumber(bathrooms, locale)}+`,
        params: ["bathrooms"],
      });
    }

    return nextChips;
  }, [locale, lookups.categories, lookups.regions, searchParams, text]);

  function removeParams(keys: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    keys.forEach((key) => params.delete(key));
    params.delete("page");
    const query = params.toString();

    startTransition(() => {
      router.push((query ? `${pathname}?${query}` : pathname) as never);
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <span
          className="inline-flex h-9 max-w-full items-center gap-2 rounded-md border border-primary/15 bg-primary-50 px-3 text-sm font-bold text-primary"
          key={chip.key}
        >
          <span className="truncate">{chip.label}</span>
          <button
            aria-label={`${text.remove} ${chip.label}`}
            className="grid size-5 shrink-0 place-items-center rounded-sm transition-colors hover:bg-primary/10"
            disabled={isPending}
            onClick={() => removeParams(chip.params)}
            type="button"
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      <button
        className="h-9 rounded-md px-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        disabled={isPending}
        onClick={() => {
          startTransition(() => {
            router.push(pathname as never);
          });
        }}
        type="button"
      >
        {text.clearAll}
      </button>
    </div>
  );
}
