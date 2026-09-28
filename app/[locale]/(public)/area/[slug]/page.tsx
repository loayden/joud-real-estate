import { ArrowUpLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PropertyGrid } from "@/components/property/PropertyGrid";
import { Button } from "@/components/ui/button";
import { Link, type Locale } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getFavoritePropertyIds } from "@/lib/favorites";
import { prisma } from "@/lib/prisma";
import {
  propertyListInclude,
  serializePropertyListItem,
} from "@/lib/property-listing";
import { absoluteUrl, alternateLanguages, localizedUrl } from "@/lib/seo";

const copy = {
  ar: {
    title: "عقارات في",
    description: "اكتشف أفضل العقارات للبيع والإيجار في",
    avgPrice: "متوسط السعر",
    pricePerSqm: "متوسط السعر/م²",
    totalProperties: "عدد العقارات",
    forSale: "للبيع",
    forRent: "للإيجار",
    viewAll: "عرض كل العقارات في هذه المنطقة",
    noProperties: "لا توجد عقارات في هذه المنطقة حالياً.",
    browseAll: "تصفح كل العقارات",
  },
  en: {
    title: "Properties in",
    description: "Discover the best properties for sale and rent in",
    avgPrice: "Average Price",
    pricePerSqm: "Avg Price/sqm",
    totalProperties: "Total Properties",
    forSale: "For Sale",
    forRent: "For Rent",
    viewAll: "View all properties in this area",
    noProperties: "No properties in this area yet.",
    browseAll: "Browse All Properties",
  },
} as const;

export const revalidate = 300;

type AreaData =
  | {
      kind: "city";
      nameAr: string;
      nameEn: string;
      slug: string;
      parentNameAr: string;
      parentNameEn: string;
      filterParam: string;
      properties: ReturnType<typeof serializePropertyListItem>[];
      avgPrice: number;
      pricePerSqm: number;
      totalCount: number;
      saleCount: number;
      rentCount: number;
    }
  | {
      kind: "region";
      nameAr: string;
      nameEn: string;
      slug: string;
      parentNameAr: string;
      parentNameEn: string;
      filterParam: string;
      properties: ReturnType<typeof serializePropertyListItem>[];
      avgPrice: number;
      pricePerSqm: number;
      totalCount: number;
      saleCount: number;
      rentCount: number;
    };

function toAreaStats(
  aggregateStats: {
    _avg: { price: unknown; area: unknown };
    _count: { id: number };
  },
  listingTypeStats: Array<{ listingType: string; _count: { id: number } }>,
) {
  const avgPrice = aggregateStats._avg.price
    ? Number(aggregateStats._avg.price)
    : 0;
  const avgArea = aggregateStats._avg.area
    ? Number(aggregateStats._avg.area)
    : 0;
  const listingTypeCounts = new Map(
    listingTypeStats.map((s) => [s.listingType, s._count.id]),
  );

  return {
    avgPrice,
    pricePerSqm: avgArea > 0 ? Math.round(avgPrice / avgArea) : 0,
    totalCount: aggregateStats._count.id,
    saleCount: listingTypeCounts.get("SALE") ?? 0,
    rentCount: listingTypeCounts.get("RENT") ?? 0,
  };
}

async function getAreaData(slug: string): Promise<AreaData | null> {
  const city = await prisma.city.findUnique({
    where: { slug },
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      slug: true,
      region: { select: { nameAr: true, nameEn: true, slug: true } },
    },
  });

  if (city) {
    const [properties, aggregateStats, listingTypeStats] = await Promise.all([
      prisma.property.findMany({
        where: { cityId: city.id, status: "APPROVED" },
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
        take: 12,
        include: propertyListInclude,
      }),
      prisma.property.aggregate({
        where: { cityId: city.id, status: "APPROVED" },
        _avg: { price: true, area: true },
        _count: { id: true },
      }),
      prisma.property.groupBy({
        by: ["listingType"],
        where: { cityId: city.id, status: "APPROVED" },
        _count: { id: true },
      }),
    ]);

    return {
      kind: "city",
      nameAr: city.nameAr,
      nameEn: city.nameEn,
      slug: city.slug,
      parentNameAr: city.region.nameAr,
      parentNameEn: city.region.nameEn,
      filterParam: `citySlug=${city.slug}`,
      properties: properties.map(serializePropertyListItem),
      ...toAreaStats(aggregateStats, listingTypeStats),
    };
  }

  const region = await prisma.region.findUnique({
    where: { slug },
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      slug: true,
      cities: { select: { id: true } },
    },
  });

  if (!region) return null;

  const cityIds = region.cities.map((c) => c.id);
  const where = { cityId: { in: cityIds }, status: "APPROVED" as const };
  const [properties, aggregateStats, listingTypeStats] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      take: 12,
      include: propertyListInclude,
    }),
    prisma.property.aggregate({
      where,
      _avg: { price: true, area: true },
      _count: { id: true },
    }),
    prisma.property.groupBy({
      by: ["listingType"],
      where,
      _count: { id: true },
    }),
  ]);

  return {
    kind: "region",
    nameAr: region.nameAr,
    nameEn: region.nameEn,
    slug: region.slug,
    parentNameAr: "",
    parentNameEn: "",
    filterParam: `regionSlug=${region.slug}`,
    properties: properties.map(serializePropertyListItem),
    ...toAreaStats(aggregateStats, listingTypeStats),
  };
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata> {
  const data = await getAreaData(slug);
  if (!data) return { title: "Area not found" };

  const isArabic = locale === "ar";
  const cityName = isArabic ? data.nameAr : data.nameEn;
  const title = isArabic
    ? `عقارات ${cityName} - أسعار ومعلومات`
    : `${cityName} Properties - Prices & Info`;
  const description = isArabic
    ? `اكتشف العقارات في ${cityName}. متوسط السعر: ${data.avgPrice.toLocaleString("ar-EG")} ج.م. ${data.totalCount} عقار متاح.`
    : `Discover properties in ${cityName}. Average price: ${data.avgPrice.toLocaleString("en-US")} EGP. ${data.totalCount} properties available.`;
  const path = `/area/${slug}`;
  const url = localizedUrl(locale, path);

  return {
    title,
    description,
    alternates: {
      canonical: url,
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
      url,
    },
    robots: { follow: true, index: true },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/images/joud-hero.jpg")],
    },
  };
}

