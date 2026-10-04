import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { OnboardingGate } from "@/components/onboarding/OnboardingOverlay";
import { ComparisonDrawer } from "@/components/property/ComparisonDrawer";
import { locales, type Locale } from "@/i18n/routing";
import { alternateLanguages, getSeoAppUrl, localizedUrl } from "@/lib/seo";

import "../globals.css";

const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
});

const latinFont = Inter({
  subsets: ["latin"],
  variable: "--font-latin",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  const isArabic = locale === "ar";
  const title = isArabic ? "جود العقارية" : "Joud Real Estate";
  const description = isArabic
    ? "منصة مصرية موثوقة لاكتشاف العقارات في جمهورية مصر العربية."
    : "A trusted Egyptian platform for discovering real estate in Egypt.";

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    metadataBase: new URL(getSeoAppUrl()),
    alternates: {
      canonical: localizedUrl(locale),
      languages: alternateLanguages(""),
    },
    openGraph: {
      title,
      description,
      locale: isArabic ? "ar_EG" : "en_US",
      siteName: title,
      type: "website",
      url: localizedUrl(locale),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: Readonly<{
  children: React.ReactNode;
  params: { locale: Locale };
}>) {
  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      className={`${arabicFont.variable} ${latinFont.variable}`}
      dir={dir}
      lang={locale}
    >
      <head>
        <link href="/manifest.json" rel="manifest" />
        <link href="https://images.joud.sa" rel="preconnect" />
        <link href="https://images.joud.sa" rel="dns-prefetch" />
        <meta content="#1B4B8A" name="theme-color" />
        <meta content="yes" name="apple-mobile-web-app-capable" />
        <meta content="default" name="apple-mobile-web-app-status-bar-style" />
        <meta content="جود العقارية" name="apple-mobile-web-app-title" />
        <link href="/icons/icon-192.png" rel="apple-touch-icon" />
        <meta
          content="width=device-width, initial-scale=1, maximum-scale=5"
          name="viewport"
        />
      </head>
      <body
        className={`min-h-screen bg-background text-foreground antialiased ${
          locale === "ar" ? "font-arabic" : "font-latin"
        }`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js").catch(function(){})})}`,
          }}
        />
        <NextIntlClientProvider messages={messages}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground"
          >
            {locale === "ar"
              ? "تخطَّ إلى المحتوى الرئيسي"
              : "Skip to main content"}
          </a>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main id="main-content" className="flex-1" tabIndex={-1}>
              {children}
            </main>
            <ComparisonDrawer locale={locale} />
            <Footer locale={locale} />
            <OnboardingGate locale={locale} />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
