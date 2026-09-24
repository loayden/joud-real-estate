import {
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  MessageSquare,
  UserPlus,
  Users,
} from "lucide-react";

import { StatsCard } from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import { getAdminStats } from "@/lib/admin-stats";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: {
    title: "نظرة عامة",
    description: "مؤشرات تشغيلية مباشرة لإدارة منصة جود العقارية.",
    approved: "العقارات المعتمدة",
    pending: "بانتظار المراجعة",
    rejected: "العقارات المرفوضة",
    users: "المستخدمون",
    newUsers: "مستخدمون جدد خلال 7 أيام",
    inquiries: "إجمالي الاستفسارات",
    statusDistribution: "توزيع حالات العقارات",
    pendingReviews: "عقارات تحتاج مراجعة",
    recentActivity: "آخر النشاطات",
    noPending: "لا توجد عقارات بانتظار المراجعة حالياً.",
    noActivity: "لا توجد نشاطات إدارية مسجلة بعد.",
    property: "العقار",
    owner: "المالك",
    city: "المدينة",
    price: "السعر",
    submitted: "تاريخ الإرسال",
    review: "مراجعة",
    manageProperties: "إدارة العقارات",
    manageUsers: "إدارة المستخدمين",
    viewAnalytics: "عرض التحليلات",
    quickActions: "إجراءات سريعة",
    draft: "مسودة",
    all: "الإجمالي",
  },
  en: {
    title: "Overview",
    description: "Live operational signals for Joud Real Estate.",
    approved: "Approved properties",
    pending: "Pending review",
    rejected: "Rejected properties",
    users: "Users",
    newUsers: "New users in 7 days",
    inquiries: "Total inquiries",
    statusDistribution: "Property status distribution",
    pendingReviews: "Properties needing review",
    recentActivity: "Recent activity",
    noPending: "No properties are pending review right now.",
    noActivity: "No admin activity has been recorded yet.",
    property: "Property",
    owner: "Owner",
    city: "City",
    price: "Price",
    submitted: "Submitted",
    review: "Review",
    manageProperties: "Manage properties",
    manageUsers: "Manage users",
    viewAnalytics: "View analytics",
    quickActions: "Quick actions",
    draft: "Draft",
    all: "Total",
  },
} as const;