function formatCurrency(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    currency: "EGP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export default async function AreaDetailPage({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}) {
  const text = copy[locale];
  const data = await getAreaData(slug);

  if (!data) notFound();

  const {
    properties,
    avgPrice,
    pricePerSqm,
    totalCount,
    saleCount,
    rentCount,
  } = data;
  const cityName = locale === "ar" ? data.nameAr : data.nameEn;
  const regionName =
    data.kind === "city"
      ? locale === "ar"
        ? data.parentNameAr
        : data.parentNameEn
      : "";

  const session = await auth();
  const favoriteIds = await getFavoritePropertyIds(
    session?.user?.id,
    properties.map((p) => p.id),
  );

  return (
    <div className="bg-background">
      <section className="border-b border-border">
        <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-2">
            <div className="flex items-center gap-1.5 text-small text-muted-foreground">
              <Link
                href="/properties"
                className="transition-colors-fast hover:text-foreground"
              >
                {locale === "ar" ? "الرئيسية" : "Home"}
              </Link>
              <span>/</span>
              <Link
                href="/properties"
                className="transition-colors-fast hover:text-foreground"
              >
                {locale === "ar" ? "العقارات" : "Properties"}
              </Link>
              <span>/</span>
              <span className="text-foreground">{cityName}</span>
            </div>
            <h1 className="text-h1">
              {text.title} {cityName}
            </h1>
            <p className="max-w-2xl text-body text-muted-foreground">
              {text.description} {cityName}
              {regionName ? (
                <>
                  {locale === "ar" ? "، " : ", "}
                  {regionName}
                </>
              ) : null}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
            <div className="bg-background px-5 py-4">
              <p className="text-caption text-muted-foreground">
                {text.avgPrice}
              </p>
              <p className="mt-1 text-h4 font-bold text-foreground">
                {formatCurrency(avgPrice, locale)}
              </p>
            </div>
            <div className="bg-background px-5 py-4">
              <p className="text-caption text-muted-foreground">
                {text.pricePerSqm}
              </p>
              <p className="mt-1 text-h4 font-bold text-foreground">
                {formatCurrency(pricePerSqm, locale)}/m²
              </p>
            </div>
            <div className="bg-background px-5 py-4">
              <p className="text-caption text-muted-foreground">
                {text.totalProperties}
              </p>
              <p className="mt-1 text-h4 font-bold text-foreground">
                {totalCount.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
              </p>
            </div>
            <div className="bg-background px-5 py-4">
              <p className="text-caption text-muted-foreground">
                {text.forSale} / {text.forRent}
              </p>
              <p className="mt-1 text-h4 font-bold text-foreground">
                {saleCount} / {rentCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-h3">
            {locale === "ar" ? "أحدث العقارات" : "Latest Properties"}
          </h2>
          <Button asChild variant="secondary" size="sm">
            <Link href={`/properties?${data.filterParam}`}>
              {text.viewAll}
              <ArrowUpLeft className="size-4" />
            </Link>
          </Button>
        </div>
        {properties.length > 0 ? (
          <PropertyGrid
            favoriteIds={favoriteIds}
            locale={locale}
            priorityCount={4}
            properties={properties}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-background p-12 text-center text-body text-muted-foreground">
            {text.noProperties}
          </div>
        )}
      </section>
    </div>
  );
}
