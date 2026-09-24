import type { Metadata } from "next";
import { Flag } from "lucide-react";

import { ReportsManagementTable } from "@/components/admin/ReportsManagementTable";
import type { Locale } from "@/i18n/routing";
import { getAdminReports } from "@/lib/market-features";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: {
    title: "بلاغات العقارات",
    description: "راجع البلاغات المفتوحة على الإعلانات واتخذ إجراء واضحاً.",
  },
  en: {
    title: "Property reports",
    description: "Review open listing reports and resolve them clearly.",
  },
} as const;

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  return { title: copy[locale].title };
}

export default async function AdminReportsPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const text = copy[locale];
  const reports = await getAdminReports();

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <div className="inline-flex w-fit items-center gap-2 rounded-md bg-primary-50 px-3 py-2 text-sm font-bold text-primary">
          <Flag className="size-4" />
          {reports.length}
        </div>
        <h1 className="text-3xl font-bold tracking-normal">{text.title}</h1>
        <p className="text-muted-foreground">{text.description}</p>
      </div>
      <ReportsManagementTable initialReports={reports} locale={locale} />
    </div>
  );
}
