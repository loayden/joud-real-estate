"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Building2,
  Download,
  Eye,
  Home,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";

import { StatsCard } from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { AdminAnalyticsOverview } from "@/lib/admin-analytics";

type ApiResponse =
  | { success: true; data: AdminAnalyticsOverview }
  | { success: false; error: string };

type TooltipContentProps = {
  active?: boolean;
  label?: unknown;
  payload?: ReadonlyArray<{
    dataKey?: unknown;
    name?: unknown;
    value?: unknown;
  }>;
};

const statusColors = {
  APPROVED: "#059669",
  PENDING: "#d97706",
  REJECTED: "#dc2626",
  DRAFT: "#64748b",
  EXPIRED: "#ea580c",
  SOLD: "#2563eb",
  RENTED: "#7c3aed",
  ARCHIVED: "#52525b",
} as const;

const copy = {
  ar: {
    title: "التحليلات والتقارير",
    description:
      "مؤشرات تشغيلية تساعدك على متابعة نمو المنصة وجودة المعروض والتفاعل.",
    totalProperties: "إجمالي العقارات",
    totalUsers: "إجمالي المستخدمين",
    totalInquiries: "إجمالي الاستفسارات",
    totalViews: "إجمالي المشاهدات",
    periodProperties: "عقارات جديدة في النطاق",
    periodUsers: "مستخدمون جدد في النطاق",
    periodInquiries: "استفسارات في النطاق",
    statusTitle: "توزيع حالات العقارات",
    registrationsTitle: "تسجيلات المستخدمين",
    registrationsDescription: "الأعداد اليومية للنطاق المحدد.",
    regionTitle: "العقارات المعتمدة حسب المنطقة",
    inquiriesTitle: "الاستفسارات حسب الشهر",
    topViewedTitle: "أكثر العقارات مشاهدة",
    topCitiesTitle: "أعلى المدن حسب عدد العقارات",
    rank: "الترتيب",
    property: "العقار",
    city: "المدينة",
    region: "المنطقة",
    views: "مشاهدة",
    count: "العدد",
    viewProperty: "عرض العقار",
    from: "من",
    to: "إلى",
    apply: "تطبيق",
    reset: "إعادة ضبط",
    loading: "جار تحديث البيانات...",
    error: "تعذر تحميل التحليلات.",
    exportProperties: "تصدير العقارات CSV",
    exportUsers: "تصدير المستخدمين CSV",
    exportInquiries: "تصدير الاستفسارات CSV",
    empty: "لا توجد بيانات كافية للعرض.",
    approved: "معتمد",
    pending: "قيد المراجعة",
    rejected: "مرفوض",
    draft: "مسودة",
    expired: "منتهي",
    sold: "مباع",
    rented: "مؤجر",
    archived: "مؤرشف",
    reportRange: "نطاق التقرير",
    reportRangeDescription:
      "يطبق النطاق على التسجيلات ومؤشرات الفترة والاستفسارات الشهرية.",
  },
  en: {
    title: "Analytics & Reporting",
    description:
      "Operational signals for platform growth, listing quality, and engagement.",
    totalProperties: "Total properties",
    totalUsers: "Total users",
    totalInquiries: "Total inquiries",
    totalViews: "Total views",
    periodProperties: "New properties in range",
    periodUsers: "New users in range",
    periodInquiries: "Inquiries in range",
    statusTitle: "Property status distribution",
    registrationsTitle: "User registrations",
    registrationsDescription: "Daily counts for the selected range.",
    regionTitle: "Approved properties by region",
    inquiriesTitle: "Inquiries by month",
    topViewedTitle: "Top viewed properties",
    topCitiesTitle: "Top cities by listing count",
    rank: "Rank",
    property: "Property",
    city: "City",
    region: "Region",
    views: "Views",
    count: "Count",
    viewProperty: "View property",
    from: "From",
    to: "To",
    apply: "Apply",
    reset: "Reset",
    loading: "Refreshing analytics...",
    error: "Unable to load analytics.",
    exportProperties: "Export properties CSV",
    exportUsers: "Export users CSV",
    exportInquiries: "Export inquiries CSV",
    empty: "Not enough data to display.",
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    draft: "Draft",
    expired: "Expired",
    sold: "Sold",
    rented: "Rented",
    archived: "Archived",
    reportRange: "Report range",
    reportRangeDescription:
      "The range applies to registrations, period metrics, and monthly inquiries.",
  },
} as const;

function statusLabel(status: keyof typeof statusColors, locale: Locale) {
  const text = copy[locale];

  const labels = {
    APPROVED: text.approved,
    PENDING: text.pending,
    REJECTED: text.rejected,
    DRAFT: text.draft,
    EXPIRED: text.expired,
    SOLD: text.sold,
    RENTED: text.rented,
    ARCHIVED: text.archived,
  } as const;

  return labels[status];
}

function localizeName(
  item: { nameAr: string; nameEn: string },
  locale: Locale,
) {
  return locale === "ar" ? item.nameAr : item.nameEn;
}

