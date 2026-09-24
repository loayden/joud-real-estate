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

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  return {
    title: copy[locale].pageTitle,
  };
}

export default async function AdminAnalyticsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams?: { from?: string; to?: string };
}) {
  const initialData = await getAdminAnalyticsOverview({
    from: searchParams?.from,
    to: searchParams?.to,
  });

  return <AdminAnalyticsClient initialData={initialData} locale={locale} />;
}
