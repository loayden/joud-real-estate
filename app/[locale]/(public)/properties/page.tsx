import type { Metadata } from "next";
import { Building2 } from "lucide-react";

import { PropertyGrid } from "@/components/property/PropertyGrid";
import { SortSelect } from "@/components/search/SortSelect";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Link, type Locale } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getFavoritePropertyIds } from "@/lib/favorites";
import { parseListingType } from "@/lib/property-listing";
import { getApprovedPropertyList } from "@/lib/public-properties";
import { absoluteUrl, alternateLanguages, localizedUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export const dynamic = "force-dynamic";

const copy = {
  ar: {
    title: "تصفح العقارات",
    description: "اكتشف أفضل العقارات للبيع والإيجار في جمهورية مصر العربية.",
    all: "الكل",
    sale: "للبيع",
    rent: "للإيجار",
    result: "نتيجة",
    emptyTitle: "لا توجد عقارات مطابقة",
    emptyDescription: "جرّب تغيير نوع الإعلان أو العودة لكل العقارات.",
    browseAll: "عرض كل العقارات",
    previous: "السابق",
    next: "التالي",
  },
  en: {
    title: "Browse Properties",
    description: "Discover properties for sale and rent in Egypt.",
    all: "All",
    sale: "For sale",
    rent: "For rent",
    result: "results",
    emptyTitle: "No matching properties",
    emptyDescription:
      "Try changing the listing type or return to all properties.",
    browseAll: "View all properties",
    previous: "Previous",
    next: "Next",
  },
} as const;

function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw ?? "1");
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function getString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

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
    return `/properties?${params.toString()}`;
  };
}

function tabHref(
  searchParams: Record<string, string | string[] | undefined>,
  listingType?: "SALE" | "RENT",
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "listingType" || key === "page") continue;
    const normalizedValue = Array.isArray(value) ? value[0] : value;
    if (normalizedValue) params.set(key, normalizedValue);
  }

  if (listingType) params.set("listingType", listingType);
  const query = params.toString();
  return query ? `/properties?${query}` : "/properties";
}

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  const isArabic = locale === "ar";
  const title = isArabic ? "تصفح العقارات" : "Browse Properties";
  const description = isArabic
    ? "اكتشف أفضل العقارات للبيع والإيجار في جمهورية مصر العربية مع صور وأسعار ومواصفات واضحة."
    : "Discover properties for sale and rent in Egypt with photos, prices, and clear specifications.";
  const url = localizedUrl(locale, "/properties");

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: alternateLanguages("/properties"),
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
      url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/images/joud-hero.jpg")],
    },
  };
}

export default async function PropertiesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const text = copy[locale];
  const page = parsePage(searchParams.page);
  const sort = getString(searchParams.sort) ?? "newest";
  const view = getString(searchParams.view) === "list" ? "list" : "grid";
  const listingType = parseListingType(getString(searchParams.listingType));
  const categoryId = getString(searchParams.categoryId);
  const q = getString(searchParams.q)?.trim();
  const session = await auth();
  const {
    data: properties,
    total,
    totalPages,
  } = await getApprovedPropertyList({
    page,
    limit: PAGE_SIZE,
    sort,
    listingType,
    categoryId,
    q,
  });
  const favoriteIds = await getFavoritePropertyIds(
    session?.user?.id,
    properties.map((property) => property.id),
  );

  const tabs = [
    { label: text.all, value: undefined },
    { label: text.sale, value: "SALE" as const },
    { label: text.rent, value: "RENT" as const },
  ];

  return (
    <div className="bg-muted/25">
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-primary-50 px-3 py-2 text-sm font-bold text-primary">
                <Building2 className="size-4" />
                {total} {text.result}
              </div>
              <h1 className="text-3xl font-bold tracking-normal md:text-4xl">
                {text.title}
              </h1>
              <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                {text.description}
              </p>
            </div>
            <SortSelect currentSort={sort} currentView={view} locale={locale} />
          </div>

          <nav className="flex flex-wrap gap-2" aria-label={text.title}>
            {tabs.map((tab) => {
              const active =
                listingType === tab.value || (!listingType && !tab.value);

              return (
                <Link
                  className={cn(
                    "inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-bold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted",
                  )}
                  href={tabHref(searchParams, tab.value)}
                  key={tab.label}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {properties.length > 0 ? (
          <>
            <PropertyGrid
              locale={locale}
              favoriteIds={favoriteIds}
              priorityCount={view === "grid" ? 4 : 2}
              properties={properties}
              view={view}
            />
            <Pagination
              buildUrl={buildUrlFactory(searchParams)}
              labels={{ previous: text.previous, next: text.next }}
              page={Math.min(page, totalPages)}
              totalPages={totalPages}
            />
          </>
        ) : (
          <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-border bg-background p-8 text-center">
            <div className="grid max-w-md gap-3">
              <h2 className="text-2xl font-bold">{text.emptyTitle}</h2>
              <p className="leading-7 text-muted-foreground">
                {text.emptyDescription}
              </p>
              <Button asChild className="mx-auto">
                <Link href="/properties">{text.browseAll}</Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
