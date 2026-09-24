"use client";

import type { UserRole } from "@prisma/client";
import {
  BarChart3,
  Building2,
  FileText,
  Flag,
  LayoutDashboard,
  MailCheck,
  MapPin,
  MessageSquare,
  Settings,
  Star,
  Tag,
  Trophy,
  Users,
} from "lucide-react";

import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/admin",
    labelAr: "لوحة التحكم",
    labelEn: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/properties",
    labelAr: "العقارات",
    labelEn: "Properties",
    icon: Building2,
  },
  {
    href: "/admin/users",
    labelAr: "المستخدمون",
    labelEn: "Users",
    icon: Users,
  },
  {
    href: "/admin/regions",
    labelAr: "المناطق والمدن",
    labelEn: "Regions",
    icon: MapPin,
  },
  {
    href: "/admin/categories",
    labelAr: "الفئات والتصنيفات",
    labelEn: "Categories",
    icon: Tag,
  },
  {
    href: "/admin/inquiries",
    labelAr: "الاستفسارات",
    labelEn: "Inquiries",
    icon: MessageSquare,
  },
  {
    href: "/admin/ratings",
    labelAr: "التقييمات",
    labelEn: "Reviews",
    icon: Star,
  },
  {
    href: "/admin/reports",
    labelAr: "البلاغات",
    labelEn: "Reports",
    icon: Flag,
  },
  {
    href: "/admin/emails",
    labelAr: "رسائل البريد",
    labelEn: "Emails",
    icon: MailCheck,
  },
  {
    href: "/admin/content",
    labelAr: "المحتوى",
    labelEn: "Content",
    icon: FileText,
  },
  {
    href: "/admin/analytics",
    labelAr: "التحليلات",
    labelEn: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/admin/competitive",
    labelAr: "الاستخبارات التنافسية",
    labelEn: "Competitive",
    icon: Trophy,
  },
  {
    href: "/admin/feature-flags",
    labelAr: "أعلام الميزات",
    labelEn: "Feature flags",
    icon: Flag,
    superAdminOnly: true,
  },
  {
    href: "/admin/settings",
    labelAr: "إعدادات النظام",
    labelEn: "System settings",
    icon: Settings,
    superAdminOnly: true,
  },
] as const;

const copy = {
  ar: {
    brand: "إدارة جود العقارية",
    navLabel: "تنقل لوحة الإدارة",
  },
  en: {
    brand: "Joud Administration",
    navLabel: "Admin navigation",
  },
} as const;

function stripLocale(pathname: string) {
  return pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
}

function isActivePath(pathname: string, href: string) {
  const normalized = stripLocale(pathname);

  if (href === "/admin") {
    return normalized === "/admin";
  }

  return normalized === href || normalized.startsWith(`${href}/`);
}

export function AdminSidebar({
  locale,
  role,
}: {
  locale: "ar" | "en";
  role: UserRole;
}) {
  const pathname = usePathname();
  const text = copy[locale];
  const visibleItems = navItems.filter(
    (item) => !("superAdminOnly" in item) || role === "SUPER_ADMIN",
  );

  return (
    <aside className="border-b border-border bg-background lg:min-h-[calc(100vh-4rem)] lg:w-72 lg:border-b-0 lg:border-e">
      <div className="sticky top-16 grid gap-4 px-4 py-3 lg:p-4">
        <div className="hidden rounded-md bg-primary-50 px-3 py-3 text-sm font-bold text-primary lg:block">
          {text.brand}
        </div>
        <nav
          aria-label={text.navLabel}
          className="flex gap-2 overflow-x-auto lg:grid lg:overflow-visible"
        >
          {visibleItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 min-w-max items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors lg:min-w-0 lg:justify-start",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className="size-4 shrink-0" />
                <span>{locale === "ar" ? item.labelAr : item.labelEn}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
