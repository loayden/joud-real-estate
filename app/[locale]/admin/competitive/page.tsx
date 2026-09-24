import type { Metadata } from "next";

import { CompetitiveDashboard } from "@/components/admin/CompetitiveDashboard";
import type { Locale } from "@/i18n/routing";
import { getCompetitiveScore } from "@/lib/competitive-intelligence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: {
    title: "الاستخبارات التنافسية",
    description:
      "مقارنة جود العقارية مع المنافسين ومؤشرات صحة المنصة في الوقت الحقيقي.",
  },
  en: {
    title: "Competitive intelligence",
    description:
      "Compare Joud Real Estate against competitors and monitor live platform health.",
  },
} as const;

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  return { title: copy[locale].title };
}

export default async function AdminCompetitivePage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const text = copy[locale];
  const data = await getCompetitiveScore();

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold tracking-normal">{text.title}</h1>
        <p className="text-muted-foreground">{text.description}</p>
      </div>
      <CompetitiveDashboard data={data} locale={locale} />
    </div>
  );
}
