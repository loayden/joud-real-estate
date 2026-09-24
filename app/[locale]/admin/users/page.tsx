import { Search, Users } from "lucide-react";
import type { Metadata } from "next";

import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Link, type Locale } from "@/i18n/routing";
import {
  getAdminUsers,
  parseUserRole,
  parseUserStatus,
} from "@/lib/admin-users";
import { requireRole } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: {
    pageTitle: "إدارة المستخدمين | جود العقارية",
    title: "إدارة المستخدمين",
    description:
      "ابحث عن المستخدمين، راجع حساباتهم وإعلاناتهم، وتحكم في الحظر والأدوار حسب الصلاحيات.",
    searchPlaceholder: "ابحث بالاسم أو البريد أو رقم الجوال",
    allRoles: "كل الأدوار",
    allStatuses: "كل الحالات",
    user: "مستخدم",
    agent: "وسيط",
    admin: "مدير",
    superAdmin: "مدير أعلى",
    active: "نشط",
    inactive: "غير نشط",
    banned: "محظور",
    pending: "بانتظار التفعيل",
    search: "بحث",
    clear: "مسح",
    results: "مستخدم",
    previous: "السابق",
    next: "التالي",
  },
  en: {
    pageTitle: "User Management | Joud Real Estate",
    title: "User Management",
    description:
      "Search users, review accounts and listings, and manage bans and roles according to permissions.",
    searchPlaceholder: "Search by name, email, or phone",
    allRoles: "All roles",
    allStatuses: "All statuses",
    user: "User",
    agent: "Agent",
    admin: "Admin",
    superAdmin: "Super admin",
    active: "Active",
    inactive: "Inactive",
    banned: "Banned",
    pending: "Pending verification",
    search: "Search",
    clear: "Clear",
    results: "users",
    previous: "Previous",
    next: "Next",
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

function buildUrl({
  page,
  role,
  status,
  search,
}: {
  page?: number;
  role?: string;
  status?: string;
  search?: string;
}) {
  const params = new URLSearchParams();

  if (role) params.set("role", role);
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (page && page > 1) params.set("page", String(page));

  const query = params.toString();
  return `/admin/users${query ? `?${query}` : ""}`;
}

export default async function AdminUsersPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams?: {
    search?: string;
    role?: string;
    status?: string;
    page?: string;
  };
}) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const text = copy[locale];
  const search = searchParams?.search?.trim() ?? "";
  const role = parseUserRole(searchParams?.role);
  const status = parseUserStatus(searchParams?.status);
  const page = Number(searchParams?.page ?? "1");
  const users = await getAdminUsers({ search, role, status, page, limit: 20 });

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h2 className="flex items-center gap-3 text-3xl font-bold tracking-normal text-foreground">
          <Users className="size-7 text-primary" />
          {text.title}
        </h2>
        <p className="max-w-3xl text-muted-foreground">{text.description}</p>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{text.title}</CardTitle>
            <span className="rounded-full bg-muted px-3 py-1 text-sm font-bold text-muted-foreground">
              {users.total} {text.results}
            </span>
          </div>

          <form className="grid gap-3 lg:grid-cols-[1fr_180px_200px_auto_auto]">
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
            <Select defaultValue={role ?? ""} name="role">
              <option value="">{text.allRoles}</option>
              <option value="USER">{text.user}</option>
              <option value="AGENT">{text.agent}</option>
              <option value="ADMIN">{text.admin}</option>
              <option value="SUPER_ADMIN">{text.superAdmin}</option>
            </Select>
            <Select defaultValue={status ?? ""} name="status">
              <option value="">{text.allStatuses}</option>
              <option value="ACTIVE">{text.active}</option>
              <option value="INACTIVE">{text.inactive}</option>
              <option value="BANNED">{text.banned}</option>
              <option value="PENDING_VERIFICATION">{text.pending}</option>
            </Select>
            <Button type="submit">{text.search}</Button>
            <Button asChild type="button" variant="secondary">
              <Link href="/admin/users">{text.clear}</Link>
            </Button>
          </form>
        </CardHeader>
        <CardContent className="grid gap-6">
          <AdminUsersTable
            currentAdminRole={session.user.role}
            currentUserId={session.user.id}
            locale={locale}
            users={users.data}
          />
          <Pagination
            buildUrl={(nextPage) =>
              buildUrl({
                page: nextPage,
                role,
                status,
                search,
              })
            }
            labels={{ previous: text.previous, next: text.next }}
            page={users.page}
            totalPages={users.totalPages}
          />
        </CardContent>
      </Card>
    </div>
  );
}
