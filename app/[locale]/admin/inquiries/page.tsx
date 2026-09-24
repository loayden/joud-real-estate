import type { InquiryStatus } from "@prisma/client";
import { MessageSquare, Search } from "lucide-react";
import type { Metadata } from "next";

import { AdminInquiriesTable } from "@/components/admin/AdminInquiriesTable";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, type Locale } from "@/i18n/routing";
import { getAdminInquiries, parseInquiryStatus } from "@/lib/inquiries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: {
    pageTitle: "إدارة الاستفسارات | جود العقارية",
    title: "إدارة الاستفسارات",
    description:
      "راجع كل استفسارات المنصة، ابحث حسب المرسل أو العقار أو الرسالة، وصدّر النتائج الحالية.",
    all: "الكل",
    new: "جديد",
    read: "مقروء",
    replied: "تم الرد",
    closed: "مغلق",
    searchPlaceholder: "ابحث بالمرسل أو العقار أو الرسالة",
    search: "بحث",
    clear: "مسح",
    results: "استفسار",
    previous: "السابق",
    next: "التالي",
  },
  en: {
    pageTitle: "Inquiry Management | Joud Real Estate",
    title: "Inquiry Management",
    description:
      "Review all platform inquiries, search by sender, property, or message, and export the current results.",
    all: "All",
    new: "New",
    read: "Read",
    replied: "Replied",
    closed: "Closed",
    searchPlaceholder: "Search sender, property, or message",
    search: "Search",
    clear: "Clear",
    results: "inquiries",
    previous: "Previous",
    next: "Next",
  },
} as const;

const statusTabs: Array<{
  label: keyof typeof copy.ar;
  status?: InquiryStatus;
}> = [
  { label: "all" },
  { label: "new", status: "NEW" },
  { label: "read", status: "READ" },
  { label: "replied", status: "REPLIED" },
  { label: "closed", status: "CLOSED" },
];

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
  status?: InquiryStatus;
  search?: string;
}) {
  const params = new URLSearchParams();

  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (page && page > 1) params.set("page", String(page));

  const query = params.toString();
  return `/admin/inquiries${query ? `?${query}` : ""}`;
}

function parsePage(value: string | undefined) {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export default async function AdminInquiriesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams?: { status?: string; search?: string; page?: string };
}) {
  const text = copy[locale];
  const status = parseInquiryStatus(searchParams?.status);
  const searchValue = searchParams?.search?.trim() ?? "";
  const page = parsePage(searchParams?.page);
  const inquiries = await getAdminInquiries({
    status,
    search: searchValue,
    page,
    limit: 20,
  });

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h2 className="flex items-center gap-3 text-3xl font-bold tracking-normal text-foreground">
          <MessageSquare className="size-7 text-primary" />
          {text.title}
        </h2>
        <p className="max-w-3xl text-muted-foreground">{text.description}</p>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{text.title}</CardTitle>
            <span className="rounded-full bg-muted px-3 py-1 text-sm font-bold text-muted-foreground">
              {inquiries.total} {text.results}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => {
              const active = tab.status === status || (!tab.status && !status);

              return (
                <Link
                  className={cn(
                    "inline-flex h-9 items-center rounded-md border px-3 text-sm font-bold transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted",
                  )}
                  href={buildUrl({ status: tab.status, search: searchValue })}
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
                defaultValue={searchValue}
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
          <AdminInquiriesTable inquiries={inquiries.data} locale={locale} />
          <Pagination
            buildUrl={(nextPage) =>
              buildUrl({ page: nextPage, status, search: searchValue })
            }
            labels={{ previous: text.previous, next: text.next }}
            page={inquiries.page}
            totalPages={inquiries.totalPages}
          />
        </CardContent>
      </Card>
    </div>
  );
}
