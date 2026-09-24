import { Search } from "lucide-react";
import type { Metadata } from "next";

import { AdminPropertiesTable } from "@/components/admin/AdminPropertiesTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shared/Pagination";
import { Link, type Locale } from "@/i18n/routing";
import {
  getAdminProperties,
  parsePropertyStatus,
} from "@/lib/admin-properties";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: {
    pageTitle: "إدارة العقارات | جود العقارية",
    title: "إدارة العقارات",
    description:
      "راجع الإعلانات، اعتمد العقارات الجاهزة، ارفض الإعلانات غير المكتملة، أو فعّل التمييز.",
    all: "الكل",
    pending: "قيد المراجعة",
    approved: "منشور",
    rejected: "مرفوض",
    expired: "منتهي",
    archived: "مؤرشف",
    searchPlaceholder: "ابحث بالعنوان أو البريد أو رقم الجوال",
    search: "بحث",
    clear: "مسح",
    results: "عقار",
    previous: "السابق",
    next: "التالي",
  },
  en: {
    pageTitle: "Property Management | Joud Real Estate",
    title: "Property Management",
    description:
      "Review listings, approve ready properties, reject incomplete submissions, or manage featured placement.",
    all: "All",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    expired: "Expired",
    archived: "Archived",
    searchPlaceholder: "Search by title, email, or phone",
    search: "Search",
    clear: "Clear",
    results: "properties",
    previous: "Previous",
    next: "Next",
  },
} as const;

const statusTabs = [
  { label: "all", status: undefined },
  { label: "pending", status: "PENDING" },
  { label: "approved", status: "APPROVED" },
  { label: "rejected", status: "REJECTED" },
  { label: "expired", status: "EXPIRED" },
  { label: "archived", status: "ARCHIVED" },
] as const;

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  return {
    title: copy[locale].pageTitle,
  };
}

function buildUrl({
  page,
  status,
  search,
}: {
  page?: number;
  status?: string;
  search?: string;
}) {
  const params = new URLSearchParams();

  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (page && page > 1) params.set("page", String(page));

  const query = params.toString();
  return `/admin/properties${query ? `?${query}` : ""}`;
}

export default async function AdminPropertiesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams?: { status?: string; search?: string; page?: string };
}) {
  const text = copy[locale];
  const status = parsePropertyStatus(searchParams?.status);
  const search = searchParams?.search?.trim() ?? "";
  const page = Number(searchParams?.page ?? "1");
  const properties = await getAdminProperties({
    status,
    search,
    page,
    limit: 20,
  });

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h2 className="text-3xl font-bold tracking-normal text-foreground">
          {text.title}
        </h2>
        <p className="max-w-3xl text-muted-foreground">{text.description}</p>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{text.title}</CardTitle>
            <span className="rounded-full bg-muted px-3 py-1 text-sm font-bold text-muted-foreground">
              {properties.total} {text.results}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => {
              const active = tab.status === status;

              return (
                <Link
                  className={cn(
                    "inline-flex h-9 items-center rounded-md border px-3 text-sm font-bold transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted",
                  )}
                  href={buildUrl({ status: tab.status, search })}
                  key={tab.label}
                >
                  {text[tab.label]}
                </Link>
              );
            })}
          </div>

          <form className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            {status ? (
              <input name="status" type="hidden" value={status} />
            ) : null}
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="ps-10"
                defaultValue={search}
                name="search"
                placeholder={text.searchPlaceholder}
                type="search"
              />
            </div>
            <Button type="submit">{text.search}</Button>
            <Button asChild type="button" variant="secondary">
              <Link href={buildUrl({ status })}>{text.clear}</Link>
            </Button>
          </form>
        </CardHeader>
        <CardContent className="grid gap-6">
          <AdminPropertiesTable locale={locale} properties={properties.data} />
          <Pagination
            buildUrl={(nextPage) =>
              buildUrl({ page: nextPage, status, search })
            }
            labels={{ previous: text.previous, next: text.next }}
            page={properties.page}
            totalPages={properties.totalPages}
          />
        </CardContent>
      </Card>
    </div>
  );
}
