import type { Metadata } from "next";
import {
  SearchX,
  SlidersHorizontal,
  MapPin,
  Map,
  LayoutGrid,
} from "lucide-react";

import { PropertyGrid } from "@/components/property/PropertyGrid";
import { FilterChips } from "@/components/search/FilterChips";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { MapView } from "@/components/search/MapView";
import { SaveSearchButton } from "@/components/search/SaveSearchButton";
import { SearchBar } from "@/components/search/SearchBar";
import { SortSelect } from "@/components/search/SortSelect";
import type { SearchFilterLookups } from "@/components/search/types";
import { Pagination } from "@/components/shared/Pagination";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, type Locale } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getFavoritePropertyIds } from "@/lib/favorites";
import {
  normalizeSearchParams,
  searchProperties,
  type SearchParams,
} from "@/lib/property-search";
import { prisma } from "@/lib/prisma";
import { publicSearchCacheKey } from "@/lib/public-properties";
import { getCached } from "@/lib/redis";
import { formatArabicCount } from "@/lib/plural";
import { absoluteUrl, alternateLanguages, localizedUrl } from "@/lib/seo";

const PAGE_SIZE = 20;

const resultUnitForms = {
  one: "نتيجة",
  two: "نتيجتان",
  few: "نتائج",
  many: "نتيجة",
} as const;

export const dynamic = "force-dynamic";

const copy = {
  ar: {
    title: "البحث عن العقارات",
    description:
      "ابحث في العقارات المعتمدة باستخدام الكلمات المفتاحية والفلاتر الدقيقة.",
    filters: "الفلاتر",
    result: "نتيجة",
    sort: "الترتيب",
    emptyTitle: "لا توجد نتائج مطابقة",
    emptyDescription: "جرّب توسيع نطاق البحث أو إزالة بعض الفلاتر.",
    browseAll: "عرض كل العقارات",
    previous: "السابق",
    next: "التالي",
    invalidFilters:
      "بعض قيم الفلاتر غير صحيحة. عدّل الأسعار أو المساحات ثم حاول مرة أخرى.",
    quickSearch: "بحث سريع حسب المنطقة",
    cairo: "القاهرة",
    giza: "الجيزة",
    newCairo: "القاهرة الجديدة",
    sheikhZayed: "الشيخ زايد",
    october: "6 أكتوبر",
    newCapital: "العاصمة الإدارية",
    mapView: "الخريطة",
    listView: "القائمة",
    gridView: "الشبكة",
  },
  en: {
    title: "Search Properties",
    description:
      "Search approved listings with keywords and precise property filters.",
    filters: "Filters",
    result: "results",
    sort: "Sort",
    emptyTitle: "No matching results",
    emptyDescription: "Try widening the search or removing some filters.",
    browseAll: "View all properties",
    previous: "Previous",
    next: "Next",
    invalidFilters:
      "Some filter values are invalid. Adjust price or area ranges and try again.",
    quickSearch: "Quick search by area",
    cairo: "Cairo",
    giza: "Giza",
    newCairo: "New Cairo",
    sheikhZayed: "Sheikh Zayed",
    october: "6th October",
    newCapital: "New Capital",
    mapView: "Map",
    listView: "List",
    gridView: "Grid",
  },
} as const;

function buildUrlFactory(
  searchParams: Record<string, string | string[] | undefined>,
) {
  return (nextPage: number) => {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(searchParams)) {
      const normalizedValue = Array.isArray(value) ? value[0] : value;
      if (normalizedValue) params.set(key, normalizedValue);
    }

    params.set("page", String(nextPage));
    return `/search?${params.toString()}`;
  };
}

function getString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildSearchPath(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    const normalizedValue = Array.isArray(value) ? value[0] : value;
    if (normalizedValue) params.set(key, normalizedValue);
  }

  const query = params.toString();
  return `/search${query ? `?${query}` : ""}`;
}

