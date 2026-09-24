import { Building2, Star, ArrowUpLeft } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Link, type Locale } from "@/i18n/routing";
import { absoluteUrl, alternateLanguages, localizedUrl } from "@/lib/seo";

const copy = {
  ar: {
    title: "المطورون العقاريون",
    description:
      "تعرّف على أكبر المطورين العقاريين في مصر ومراحل مشاريعهم وأسعارهم",
    viewProjects: "عرض المشاريع",
    noProjects: "قريباً — ملفات المطورين العقاريين",
    comingSoon: "نعمل على بناء ملفات شاملة لكل مطور عقاري في مصر تشمل:",
    feature1: "جميع المشاريع والمراحل",
    feature2: "الأسعار وخطط الدفع",
    feature3: "تقييمات المستخدمين",
    feature4: "صور وتفاصيل المشاريع",
    browseProperties: "تصفح العقارات المتاحة",
    backToHome: "الرئيسية",
    featuredDevelopers: "أبرز المطورين",
  },
  en: {
    title: "Real Estate Developers",
    description:
      "Discover the top real estate developers in Egypt, their projects, phases, and prices",
    viewProjects: "View Projects",
    noProjects: "Coming Soon — Developer Profiles",
    comingSoon:
      "We are building comprehensive profiles for every real estate developer in Egypt including:",
    feature1: "All projects and phases",
    feature2: "Prices and payment plans",
    feature3: "User ratings and reviews",
    feature4: "Project photos and details",
    browseProperties: "Browse Available Properties",
    backToHome: "Home",
    featuredDevelopers: "Featured Developers",
  },
} as const;

const topDevelopers = [
  {
    nameAr: "Mountain View",
    nameEn: "Mountain View",
    specialtyAr: "كومباوندات فاخرة",
    specialtyEn: "Luxury Compounds",
    projectCount: 15,
  },
  {
    nameAr: "SODIC",
    nameEn: "SODIC",
    specialtyAr: "مجتمعات متكاملة",
    specialtyEn: "Integrated Communities",
    projectCount: 12,
  },
  {
    nameAr: "Emaar Misr",
    nameEn: "Emaar Misr",
    specialtyAr: "مشاريع راقية",
    specialtyEn: "Premium Projects",
    projectCount: 8,
  },
  {
    nameAr: "TMG Holding",
    nameEn: "TMG Holding",
    specialtyAr: "تطوير عمراني",
    specialtyEn: "Urban Development",
    projectCount: 10,
  },
  {
    nameAr: "ORA Developers",
    nameEn: "ORA Developers",
    specialtyAr: "تصميم عصري",
    specialtyEn: "Modern Design",
    projectCount: 6,
  },
  {
    nameAr: "Palm Hills",
    nameEn: "Palm Hills",
    specialtyAr: "مجتمعات سكنية",
    specialtyEn: "Residential Communities",
    projectCount: 14,
  },
  {
    nameAr: "Dar Al Elm",
    nameEn: "Dar Al Elm",
    specialtyAr: "مشاريع متنوعة",
    specialtyEn: "Diverse Projects",
    projectCount: 9,
  },
  {
    nameAr: "Hyde Park",
    nameEn: "Hyde Park",
    specialtyAr: "مساحات خضراء",
    specialtyEn: "Green Spaces",
    projectCount: 7,
  },
];

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const isArabic = locale === "ar";
  const title = isArabic ? "المطورون العقاريون" : "Real Estate Developers";
  const description = isArabic
    ? "تعرّف على أكبر المطورين العقاريين في مصر ومراحل مشاريعهم"
    : "Discover the top real estate developers in Egypt and their projects";
  const url = localizedUrl(locale, "/developers");

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: alternateLanguages("/developers"),
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
    robots: { follow: true, index: true },
  };
}

export default async function DevelopersPage({
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
        <h2 className="mb-6 text-h3">{text.featuredDevelopers}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topDevelopers.map((dev) => (
            <div
              key={dev.nameEn}
              className="transition-all-fast group rounded-xl border border-border bg-card p-5 hover:shadow-md"
            >
              <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-primary-50 text-body font-semibold text-primary">
                {dev.nameEn.charAt(0)}
              </div>
              <h3 className="font-semibold text-foreground">
                {locale === "ar" ? dev.nameAr : dev.nameEn}
              </h3>
              <p className="text-small text-muted-foreground">
                {locale === "ar" ? dev.specialtyAr : dev.specialtyEn}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-small text-muted-foreground">
                <Building2 className="size-3.5" />
                <span>
                  {dev.projectCount} {locale === "ar" ? "مشروع" : "projects"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-muted/30 p-10 text-center">
          <Building2 className="mx-auto mb-4 size-12 text-muted-foreground/40" />
          <h2 className="mb-2 text-h3">{text.noProjects}</h2>
          <p className="mx-auto mb-6 max-w-lg text-body text-muted-foreground">
            {text.comingSoon}
          </p>
          <ul className="mx-auto mb-8 grid max-w-md gap-2.5 text-left text-body text-muted-foreground">
            <li className="flex items-center gap-2.5">
              <Star className="size-4 shrink-0 text-gold" />
              {text.feature1}
            </li>
            <li className="flex items-center gap-2.5">
              <Star className="size-4 shrink-0 text-gold" />
              {text.feature2}
            </li>
            <li className="flex items-center gap-2.5">
              <Star className="size-4 shrink-0 text-gold" />
              {text.feature3}
            </li>
            <li className="flex items-center gap-2.5">
              <Star className="size-4 shrink-0 text-gold" />
              {text.feature4}
            </li>
          </ul>
          <Button asChild variant="secondary">
            <Link href="/properties">
              {text.browseProperties}
              <ArrowUpLeft className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
