import type { Metadata } from "next";
import { Globe, Shield, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link, type Locale } from "@/i18n/routing";
import { absoluteUrl, alternateLanguages, localizedUrl } from "@/lib/seo";

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  const isArabic = locale === "ar";
  const title = isArabic ? "عن جود العقارية" : "About Joud Real Estate";
  const description = isArabic
    ? "تعرّف على جود العقارية، المنصة المصرية الموثوقة لاكتشاف العقارات في جمهورية مصر العربية."
    : "Learn about Joud Real Estate, a trusted Egyptian platform for discovering properties in Egypt.";

  return {
    title,
    description,
    alternates: {
      canonical: localizedUrl(locale, "/about"),
      languages: alternateLanguages("/about"),
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
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/images/joud-hero.jpg")],
    },
  };
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  const site = await getTranslations("site");

  const values = [
    {
      icon: Shield,
      titleKey: "value1Title",
      textKey: "value1Text",
    },
    {
      icon: Globe,
      titleKey: "value2Title",
      textKey: "value2Text",
    },
    {
      icon: Users,
      titleKey: "value3Title",
      textKey: "value3Text",
    },
  ];

  return (
    <div className="bg-background">
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-2">
            <h1 className="text-h1">{t("title")}</h1>
            <p className="max-w-2xl text-body-lg text-muted-foreground">
              {t("description")}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-h3">{t("mission")}</h2>
          <p className="mt-4 text-body leading-relaxed text-muted-foreground">
            {t("missionText")}
          </p>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-h3">{t("values")}</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => (
              <div key={value.titleKey}>
                <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <value.icon className="size-5" />
                </div>
                <h3 className="mb-2 text-h4">{t(value.titleKey)}</h3>
                <p className="text-body text-muted-foreground">
                  {t(value.textKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <h2 className="text-h3">{site("primaryCta")}</h2>
          <p className="mt-3 text-body text-muted-foreground">
            {site("tagline")}
          </p>
          <Button asChild className="mt-6" size="lg">
            <Link href="/properties">{site("primaryCta")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
