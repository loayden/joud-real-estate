import {
  ArrowUpRight,
  Building2,
  Search,
  Shield,
  MapPin,
  Users,
  CheckCircle,
  Home,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CategoryCardPexels } from "@/components/home/CategoryCardPexels";
import { HeroPexels } from "@/components/home/HeroPexels";
import { RecentlyViewed } from "@/components/property/RecentlyViewed";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { Reveal } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, type Locale } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getFavoritePropertyIds } from "@/lib/favorites";
import { getCategoryPexelsImages, getHeroPexelsImages } from "@/lib/pexels";
import { prisma } from "@/lib/prisma";
import {
  propertyListInclude,
  serializePropertyListItem,
} from "@/lib/property-listing";
import { arabicUnit } from "@/lib/plural";
import { getCached } from "@/lib/redis";
import { absoluteUrl, alternateLanguages, localizedUrl } from "@/lib/seo";

const copy = {
  ar: {
    heroEyebrow: "المنصة العقارية الأولى في مصر",
    searchPlaceholder: "ابحث عن شقة، فيلا، أرض، كومباوند...",
    sale: "عقارات للبيع",
    rent: "عقارات للإيجار",
    categories: "استكشف حسب التصنيف",
    featured: "عقارات مميزة",
    latest: "أحدث الإعلانات",
    allProperties: "عرض كل العقارات",
    noFeatured: "لا توجد عقارات مميزة بعد.",
    noLatest: "لا توجد عقارات منشورة بعد.",
    categoryCount: "عقار",
    statsProperties: "عقار",
    statsCities: "مدينة",
    statsCategories: "تصنيف",
    statsFeatured: "عقار مميز",
    popularAreas: "المناطق الأكثر طلباً",
    popularAreasDesc: "اكتشف أكثر المناطق شعبية في مصر",
    trustTitle: "لماذا جود العقارية؟",
    trust1Title: "موثوق وآمن",
    trust1Desc: "جميع الإعلانات مراجعة وموثقة من فريقنا",
    trust2Title: "بيانات حقيقية",
    trust2Desc: "أسعار ومواصفات محدثة باستمرار",
    trust3Title: "تواصل مباشر",
    trust3Desc: "تواصل مباشرة مع أصحاب العقارات والوسطاء",
    ctaTitle: "ابدأ رحلتك العقارية الآن",
    ctaDesc:
      "سواء كنت تبحث عن شقة للسكن أو فيلا عائلية أو استثمار عقاري، نحن هنا لمساعدتك",
    ctaButton: "تصفح العقارات",
    verified: "موثق",
    responseTime: "وقت الاستجابة",
    responseTimeValue: "أقل من ساعة",
  },
  en: {
    heroEyebrow: "Egypt's #1 Real Estate Platform",
    searchPlaceholder: "Search apartments, villas, land, compounds...",
    sale: "Properties for sale",
    rent: "Properties for rent",
    categories: "Explore by category",
    featured: "Featured listings",
    latest: "Latest listings",
    allProperties: "View all properties",
    noFeatured: "No featured listings yet.",
    noLatest: "No published listings yet.",
    categoryCount: "properties",
    statsProperties: "properties",
    statsCities: "cities",
    statsCategories: "categories",
    statsFeatured: "featured",
    popularAreas: "Most Popular Areas",
    popularAreasDesc: "Discover the most sought-after areas in Egypt",
    trustTitle: "Why Joud Real Estate?",
    trust1Title: "Trusted & Secure",
    trust1Desc: "All listings are reviewed and verified by our team",
    trust2Title: "Real Data",
    trust2Desc: "Prices and specs updated continuously",
    trust3Title: "Direct Contact",
    trust3Desc: "Connect directly with property owners and agents",
    ctaTitle: "Start Your Real Estate Journey",
    ctaDesc:
      "Whether you're looking for an apartment, a family villa, or an investment property, we're here to help",
    ctaButton: "Browse Properties",
    verified: "Verified",
    responseTime: "Response Time",
    responseTimeValue: "Under 1 hour",
  },
} as const;

const categoryIcons = ["home", "building", "key", "search"] as const;

const unitForms = {
  ar: {
    properties: { one: "عقار", two: "عقاران", few: "عقارات", many: "عقار" },
    cities: { one: "مدينة", two: "مدينتان", few: "مدن", many: "مدينة" },
  },
} as const;

