import type { Metadata } from "next";

import { AdminAnalyticsClient } from "@/components/admin/AdminAnalyticsClient";
import type { Locale } from "@/i18n/routing";
import { getAdminAnalyticsOverview } from "@/lib/admin-analytics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: {
    pageTitle: "التحليلات والتقارير | جود العقارية",
  },
  en: {
    pageTitle: "Analytics & Reporting | Joud Real Estate",
  },
} as const;

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = (await paramsPromise) as { locale: Locale };
  return {
    title: copy[locale].pageTitle,
  };
}

export default async function AdminAnalyticsPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ from?: string; to?: string }>;
}) {
  const { locale } = (await paramsPromise) as { locale: Locale };
  const searchParams = await searchParamsPromise;
  const initialData = await getAdminAnalyticsOverview({
    from: searchParams?.from,
    to: searchParams?.to,
  });

  return <AdminAnalyticsClient initialData={initialData} locale={locale} />;
}
