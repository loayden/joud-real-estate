import { Building2, MapPin, Shield, Trees, ArrowUpLeft } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Link, type Locale } from "@/i18n/routing";
import { absoluteUrl, alternateLanguages, localizedUrl } from "@/lib/seo";

const copy = {
  ar: {
    title: "الكمبوندات في مصر",
    description:
      "اكتشف أفضل الكومبوندات والمجمعات السكنية في مصر مع الأسعار والمرافق والتقييمات",
    viewAll: "عرض كل العقارات في الكومبوندات",
    featured: "كومبوندات مميزة",
    whyCompound: "لماذا تعيش في كومبوند؟",
    reason1Title: "أمان وخصوصية",
    reason1Desc: " بوابة مغلقة وأمن 24 ساعة",
    reason2Title: "مرافق متكاملة",
    reason2Desc: "مسبح وصالة رياضية ومساحات خضراء",
    reason3Title: "مجتمع مترابط",
    reason3Desc: "جيران من نفس الفئة الاجتماعية",
    browseProperties: "تصفح العقارات",
  },
  en: {
    title: "Compounds in Egypt",
    description:
      "Discover the best compounds and residential communities in Egypt with prices, amenities, and ratings",
    viewAll: "View all properties in compounds",
    featured: "Featured Compounds",
    whyCompound: "Why Live in a Compound?",
    reason1Title: "Security & Privacy",
    reason1Desc: "Gated community with 24/7 security",
    reason2Title: "Complete Amenities",
    reason2Desc: "Pool, gym, and green spaces",
    reason3Title: "Connected Community",
    reason3Desc: "Neighbors from similar social backgrounds",
    browseProperties: "Browse Properties",
  },
} as const;

const featuredCompounds = [
  {
    nameAr: "Mountain View iCity",
    nameEn: "Mountain View iCity",
    locationAr: "التجمع الخامس",
    locationEn: "Fifth Settlement",
    priceFrom: "6,500,000",
    developer: "Mountain View",
  },
  {
    nameAr: "SODIC East Town",
    nameEn: "SODIC East Town",
    locationAr: "التجمع الخامس",
    locationEn: "Fifth Settlement",
    priceFrom: "5,200,000",
    developer: "SODIC",
  },
  {
    nameAr: "Emaar Misr Fouka",
    nameEn: "Emaar Misr Fouka",
    locationAr: "الساحل الشمالي",
    locationEn: "North Coast",
    priceFrom: "8,000,000",
    developer: "Emaar",
  },
  {
    nameAr: "Palm Hills New Cairo",
    nameEn: "Palm Hills New Cairo",
    locationAr: "القاهرة الجديدة",
    locationEn: "New Cairo",
    priceFrom: "4,800,000",
    developer: "Palm Hills",
  },
  {
    nameAr: "Hyde Park New Cairo",
    nameEn: "Hyde Park New Cairo",
    locationAr: "القاهرة الجديدة",
    locationEn: "New Cairo",
    priceFrom: "5,500,000",
    developer: "Hyde Park",
  },
  {
    nameAr: "Zed East",
    nameEn: "Zed East",
    locationAr: "التجمع الخامس",
    locationEn: "Fifth Settlement",
    priceFrom: "7,200,000",
    developer: "ORA",
  },
];

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const isArabic = locale === "ar";
  const title = isArabic ? "الكمبوندات في مصر" : "Compounds in Egypt";
  const description = isArabic
    ? "اكتشف أفضل الكومبوندات والمجمعات السكنية في مصر"
    : "Discover the best compounds and residential communities in Egypt";
  const url = localizedUrl(locale, "/compounds");

  return {
    title,
    description,
    alternates: { canonical: url, languages: alternateLanguages("/compounds") },
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
    robots: { follow: true, index: true },
  };
}

export default async function CompoundsPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const text = copy[locale];

  return (
    <div className="bg-background">
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-2">
            <h1 className="text-h1">{text.title}</h1>
            <p className="max-w-2xl text-body text-muted-foreground">
              {text.description}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-h3">{text.featured}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCompounds.map((compound) => (
            <div
              key={compound.nameEn}
              className="transition-all-fast group rounded-xl border border-border bg-card p-5 hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-primary-50 text-primary">
                  <Building2 className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {locale === "ar" ? compound.nameAr : compound.nameEn}
                  </h3>
                  <p className="text-caption text-muted-foreground">
                    {compound.developer}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-small text-muted-foreground">
                <MapPin className="size-3.5 text-muted-foreground/50" />
                {locale === "ar" ? compound.locationAr : compound.locationEn}
              </div>
              <div className="mt-3 border-t border-border pt-3">
                <span className="text-body font-semibold text-foreground">
                  {locale === "ar" ? "يبدأ من" : "From"} {compound.priceFrom}{" "}
                  ج.م
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-h3">{text.whyCompound}</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-primary-50 text-primary">
                <Shield className="size-6" />
              </div>
              <h3 className="mb-2 text-h4">{text.reason1Title}</h3>
              <p className="text-body text-muted-foreground">
                {text.reason1Desc}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-primary-50 text-primary">
                <Trees className="size-6" />
              </div>
              <h3 className="mb-2 text-h4">{text.reason2Title}</h3>
              <p className="text-body text-muted-foreground">
                {text.reason2Desc}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-primary-50 text-primary">
                <MapPin className="size-6" />
              </div>
              <h3 className="mb-2 text-h4">{text.reason3Title}</h3>
              <p className="text-body text-muted-foreground">
                {text.reason3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <Button asChild variant="secondary" size="lg">
          <Link href="/search?q=compound">
            {text.browseProperties}
            <ArrowUpLeft className="size-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