function describeSearch(
  locale: Locale,
  searchParams: Record<string, string | string[] | undefined>,
) {
  const q = getString(searchParams.q)?.trim();
  const listingType = getString(searchParams.listingType);
  const city = getString(searchParams.city);
  const region = getString(searchParams.region);
  const location = city || region;
  const isArabic = locale === "ar";

  if (q) {
    return isArabic
      ? `نتائج البحث عن ${q} في عقارات جود العقارية مع فلاتر السعر والمساحة والمدينة.`
      : `Search results for ${q} on Joud Real Estate with price, area, and city filters.`;
  }

  if (listingType === "SALE") {
    return isArabic
      ? `ابحث عن عقارات للبيع${location ? ` في ${location}` : ""} مع فلاتر دقيقة للسعر والمساحة.`
      : `Search properties for sale${location ? ` in ${location}` : ""} with precise price and area filters.`;
  }

  if (listingType === "RENT") {
    return isArabic
      ? `ابحث عن عقارات للإيجار${location ? ` في ${location}` : ""} مع فلاتر دقيقة للسعر والمساحة.`
      : `Search properties for rent${location ? ` in ${location}` : ""} with precise price and area filters.`;
  }

  return isArabic
    ? "ابحث عن عقارات للبيع والإيجار في جمهورية مصر العربية مع فلاتر السعر والمساحة والمدينة."
    : "Search properties for sale and rent in Egypt with price, area, and city filters.";
}

async function getDefaultSearchParams(): Promise<SearchParams> {
  const params = normalizeSearchParams({ page: "1", limit: String(PAGE_SIZE) });
  if (!params) {
    throw new Error("Default search params failed validation.");
  }

  return params;
}

async function getFilterLookups(): Promise<SearchFilterLookups> {
  const [regions, categories] = await Promise.all([
    prisma.region.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        slug: true,
        cities: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            slug: true,
          },
        },
      },
    }),
    prisma.propertyCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        slug: true,
        types: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  return { regions, categories };
}