const popularAreas = [
  { slug: "new-cairo", nameAr: "القاهرة الجديدة", nameEn: "New Cairo" },
  { slug: "sheikh-zayed", nameAr: "الشيخ زايد", nameEn: "Sheikh Zayed" },
  { slug: "6th-october", nameAr: "6 أكتوبر", nameEn: "6th October" },
  {
    slug: "new-administrative-capital",
    nameAr: "العاصمة الإدارية",
    nameEn: "New Capital",
  },
  { slug: "heliopolis", nameAr: "مصر الجديدة", nameEn: "Heliopolis" },
  { slug: "maadi", nameAr: "المعادي", nameEn: "Maadi" },
  { slug: "nasr-city", nameAr: "مدينة نصر", nameEn: "Nasr City" },
  { slug: "north-coast", nameAr: "الساحل الشمالي", nameEn: "North Coast" },
];

export const revalidate = 300;

async function getHomepageData() {
  return getCached(
    "homepage:public",
    async () => {
      const [
        featured,
        latest,
        categories,
        counts,
        totalProperties,
        cityCounts,
      ] = await Promise.all([
        prisma.property.findMany({
          where: { status: "APPROVED", isFeatured: true },
          orderBy: [{ featuredUntil: "desc" }, { publishedAt: "desc" }],
          take: 6,
          include: propertyListInclude,
        }),
        prisma.property.findMany({
          where: { status: "APPROVED" },
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
          take: 8,
          include: propertyListInclude,
        }),
        prisma.propertyCategory.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: { id: true, nameAr: true, nameEn: true, slug: true },
          take: 4,
        }),
        prisma.property.groupBy({
          by: ["categoryId"],
          where: { status: "APPROVED" },
          _count: { id: true },
        }),
        prisma.property.count({ where: { status: "APPROVED" } }),
        prisma.city.findMany({
          where: { isActive: true },
          select: { id: true, nameAr: true, nameEn: true, slug: true },
          orderBy: { sortOrder: "asc" },
        }),
      ]);

      const countByCategory = new Map(
        counts.map((count) => [count.categoryId, count._count.id]),
      );

      return {
        featured: featured.map(serializePropertyListItem),
        latest: latest.map(serializePropertyListItem),
        categories: categories.map((category) => ({
          ...category,
          count: countByCategory.get(category.id) ?? 0,
        })),
        totalProperties,
        cities: cityCounts,
      };
    },
    300,
  );
}

