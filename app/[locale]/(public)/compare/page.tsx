import type { Metadata } from "next";
import { GitCompare } from "lucide-react";

import { ComparisonTable } from "@/components/property/ComparisonTable";
import type { Locale } from "@/i18n/routing";
import { getComparisonProperties } from "@/lib/market-features";
import { absoluteUrl, alternateLanguages, localizedUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: {
    title: "مقارنة العقارات",
    description: "قارن حتى 4 عقارات جنباً إلى جنب لاتخاذ قرار أوضح.",
    empty: "اختر عقارات من صفحات التصفح لإضافتها إلى المقارنة.",
  },
  en: {
    title: "Property comparison",
    description: "Compare up to 4 properties side by side.",
    empty: "Select properties from browsing pages to compare them.",
  },
} as const;

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  const isArabic = locale === "ar";
  const text = copy[locale];
  const url = localizedUrl(locale, "/compare");

  return {
    title: text.title,
    description: text.description,
    alternates: { canonical: url, languages: alternateLanguages("/compare") },
    openGraph: {
      title: text.title,
      description: text.description,
      images: [
        {
          url: absoluteUrl("/images/joud-hero.jpg"),
          width: 1200,
          height: 630,
          alt: text.title,
        },
      ],
      locale: isArabic ? "ar_EG" : "en_US",
      type: "website",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: text.title,
      description: text.description,
      images: [absoluteUrl("/images/joud-hero.jpg")],
    },
    robots: { index: false, follow: true },
  };
}

export default async function ComparePage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams?: { ids?: string };
}) {
  const text = copy[locale];
  const ids =
    searchParams?.ids
      ?.split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 4) ?? [];

  let properties: Awaited<ReturnType<typeof getComparisonProperties>> = [];
  if (ids.length) {
    try {
      properties = await getComparisonProperties(ids);
    } catch {
      properties = [];
    }
  }

  return (
    <div className="bg-muted/25">
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid w-full max-w-7xl gap-3 px-4 py-10 sm:px-6 lg:px-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-md bg-primary-50 px-3 py-2 text-sm font-bold text-primary">
            <GitCompare className="size-4" />
            {properties.length}/4
          </div>
          <h1 className="text-3xl font-bold tracking-normal md:text-4xl">
            {text.title}
          </h1>
          <p className="max-w-2xl text-muted-foreground">{text.description}</p>
        </div>
      </section>
      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {properties.length > 0 ? (
          <ComparisonTable locale={locale} properties={properties} />
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-background p-10 text-center text-sm font-semibold text-muted-foreground">
            {text.empty}
          </div>
        )}
      </section>
    </div>
  );
}
