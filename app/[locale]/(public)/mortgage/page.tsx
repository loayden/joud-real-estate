import type { Metadata } from "next";

import { MortgageCalculator } from "@/components/property/MortgageCalculator";
import { type Locale } from "@/i18n/routing";
import { absoluteUrl, alternateLanguages, localizedUrl } from "@/lib/seo";

const copy = {
  ar: {
    title: "حاسبة التمويل العقاري",
    description:
      "احسب قسطك الشهري عن طريق حاسبة التمويل العقاري المجانية. أدخل سعر العقار والدفعة الأولى ومدة التمويل ونسبة الفائدة.",
    tips: "نصائح للتمويل العقاري",
    tip1: "الدفعة الأولى عادة 10-20% من سعر العقار",
    tip2: "مدة التمويل الأطول = أقساط أقل ولكن فائدة إجمالية أعلى",
    tip3: "قارن عروض البنوك المختلفة قبل الاختيار",
    tip4: "تأكد من أن القسط الشهري لا يزيد عن 30% من دخلك الشهري",
  },
  en: {
    title: "Mortgage Calculator",
    description:
      "Calculate your estimated monthly mortgage payment. Enter the property price, down payment, financing term, and annual interest rate.",
    tips: "Mortgage Tips",
    tip1: "Down payment is typically 10-20% of the property price",
    tip2: "Longer terms = lower monthly payments but higher total interest",
    tip3: "Compare offers from different banks before choosing",
    tip4: "Ensure monthly payment doesn't exceed 30% of your monthly income",
  },
} as const;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const isArabic = locale === "ar";
  const title = isArabic ? "حاسبة التمويل العقاري" : "Mortgage Calculator";
  const description = isArabic
    ? "احسب قسطك الشهري عن طريق حاسبة التمويل العقاري المجانية"
    : "Calculate your estimated monthly mortgage payment for free";
  const url = localizedUrl(locale, "/mortgage");

  return {
    title,
    description,
    alternates: { canonical: url, languages: alternateLanguages("/mortgage") },
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

export default async function MortgagePage({
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

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <MortgageCalculator defaultPrice={3000000} locale={locale} />

        <div className="mt-10 rounded-xl border border-border bg-muted/30 p-6">
          <h2 className="mb-4 text-h4">{text.tips}</h2>
          <ul className="grid gap-3">
            <li className="flex items-start gap-2.5 text-body text-muted-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {text.tip1}
            </li>
            <li className="flex items-start gap-2.5 text-body text-muted-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {text.tip2}
            </li>
            <li className="flex items-start gap-2.5 text-body text-muted-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {text.tip3}
            </li>
            <li className="flex items-start gap-2.5 text-body text-muted-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {text.tip4}
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
