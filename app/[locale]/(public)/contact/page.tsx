import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { type Locale } from "@/i18n/routing";
import { absoluteUrl, alternateLanguages, localizedUrl } from "@/lib/seo";

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  const isArabic = locale === "ar";
  const title = isArabic ? "تواصل معنا" : "Contact Us";
  const description = isArabic
    ? "لديك أسئلة أو تحتاج مساعدة؟ نحن هنا لمساعدتك."
    : "Have questions or need assistance? We are here to help.";

  return {
    title,
    description,
    alternates: {
      canonical: localizedUrl(locale, "/contact"),
      languages: alternateLanguages("/contact"),
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

export default async function ContactPage() {
  const t = await getTranslations("contact");

  const contactMethods = [
    {
      icon: Mail,
      titleKey: "email",
      detailKey: "emailAddress",
      href: "mailto:info@joud.sa",
    },
    {
      icon: Phone,
      titleKey: "phone",
      detailKey: "phoneNumber",
      href: "tel:+201000000000",
    },
    {
      icon: Clock,
      titleKey: "hours",
      detailKey: "hoursDetail",
      href: null,
    },
    {
      icon: MapPin,
      titleKey: "address",
      detailKey: "addressDetail",
      href: null,
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contactMethods.map((method) => (
            <div
              key={method.titleKey}
              className="rounded-xl border border-border bg-background p-5"
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary">
                <method.icon className="size-5" />
              </div>
              <p className="text-caption text-muted-foreground">
                {t(method.titleKey)}
              </p>
              {method.href ? (
                <a
                  className="transition-colors-fast mt-1 block text-body font-medium text-foreground hover:text-primary"
                  href={method.href}
                >
                  {t(method.detailKey)}
                </a>
              ) : (
                <p className="mt-1 text-body font-medium text-foreground">
                  {t(method.detailKey)}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