function localizeName(
  value: { nameAr: string; nameEn: string },
  locale: Locale,
) {
  return locale === "ar" ? value.nameAr : value.nameEn;
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatCurrency(value: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatPerson(person: {
  email: string;
  firstName: string | null;
  lastName: string | null;
}) {
  const name = [person.firstName, person.lastName].filter(Boolean).join(" ");
  return name || person.email;
}

function percent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

export default async function AdminDashboardPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const text = copy[locale];
  const stats = await getAdminStats();
  const statusRows = [
    {
      label: text.approved,
      value: stats.totals.properties.approved,
      color: "bg-emerald-500",
    },
    {
      label: text.pending,
      value: stats.totals.properties.pending,
      color: "bg-amber-500",
    },
    {
      label: text.rejected,
      value: stats.totals.properties.rejected,
      color: "bg-red-500",
    },
    {
      label: text.draft,
      value: stats.totals.properties.draft,
      color: "bg-slate-400",
    },
  ];
  const totalProperties = stats.totals.properties.all;
  const approvedPercent = percent(
    stats.totals.properties.approved,
    totalProperties,
  );
  const pendingPercent = percent(
    stats.totals.properties.pending,
    totalProperties,
  );
  const rejectedPercent = percent(
    stats.totals.properties.rejected,
    totalProperties,
  );
  const pieStyle = {
    background: `conic-gradient(#10b981 0 ${approvedPercent}%, #f59e0b ${approvedPercent}% ${
      approvedPercent + pendingPercent
    }%, #ef4444 ${approvedPercent + pendingPercent}% ${
      approvedPercent + pendingPercent + rejectedPercent
    }%, #94a3b8 ${approvedPercent + pendingPercent + rejectedPercent}% 100%)`,
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h2 className="text-3xl font-bold tracking-normal text-foreground">
          {text.title}
        </h2>
        <p className="text-muted-foreground">{text.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          color="green"
          icon={CheckCircle2}
          title={text.approved}
          value={stats.totals.properties.approved}
        />
        <StatsCard
          color="yellow"
          description={text.pendingReviews}
          icon={Clock3}
          title={text.pending}
          value={stats.totals.properties.pending}
        />
        <StatsCard
          color="gray"
          icon={Users}
          title={text.users}
          value={stats.totals.users}
        />
        <StatsCard
          color="blue"
          icon={MessageSquare}
          title={text.inquiries}
          value={stats.totals.inquiries}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>{text.statusDistribution}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-[180px_1fr] md:items-center">
            <div className="mx-auto grid size-40 place-items-center rounded-full border border-border shadow-subtle">
              <div
                aria-label={text.statusDistribution}
                className="grid size-32 place-items-center rounded-full"
                style={pieStyle}
              >
                <div className="grid size-20 place-items-center rounded-full bg-card text-center">
                  <span className="text-2xl font-bold">{totalProperties}</span>
                  <span className="-mt-2 text-xs text-muted-foreground">
                    {text.all}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid gap-3">
              {statusRows.map((row) => (
                <div className="grid gap-2" key={row.label}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className={`size-2 rounded-full ${row.color}`} />
                      {row.label}
                    </span>
                    <span className="font-bold">{row.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className={`h-2 rounded-full ${row.color}`}
                      style={{
                        width: `${Math.max(percent(row.value, totalProperties), row.value > 0 ? 3 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{text.quickActions}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild>
              <Link href="/admin/properties">
                <Building2 className="size-4" />
                {text.manageProperties}
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/admin/users">
                <UserPlus className="size-4" />
                {text.manageUsers}
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/admin/analytics">
                <BarChart3 className="size-4" />
                {text.viewAnalytics}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{text.pendingReviews}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentProperties.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-3 py-3 text-start font-bold">
                      {text.property}
                    </th>
                    <th className="px-3 py-3 text-start font-bold">
                      {text.owner}
                    </th>
                    <th className="px-3 py-3 text-start font-bold">
                      {text.city}
                    </th>
                    <th className="px-3 py-3 text-start font-bold">
                      {text.price}
                    </th>
                    <th className="px-3 py-3 text-start font-bold">
                      {text.submitted}
                    </th>
                    <th className="px-3 py-3 text-end font-bold">
                      {text.review}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentProperties.map((property) => (
                    <tr className="border-b border-border/60" key={property.id}>
                      <td className="max-w-[260px] px-3 py-3 font-bold">
                        <span className="line-clamp-2">
                          {locale === "ar" || !property.titleEn
                            ? property.titleAr
                            : property.titleEn}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {formatPerson(property.owner)}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {localizeName(property.city, locale)}
                      </td>
                      <td className="px-3 py-3 font-semibold text-primary">
                        {formatCurrency(
                          property.price,
                          property.currency,
                          locale,
                        )}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {formatDate(property.createdAt, locale)}
                      </td>
                      <td className="px-3 py-3 text-end">
                        <Button asChild size="sm" variant="secondary">
                          <Link href={`/admin/properties/${property.id}`}>
                            {text.review}
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
              {text.noPending}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{text.recentActivity}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length > 0 ? (
            <ol className="grid gap-3">
              {stats.recentActivity.map((activity) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3"
                  key={activity.id}
                >
                  <div>
                    <p className="font-bold text-foreground">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.entity}
                      {activity.entityId ? ` · ${activity.entityId}` : ""}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activity.actor ? formatPerson(activity.actor) : "System"} ·{" "}
                    {formatDate(activity.createdAt, locale)}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="rounded-md border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
              {text.noActivity}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
