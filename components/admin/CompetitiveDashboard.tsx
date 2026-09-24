import { Activity, CheckCircle2, Trophy, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/i18n/routing";

type CompetitiveData = {
  platformHealthScore: number;
  metrics: {
    totalProperties: number;
    approvedProperties: number;
    pendingProperties: number;
    averageRating: number | null;
    totalRatings: number;
    responseRate: number;
    activeUsers30d: number;
    priceAlertCount: number;
    openReports: number;
  };
  competitorMatrix: ReadonlyArray<{
    platform: string;
    uiUx: number;
    arabic: number;
    search: number;
    mobile: number;
    alJoufCoverage: number;
    freeListings: boolean;
    trustLayer: boolean;
    ratingTool: boolean;
    priceTools: boolean;
    overall: number;
  }>;
  featureMatrix: readonly string[];
};

const copy = {
  ar: {
    health: "مؤشر صحة المنصة",
    competitors: "مصفوفة المنافسين",
    features: "تفوق الميزات",
    platform: "المنصة",
    ui: "التجربة",
    arabic: "العربية",
    search: "البحث",
    mobile: "الجوال",
    coverage: "تغطية مصر",
    overall: "الإجمالي",
    metrics: "مؤشرات تشغيلية",
  },
  en: {
    health: "Platform health score",
    competitors: "Competitor matrix",
    features: "Feature advantage",
    platform: "Platform",
    ui: "UX",
    arabic: "Arabic",
    search: "Search",
    mobile: "Mobile",
    coverage: "Egypt",
    overall: "Overall",
    metrics: "Operational metrics",
  },
} as const;

export function CompetitiveDashboard({
  data,
  locale,
}: {
  data: CompetitiveData;
  locale: Locale;
}) {
  const text = copy[locale];
  const score = data.platformHealthScore;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-gold-700" />
              {text.health}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="mx-auto grid size-48 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#1B4B8A 0 ${score}%, #e5e7eb ${score}% 100%)`,
              }}
            >
              <div className="grid size-36 place-items-center rounded-full bg-card text-center">
                <span className="text-5xl font-bold text-primary">{score}</span>
                <span className="-mt-8 text-sm font-bold text-muted-foreground">
                  /100
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              {text.metrics}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(data.metrics).map(([key, value]) => (
              <div className="rounded-md bg-muted/50 p-3" key={key}>
                <p className="text-xs font-bold uppercase text-muted-foreground">
                  {key}
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {typeof value === "number"
                    ? value.toFixed(key.includes("Rating") ? 1 : 0)
                    : "-"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{text.competitors}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/60 text-xs font-bold text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-start">{text.platform}</th>
                <th className="px-3 py-3">{text.ui}</th>
                <th className="px-3 py-3">{text.arabic}</th>
                <th className="px-3 py-3">{text.search}</th>
                <th className="px-3 py-3">{text.mobile}</th>
                <th className="px-3 py-3">{text.coverage}</th>
                <th className="px-3 py-3">{text.overall}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.competitorMatrix.map((row) => (
                <tr
                  className={
                    row.platform.includes("جود")
                      ? "bg-primary-50 font-bold"
                      : ""
                  }
                  key={row.platform}
                >
                  <td className="px-3 py-3 text-start">{row.platform}</td>
                  <td className="px-3 py-3 text-center">{row.uiUx}/10</td>
                  <td className="px-3 py-3 text-center">{row.arabic}/10</td>
                  <td className="px-3 py-3 text-center">{row.search}/10</td>
                  <td className="px-3 py-3 text-center">{row.mobile}/10</td>
                  <td className="px-3 py-3 text-center">
                    {row.alJoufCoverage}/10
                  </td>
                  <td className="px-3 py-3 text-center">{row.overall}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{text.features}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.featureMatrix.map((feature) => (
            <div
              className="flex items-center justify-between rounded-md border border-border p-3 text-sm font-bold"
              key={feature}
            >
              <span>{feature}</span>
              {feature ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : (
                <XCircle className="size-5 text-red-600" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