function getCategoryName(
  category: { nameAr: string; nameEn: string },
  locale: Locale,
) {
  return locale === "ar" ? category.nameAr : category.nameEn;
}

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  const isArabic = locale === "ar";
  const title = isArabic ? "جود العقارية" : "Joud Real Estate";
  const description = isArabic
    ? "ابحث عن عقارات للبيع والإيجار في مصر. شقق، فلل، أراضي، كومباوندات. أفضل الأسعار والمواصفات."
    : "Find properties for sale and rent in Egypt. Apartments, villas, land, compounds. Best prices and specifications.";
  const url = localizedUrl(locale);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: alternateLanguages(""),
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

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const text = copy[locale];
  const [site, data, session, heroImages] = await Promise.all([
    getTranslations("site"),
    getHomepageData(),
    auth(),
    getHeroPexelsImages(),
  ]);
  const { featured, latest, categories, totalProperties, cities } = data;
  const categoryImageEntries = await Promise.all(
    categories.map(async (category) => {
      const images = await getCategoryPexelsImages(category.slug);
      return [category.slug, images[0] ?? null] as const;
    }),
  );
  const categoryImageBySlug = new Map(categoryImageEntries);
  const favoriteIds = await getFavoritePropertyIds(
    session?.user?.id,
    Array.from(
      new Set([...featured, ...latest].map((property) => property.id)),
    ),
  );

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-primary-900 text-white">
        <HeroPexels photos={heroImages} />
        <div className="absolute inset-0 bg-primary-950/45" />
        {/* Direction-aware legibility gradient: weighted toward the text side */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-950/85 via-primary-950/45 to-primary-950/10 rtl:bg-gradient-to-l" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-primary-950/60 to-transparent" />
        <div className="relative mx-auto flex min-h-[540px] w-full max-w-7xl items-center px-4 py-16 sm:px-6 md:min-h-[600px] lg:px-8">
          <div className="max-w-3xl">
            <div className="glass-dark mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-small font-medium text-white/90">
              <Building2 className="size-4 text-gold-300" />
              {text.heroEyebrow}
            </div>
            <h1
              className="text-balance font-bold text-white"
              style={{
                fontSize: "clamp(2.5rem, 5vw + 1rem, 4rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
              }}
            >
              {site("name")}
            </h1>
            <p className="mt-5 max-w-2xl text-body-lg text-white/75">
              {site("tagline")}
            </p>

            <form
              action={`/${locale}/properties`}
              className="mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-white/40 bg-white/95 p-2 shadow-lift backdrop-blur-md transition-shadow focus-within:shadow-glow focus-within:ring-2 focus-within:ring-gold/60 sm:flex-row sm:items-center"
            >
              <label htmlFor="hero-search" className="sr-only">
                {text.searchPlaceholder}
              </label>
              <Input
                aria-label={text.searchPlaceholder}
                className="h-12 border-transparent bg-transparent text-foreground shadow-none focus-visible:ring-0"
                id="hero-search"
                name="q"
                placeholder={text.searchPlaceholder}
              />
              <Button className="h-12 shrink-0 rounded-xl px-7" type="submit">
                <Search className="size-4" />
                {site("primaryCta")}
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <Button asChild variant="gold" size="sm" className="rounded-full">
                <Link href="/properties?listingType=SALE">{text.sale}</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="rounded-full border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
              >
                <Link href="/properties?listingType=RENT">{text.rent}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats — clean, data-driven */}
      <section className="border-b border-border bg-background">
        <dl className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-px sm:grid-cols-4">
          <div className="flex items-center gap-3 px-4 py-5 sm:gap-4 sm:px-6 sm:py-6">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary">
              <Home className="size-5" />
            </div>
            <div className="min-w-0">
              <dt className="sr-only">{text.statsProperties}</dt>
              <dd
                className="tnum font-bold text-foreground"
                style={{ fontSize: "1.5rem", lineHeight: 1.2 }}
              >
                {totalProperties.toLocaleString(
                  locale === "ar" ? "ar-EG" : "en-US",
                )}
              </dd>
              <dd className="truncate text-caption text-muted-foreground">
                {locale === "ar"
                  ? arabicUnit(totalProperties, unitForms.ar.properties)
                  : totalProperties === 1
                    ? "property"
                    : "properties"}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-5 sm:gap-4 sm:px-6 sm:py-6">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary">
              <MapPin className="size-5" />
            </div>
            <div className="min-w-0">
              <dt className="sr-only">{text.statsCities}</dt>
              <dd
                className="tnum font-bold text-foreground"
                style={{ fontSize: "1.5rem", lineHeight: 1.2 }}
              >
                {cities.length.toLocaleString(
                  locale === "ar" ? "ar-EG" : "en-US",
                )}
              </dd>
              <dd className="truncate text-caption text-muted-foreground">
                {locale === "ar"
                  ? arabicUnit(cities.length, unitForms.ar.cities)
                  : cities.length === 1
                    ? "city"
                    : "cities"}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-5 sm:gap-4 sm:px-6 sm:py-6">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold-700">
              <Building2 className="size-5" />
            </div>
            <div className="min-w-0">
              <dt className="sr-only">{text.statsCategories}</dt>
              <dd
                className="tnum font-bold text-foreground"
                style={{ fontSize: "1.5rem", lineHeight: 1.2 }}
              >
                {categories.length.toLocaleString(
                  locale === "ar" ? "ar-EG" : "en-US",
                )}
              </dd>
              <dd className="truncate text-caption text-muted-foreground">
                {text.statsCategories}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-5 sm:gap-4 sm:px-6 sm:py-6">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-success/10 text-success">
              <Shield className="size-5" />
            </div>
            <div className="min-w-0">
              <dt className="sr-only">{text.statsFeatured}</dt>
              <dd
                className="tnum font-bold text-foreground"
                style={{ fontSize: "1.5rem", lineHeight: 1.2 }}
              >
                {featured.length.toLocaleString(
                  locale === "ar" ? "ar-EG" : "en-US",
                )}
              </dd>
              <dd className="truncate text-caption text-muted-foreground">
                {text.statsFeatured}
              </dd>
            </div>
          </div>
        </dl>
      </section>

      {/* Categories */}
      <section className="content-auto mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Reveal className="mb-6">
          <h2 className="text-h2">{text.categories}</h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => {
            const iconKey = categoryIcons[index] ?? "home";
            return (
              <Reveal key={category.id} delay={index * 60}>
                <CategoryCardPexels
                  count={category.count}
                  countLabel={text.categoryCount}
                  href={`/properties?categoryId=${category.id}`}
                  iconKey={iconKey}
                  image={categoryImageBySlug.get(category.slug) ?? null}
                  name={getCategoryName(category, locale)}
                  slug={category.slug}
                />
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      <section className="content-auto border-y border-border bg-muted/30">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:px-8">
          <Reveal className="flex items-center justify-between gap-4">
            <h2 className="text-h2">{text.featured}</h2>
            <Button asChild variant="secondary" size="sm">
              <Link href="/properties">
                {text.allProperties}
                <ArrowUpRight className="size-4 rtl:-scale-x-100" />
              </Link>
            </Button>
          </Reveal>
          {featured.length > 0 ? (
            <PropertyGrid
              favoriteIds={favoriteIds}
              locale={locale}
              priorityCount={3}
              properties={featured}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-background p-12 text-center text-body text-muted-foreground">
              {text.noFeatured}
            </div>
          )}
        </div>
      </section>

      {/* Popular Areas */}
      <section className="content-auto mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Reveal className="mb-6">
          <h2 className="text-h2">{text.popularAreas}</h2>
          <p className="mt-1 text-body text-muted-foreground">
            {text.popularAreasDesc}
          </p>
        </Reveal>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {popularAreas.map((area, areaIndex) => (
            <Reveal key={area.slug} delay={Math.min(areaIndex, 4) * 40}>
              <Link
                href={`/area/${area.slug}`}
                className="transition-lift group flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3.5 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="transition-colors-fast grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-white">
                    <MapPin className="size-4" />
                  </div>
                  <p className="truncate text-body font-medium">
                    {locale === "ar" ? area.nameAr : area.nameEn}
                  </p>
                </div>
                <ArrowUpRight className="transition-colors-fast size-4 shrink-0 text-muted-foreground/50 group-hover:text-primary rtl:-scale-x-100" />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Latest */}
      <section className="content-auto border-y border-border bg-muted/30">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:px-8">
          <Reveal className="flex items-center justify-between gap-4">
            <h2 className="text-h2">{text.latest}</h2>
            <Button asChild variant="secondary" size="sm">
              <Link href="/properties">{text.allProperties}</Link>
            </Button>
          </Reveal>
          {latest.length > 0 ? (
            <PropertyGrid
              favoriteIds={favoriteIds}
              locale={locale}
              priorityCount={1}
              properties={latest}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-background p-12 text-center text-body text-muted-foreground">
              {text.noLatest}
            </div>
          )}
        </div>
      </section>

      {/* Trust */}
      <section className="content-auto mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="mb-10 text-center">
          <h2 className="text-h2">{text.trustTitle}</h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { Icon: Shield, title: text.trust1Title, desc: text.trust1Desc },
            {
              Icon: CheckCircle,
              title: text.trust2Title,
              desc: text.trust2Desc,
            },
            { Icon: Users, title: text.trust3Title, desc: text.trust3Desc },
          ].map(({ Icon, title, desc }, trustIndex) => (
            <Reveal
              key={title}
              delay={trustIndex * 70}
              className="transition-lift rounded-2xl border border-border bg-card p-6 text-center shadow-xs hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-primary-50 text-primary">
                <Icon className="size-6" />
              </div>
              <h3 className="mb-2 text-h4">{title}</h3>
              <p className="text-body text-muted-foreground">{desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate overflow-hidden bg-primary-950 text-white">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_120%_at_50%_0%,rgba(201,168,76,0.22),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-h2 text-white">{text.ctaTitle}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-body text-white/65">
              {text.ctaDesc}
            </p>
            <Button asChild className="mt-8 h-12 rounded-xl px-8" size="lg">
              <Link href="/properties">{text.ctaButton}</Link>
            </Button>
          </Reveal>
        </div>
      </section>

      <RecentlyViewed favoriteIds={favoriteIds} locale={locale} />
    </div>
  );
}
