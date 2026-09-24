"use client";

import dynamic from "next/dynamic";

import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/i18n/routing";
import type { AdminAnalyticsOverview } from "@/lib/admin-analytics";

const AdminAnalyticsDashboard = dynamic(
  () =>
    import("@/components/admin/AdminAnalyticsDashboard").then(
      (mod) => mod.AdminAnalyticsDashboard,
    ),
  {
    loading: () => (
      <Card>
        <CardContent className="grid min-h-72 place-items-center p-8 text-sm font-semibold text-muted-foreground">
          جار تحميل التحليلات...
        </CardContent>
      </Card>
    ),
    ssr: false,
  },
);

export function AdminAnalyticsClient({
  initialData,
  locale,
}: {
  initialData: AdminAnalyticsOverview;
  locale: Locale;
}) {
  return <AdminAnalyticsDashboard initialData={initialData} locale={locale} />;
}