export async function generateMetadata({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  const isArabic = locale === "ar";
  const title = isArabic ? "البحث عن العقارات" : "Search Properties";
  const description = describeSearch(locale, searchParams);
  const path = buildSearchPath(searchParams);
  const normalizedParams = normalizeSearchParams({
    ...searchParams,
    limit: "1",
  });
  const resultCount = normalizedParams
    ? (
        await getCached(
          await publicSearchCacheKey(normalizedParams),
          () => searchProperties(normalizedParams),
          300,
        )
      ).total
    : 0;
  const shouldIndex = normalizedParams !== null && resultCount > 0;

  return {
    title,
    description,
    alternates: {
      canonical: localizedUrl(locale, path),
      languages: alternateLanguages(path),
    },
    openGraph: {
      title,
      description,
      images: [
        {
          url: absoluteUrl("/images/joud-hero.jpg"),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: isArabic ? "ar_EG" : "en_US",
      type: "website",
      url: localizedUrl(locale, path),
    },
    robots: {
      follow: true,
      index: shouldIndex,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/images/joud-hero.jpg")],
    },
  };
}

export default async function SearchPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const text = copy[locale];
  const normalizedParams = normalizeSearchParams({
    ...searchParams,
    limit: String(PAGE_SIZE),
  });
  const params = normalizedParams ?? (await getDefaultSearchParams());
  const viewParam = getString(searchParams.view);
  const view =
    viewParam === "map" ? "map" : viewParam === "list" ? "list" : "grid";
  const sort = getString(searchParams.sort) ?? "newest";
  const [results, lookups, session] = await Promise.all([
    normalizedParams
      ? getCached(
          await publicSearchCacheKey(params),
          () => searchProperties(params),
          300,
        )
      : Promise.resolve({ data: [], total: 0, page: 1, totalPages: 0 }),
    getFilterLookups(),
    auth(),
  ]);
  const favoriteIds = await getFavoritePropertyIds(
    session?.user?.id,
    results.data.map((property) => property.id),
  );
  const currentPage = Math.min(params.page, Math.max(1, results.totalPages));

  return (
    <div className="bg-background">
      <section className="border-b border-border">
        <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-2">
            <h1 className="text-h1">{text.title}</h1>
            <p className="max-w-2xl text-body text-muted-foreground">
              {text.description}
            </p>
          </div>

          <SearchBar locale={locale} />

          {/* Quick area chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-small text-muted-foreground">
              {text.quickSearch}:
            </span>
            {[
              { slug: "cairo", label: text.cairo },
              { slug: "giza", label: text.giza },
              { slug: "new-cairo", label: text.newCairo },
              { slug: "sheikh-zayed", label: text.sheikhZayed },
              { slug: "6th-october", label: text.october },
              { slug: "new-administrative-capital", label: text.newCapital },
            ].map((area) => (
              <Link
                key={area.slug}
                href={`/search?regionSlug=${area.slug}`}
                className="transition-all-fast inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-small text-muted-foreground hover:border-primary/40 hover:bg-primary-50/50 hover:text-foreground"
              >
                <MapPin className="size-3" />
                {area.label}
              </Link>
            ))}
          </div>

          {/* Results count + filter controls */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span
                aria-live="polite"
                className="text-body font-medium text-foreground"
                role="status"
              >
                {formatArabicCount(
                  results.total,
                  locale,
                  resultUnitForms,
                  "results",
                  "result",
                )}
              </span>
              <FilterChips locale={locale} lookups={lookups} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SaveSearchButton locale={locale} />

              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    className="lg:hidden"
                    type="button"
                    variant="secondary"
                    size="sm"
                  >
                    <SlidersHorizontal className="size-4" />
                    {text.filters}
                  </Button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto">
                  <SheetHeader className="mb-5">
                    <SheetTitle>{text.filters}</SheetTitle>
                  </SheetHeader>
                  <FilterSidebar
                    className="border-0 p-0 shadow-none"
                    locale={locale}
                    lookups={lookups}
                  />
                </SheetContent>
              </Sheet>

              <SortSelect
                currentSort={sort}
                currentView={view === "map" ? "grid" : view}
                locale={locale}
              />

              {/* View toggle */}
              <div
                className="flex items-center rounded-xl border border-border bg-background p-1"
                role="group"
                aria-label={text.gridView}
              >
                <Link
                  aria-label={text.gridView}
                  aria-pressed={view === "grid"}
                  href={`/search?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(searchParams.toString())), view: "grid" }).toString()}`}
                  className={`transition-colors-fast inline-flex min-h-9 min-w-11 items-center justify-center gap-1 rounded-lg px-3 py-2 text-caption font-medium ${view === "grid" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <LayoutGrid className="size-3.5" />
                </Link>
                <Link
                  aria-label={text.listView}
                  aria-pressed={view === "list"}
                  href={`/search?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(searchParams.toString())), view: "list" }).toString()}`}
                  className={`transition-colors-fast inline-flex min-h-9 min-w-11 items-center justify-center gap-1 rounded-lg px-3 py-2 text-caption font-medium ${view === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {text.listView}
                </Link>
                <Link
                  aria-label={text.mapView}
                  aria-pressed={view === "map"}
                  href={`/search?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(searchParams.toString())), view: "map" }).toString()}`}
                  className={`transition-colors-fast inline-flex min-h-9 min-w-11 items-center justify-center gap-1 rounded-lg px-3 py-2 text-caption font-medium ${view === "map" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Map className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {!normalizedParams ? (
            <Alert variant="destructive">{text.invalidFilters}</Alert>
          ) : null}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <FilterSidebar locale={locale} lookups={lookups} />
        </aside>

        <div className="min-w-0">
          {results.data.length > 0 ? (
            <div className="grid gap-8">
              {view === "map" ? (
                <MapView locale={locale} properties={results.data} />
              ) : (
                <PropertyGrid
                  locale={locale}
                  favoriteIds={favoriteIds}
                  priorityCount={view === "grid" ? 4 : 2}
                  properties={results.data}
                  view={view}
                />
              )}
              <Pagination
                buildUrl={buildUrlFactory(searchParams)}
                labels={{ previous: text.previous, next: text.next }}
                page={currentPage}
                totalPages={results.totalPages}
              />
            </div>
          ) : (
            <div className="grid min-h-80 place-items-center rounded-xl border border-dashed border-border bg-background p-12 text-center">
              <div className="grid max-w-md justify-items-center gap-3">
                <SearchX className="size-12 text-muted-foreground/40" />
                <h2 className="text-h3">{text.emptyTitle}</h2>
                <p className="text-body text-muted-foreground">
                  {text.emptyDescription}
                </p>
                <Button asChild className="mt-2">
                  <Link href="/search">{text.browseAll}</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