function localizeTitle(
  item: { titleAr: string; titleEn: string | null },
  locale: Locale,
) {
  return locale === "ar" || !item.titleEn ? item.titleAr : item.titleEn;
}

function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(
    value,
  );
}

function formatDateTick(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function formatMonthTick(value: string, locale: Locale) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    year: "2-digit",
  }).format(new Date(year, month - 1, 1));
}

function downloadExport(type: "properties" | "users" | "inquiries") {
  window.location.assign(`/api/admin/export/${type}`);
}

function toEndpoint(from: string, to: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  return `/api/admin/analytics/overview${query ? `?${query}` : ""}`;
}

function updateUrl(from: string, to: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}`,
  );
}

function ChartTooltipContent({
  active,
  label,
  locale,
  payload,
}: TooltipContentProps & { locale: Locale }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-subtle">
      <div className="font-bold text-foreground">{String(label ?? "")}</div>
      {payload.map((item, index) => (
        <div
          className="mt-1 text-muted-foreground"
          key={`${String(item.dataKey)}-${index}`}
        >
          {String(item.name ?? "")}:{" "}
          {formatNumber(Number(item.value ?? 0), locale)}
        </div>
      ))}
    </div>
  );
}

export function AdminAnalyticsDashboard({
  initialData,
  locale,
}: {
  initialData: AdminAnalyticsOverview;
  locale: Locale;
}) {
  const text = copy[locale];
  const [data, setData] = useState(initialData);
  const [from, setFrom] = useState(initialData.range.daily.from);
  const [to, setTo] = useState(initialData.range.daily.to);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const statusData = useMemo(
    () =>
      data.statusDistribution.map((item) => ({
        ...item,
        label: statusLabel(item.status as keyof typeof statusColors, locale),
        color: statusColors[item.status as keyof typeof statusColors],
      })),
    [data.statusDistribution, locale],
  );
  const regionData = useMemo(
    () =>
      data.byRegion.map((item) => ({
        ...item,
        name: localizeName(item, locale),
      })),
    [data.byRegion, locale],
  );
  const topCitiesData = useMemo(
    () =>
      data.topCities.map((item) => ({
        ...item,
        name: localizeName(item, locale),
        region: locale === "ar" ? item.regionAr : item.regionEn,
      })),
    [data.topCities, locale],
  );
  const hasStatusData = statusData.some((item) => item.count > 0);

  async function refresh(nextFrom = from, nextTo = to) {
    setError(null);
    updateUrl(nextFrom, nextTo);
    setIsRefreshing(true);

    try {
      const response = await fetch(toEndpoint(nextFrom, nextTo), {
        cache: "no-store",
      });
      const body = (await response.json()) as ApiResponse;

      if (!response.ok || !body.success) {
        throw new Error(body.success ? text.error : body.error);
      }

      setData(body.data);
      setFrom(body.data.range.daily.from);
      setTo(body.data.range.daily.to);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : text.error);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function reset() {
    setError(null);
    updateUrl("", "");
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/admin/analytics/overview", {
        cache: "no-store",
      });
      const body = (await response.json()) as ApiResponse;

      if (!response.ok || !body.success) {
        throw new Error(body.success ? text.error : body.error);
      }

      setData(body.data);
      setFrom(body.data.range.daily.from);
      setTo(body.data.range.daily.to);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : text.error);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="grid gap-2">
          <h2 className="flex items-center gap-3 text-3xl font-bold tracking-normal text-foreground">
            <BarChart3 className="size-7 text-primary" />
            {text.title}
          </h2>
          <p className="max-w-3xl text-muted-foreground">{text.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => downloadExport("properties")}
            type="button"
            variant="secondary"
          >
            <Download className="size-4" />
            {text.exportProperties}
          </Button>
          <Button
            onClick={() => downloadExport("users")}
            type="button"
            variant="secondary"
          >
            <Download className="size-4" />
            {text.exportUsers}
          </Button>
          <Button
            onClick={() => downloadExport("inquiries")}
            type="button"
            variant="secondary"
          >
            <Download className="size-4" />
            {text.exportInquiries}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{text.reportRange}</CardTitle>
          <CardDescription>{text.reportRangeDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
            <div className="grid gap-2">
              <Label htmlFor="analytics-from">{text.from}</Label>
              <Input
                id="analytics-from"
                onChange={(event) => setFrom(event.target.value)}
                type="date"
                value={from}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="analytics-to">{text.to}</Label>
              <Input
                id="analytics-to"
                onChange={(event) => setTo(event.target.value)}
                type="date"
                value={to}
              />
            </div>
            <Button
              disabled={isRefreshing}
              onClick={() => refresh()}
              type="button"
            >
              <RefreshCw
                className={cn("size-4", isRefreshing ? "animate-spin" : "")}
              />
              {text.apply}
            </Button>
            <Button
              disabled={isRefreshing}
              onClick={reset}
              type="button"
              variant="secondary"
            >
              {text.reset}
            </Button>
          </div>
          {isRefreshing ? (
            <p className="mt-3 text-sm font-semibold text-primary">
              {text.loading}
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          color="blue"
          description={`${text.periodProperties}: ${formatNumber(data.period.properties, locale)}`}
          icon={Building2}
          title={text.totalProperties}
          value={formatNumber(data.totals.properties, locale)}
        />
        <StatsCard
          color="gray"
          description={`${text.periodUsers}: ${formatNumber(data.period.users, locale)}`}
          icon={Users}
          title={text.totalUsers}
          value={formatNumber(data.totals.users, locale)}
        />
        <StatsCard
          color="green"
          description={`${text.periodInquiries}: ${formatNumber(data.period.inquiries, locale)}`}
          icon={MessageSquare}
          title={text.totalInquiries}
          value={formatNumber(data.totals.inquiries, locale)}
        />
        <StatsCard
          color="yellow"
          icon={Eye}
          title={text.totalViews}
          value={formatNumber(data.totals.views, locale)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{text.statusTitle}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
            {hasStatusData ? (
              <div className="h-[280px]">
                <ResponsiveContainer height="100%" width="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="count"
                      innerRadius={62}
                      nameKey="label"
                      outerRadius={98}
                      paddingAngle={2}
                    >
                      {statusData.map((item) => (
                        <Cell fill={item.color} key={item.status} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={(props) => (
                        <ChartTooltipContent {...props} locale={locale} />
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="grid h-[280px] place-items-center rounded-md bg-muted text-muted-foreground">
                {text.empty}
              </div>
            )}
            <div className="grid gap-2">
              {statusData.map((item) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
                  key={item.status}
                >
                  <span className="flex min-w-0 items-center gap-2 font-semibold">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span className="font-bold">
                    {formatNumber(item.count, locale)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{text.registrationsTitle}</CardTitle>
            <CardDescription>{text.registrationsDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart
                  data={data.registrations}
                  margin={{ left: 6, right: 10 }}
                >
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    minTickGap={28}
                    tickFormatter={(value) => formatDateTick(value, locale)}
                  />
                  <YAxis allowDecimals={false} width={36} />
                  <Tooltip
                    content={(props) => (
                      <ChartTooltipContent
                        {...props}
                        label={formatDateTick(String(props.label), locale)}
                        locale={locale}
                      />
                    )}
                  />
                  <Line
                    activeDot={{ r: 6 }}
                    dataKey="count"
                    name={text.totalUsers}
                    stroke="#1B4B8A"
                    strokeWidth={3}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{text.regionTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart
                  data={regionData}
                  layout="vertical"
                  margin={{ left: 20, right: 12 }}
                >
                  <CartesianGrid horizontal={false} stroke="#e5e7eb" />
                  <XAxis allowDecimals={false} type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={locale === "ar" ? 112 : 128}
                  />
                  <Tooltip
                    content={(props) => (
                      <ChartTooltipContent {...props} locale={locale} />
                    )}
                  />
                  <Bar
                    dataKey="count"
                    fill="#D4A017"
                    name={text.count}
                    radius={[4, 4, 4, 4]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{text.inquiriesTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart
                  data={data.inquiriesByMonth}
                  margin={{ left: 6, right: 12 }}
                >
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(value) => formatMonthTick(value, locale)}
                  />
                  <YAxis allowDecimals={false} width={36} />
                  <Tooltip
                    content={(props) => (
                      <ChartTooltipContent
                        {...props}
                        label={formatMonthTick(String(props.label), locale)}
                        locale={locale}
                      />
                    )}
                  />
                  <Bar
                    dataKey="count"
                    fill="#059669"
                    name={text.totalInquiries}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              {text.topViewedTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-muted/60 text-xs font-bold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-start">{text.rank}</th>
                    <th className="px-4 py-3 text-start">{text.property}</th>
                    <th className="px-4 py-3 text-start">{text.views}</th>
                    <th className="px-4 py-3 text-end">{text.viewProperty}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {data.topViewed.length > 0 ? (
                    data.topViewed.map((property, index) => (
                      <tr key={property.id}>
                        <td className="px-4 py-4 font-bold">{index + 1}</td>
                        <td className="px-4 py-4">
                          <div className="max-w-md truncate font-bold">
                            {localizeTitle(property, locale)}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {property.slug}
                          </div>
                        </td>
                        <td className="px-4 py-4 font-bold">
                          {formatNumber(property.viewCount, locale)}
                        </td>
                        <td className="px-4 py-4 text-end">
                          <Button asChild size="sm" variant="secondary">
                            <Link href={`/property/${property.slug}`}>
                              {text.viewProperty}
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="px-4 py-10 text-center text-muted-foreground"
                        colSpan={4}
                      >
                        {text.empty}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="size-5 text-primary" />
              {text.topCitiesTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {topCitiesData.length > 0 ? (
                topCitiesData.map((city, index) => (
                  <div
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-border px-3 py-3"
                    key={city.cityId}
                  >
                    <span className="grid size-8 place-items-center rounded-md bg-primary-50 text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold">
                        {city.name}
                      </span>
                      {city.region ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {city.region}
                        </span>
                      ) : null}
                    </span>
                    <span className="font-bold">
                      {formatNumber(city.count, locale)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-md bg-muted px-4 py-10 text-center text-muted-foreground">
                  {text.empty}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
