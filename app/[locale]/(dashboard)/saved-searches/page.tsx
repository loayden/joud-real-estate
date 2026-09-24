import { Bookmark } from "lucide-react";
import type { Metadata } from "next";

import {
  SavedSearchesList,
  type SavedSearchView,
} from "@/components/search/SavedSearchesList";
import { type Locale } from "@/i18n/routing";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import {
  getUserSavedSearches,
  type SavedSearchFilters,
} from "@/lib/saved-searches";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: {
    pageTitle: "البحوث المحفوظة | جود العقارية",
    title: "البحوث المحفوظة",
    description: "ارجع إلى فلاتر البحث المهمة بنقرة واحدة.",
    count: "بحث محفوظ",
    keyword: "كلمة البحث",
    listingType: "نوع الإعلان",
    sale: "للبيع",
    rent: "للإيجار",
    region: "المنطقة",
    city: "المدينة",
    category: "التصنيف",
    type: "النوع",
    minPrice: "السعر من",
    maxPrice: "السعر إلى",
    minArea: "المساحة من",
    maxArea: "المساحة إلى",
    bedrooms: "غرف نوم",
    bathrooms: "دورات مياه",
    egp: "ج.م",
    sqm: "م²",
  },
  en: {
    pageTitle: "Saved Searches | Joud Real Estate",
    title: "Saved Searches",
    description: "Return to important search filters in one click.",
    count: "saved searches",
    keyword: "Keyword",
    listingType: "Listing",
    sale: "For sale",
    rent: "For rent",
    region: "Region",
    city: "City",
    category: "Category",
    type: "Type",
    minPrice: "Price from",
    maxPrice: "Price to",
    minArea: "Area from",
    maxArea: "Area to",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    egp: "EGP",
    sqm: "sqm",
  },
} as const;

type LookupItem = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
};

type SavedSearchLookups = {
  regions: Map<string, LookupItem>;
  cities: Map<string, LookupItem>;
  categories: Map<string, LookupItem>;
  types: Map<string, LookupItem>;
};

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  return {
    title: copy[locale].pageTitle,
  };
}

function localize(item: LookupItem | undefined, locale: Locale) {
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

async function getLookups(): Promise<SavedSearchLookups> {
  const [regions, categories] = await Promise.all([
    prisma.region.findMany({
      select: {
        id: true,
        slug: true,
        nameAr: true,
        nameEn: true,
        cities: {
          select: { id: true, slug: true, nameAr: true, nameEn: true },
        },
      },
    }),
    prisma.propertyCategory.findMany({
      select: {
        id: true,
        slug: true,
        nameAr: true,
        nameEn: true,
        types: {
          select: { id: true, slug: true, nameAr: true, nameEn: true },
        },
      },
    }),
  ]);

  return {
    regions: new Map(
      regions.flatMap((region) => [
        [region.id, region] as const,
        [region.slug, region] as const,
      ]),
    ),
    cities: new Map(
      regions.flatMap((region) =>
        region.cities.flatMap((city) => [
          [city.id, city] as const,
          [city.slug, city] as const,
        ]),
      ),
    ),
    categories: new Map(
      categories.flatMap((category) => [
        [category.id, category] as const,
        [category.slug, category] as const,
      ]),
    ),
    types: new Map(
      categories.flatMap((category) =>
        category.types.flatMap((type) => [
          [type.id, type] as const,
          [type.slug, type] as const,
        ]),
      ),
    ),
  };
}

function buildSearchHref(filters: SavedSearchFilters) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }

  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

function buildSummary(
  filters: SavedSearchFilters,
  lookups: SavedSearchLookups,
  locale: Locale,
) {
  const text = copy[locale];
  const summary: string[] = [];
  const q = filters.q;
  const listingType = filters.listingType;
  const region = lookups.regions.get(filters.regionId ?? filters.region ?? "");
  const city = lookups.cities.get(filters.cityId ?? filters.city ?? "");
  const category = lookups.categories.get(filters.categoryId ?? "");
  const type = lookups.types.get(filters.typeId ?? "");

  if (q) summary.push(`${text.keyword}: ${q}`);
  if (listingType === "SALE" || listingType === "RENT") {
    summary.push(
      `${text.listingType}: ${listingType === "SALE" ? text.sale : text.rent}`,
    );
  }
  if (region) summary.push(`${text.region}: ${localize(region, locale)}`);
  if (city) summary.push(`${text.city}: ${localize(city, locale)}`);
  if (category) {
    summary.push(`${text.category}: ${localize(category, locale)}`);
  }
  if (type) summary.push(`${text.type}: ${localize(type, locale)}`);
  if (filters.minPrice) {
    summary.push(
      `${text.minPrice}: ${formatNumber(filters.minPrice, locale)} ${text.egp}`,
    );
  }
  if (filters.maxPrice) {
    summary.push(
      `${text.maxPrice}: ${formatNumber(filters.maxPrice, locale)} ${text.egp}`,
    );
  }
  if (filters.minArea) {
    summary.push(
      `${text.minArea}: ${formatNumber(filters.minArea, locale)} ${text.sqm}`,
    );
  }
  if (filters.maxArea) {
    summary.push(
      `${text.maxArea}: ${formatNumber(filters.maxArea, locale)} ${text.sqm}`,
    );
  }
  if (filters.bedrooms) {
    summary.push(
      `${text.bedrooms}: ${formatNumber(filters.bedrooms, locale)}+`,
    );
  }
  if (filters.bathrooms) {
    summary.push(
      `${text.bathrooms}: ${formatNumber(filters.bathrooms, locale)}+`,
    );
  }

  return summary;
}

export default async function SavedSearchesPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const session = await requireSession();
  const text = copy[locale];
  const [searches, lookups] = await Promise.all([
    getUserSavedSearches(session.user.id),
    getLookups(),
  ]);
  const viewModels: SavedSearchView[] = searches.map((search) => ({
    ...search,
    href: buildSearchHref(search.filters),
    summary: buildSummary(search.filters, lookups, locale),
  }));

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="grid gap-2">
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-normal">
            <Bookmark className="size-7 text-primary" />
            {text.title}
          </h1>
          <p className="max-w-2xl text-muted-foreground">{text.description}</p>
        </div>
        <span className="w-fit rounded-full bg-muted px-3 py-1 text-sm font-bold text-muted-foreground">
          {searches.length} {text.count}
        </span>
      </div>

      <SavedSearchesList initialSearches={viewModels} locale={locale} />
    </div>
  );
}
