"use client";

import {
  Bell,
  Bookmark,
  Building2,
  Gauge,
  Heart,
  Home,
  MessageSquare,
  Plus,
  Settings,
  User,
} from "lucide-react";
import { useLocale } from "next-intl";

import { Link, usePathname } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    workspace: "مساحة المستخدم",
    navLabel: "تنقل لوحة التحكم",
    note: "تنبيه",
    noteDescription:
      "ستظهر إحصاءات العقارات والاستفسارات مباشرة بعد إضافة أول إعلان.",
  },
  en: {
    workspace: "User Workspace",
    navLabel: "Dashboard navigation",
    note: "Note",
    noteDescription:
      "Listing and inquiry stats will populate after the first property is added.",
  },
} as const;

const navItems = [
  {
    href: "/dashboard",
    labelAr: "لوحة التحكم",
    labelEn: "Dashboard",
    icon: Gauge,
  },
  {
    href: "/my-listings",
    labelAr: "إعلاناتي",
    labelEn: "My Listings",
    icon: Building2,
  },
  {
    href: "/my-listings/new",
    labelAr: "إضافة عقار",
    labelEn: "Add Property",
    icon: Plus,
  },
  { href: "/favorites", labelAr: "المفضلة", labelEn: "Favorites", icon: Heart },
  {
    href: "/saved-searches",
    labelAr: "البحوث المحفوظة",
    labelEn: "Saved Searches",
    icon: Bookmark,
  },
  {
    href: "/price-alerts",
    labelAr: "تنبيهات الأسعار",
    labelEn: "Price Alerts",
    icon: Bell,
  },
  {
    href: "/inquiries",
    labelAr: "الاستفسارات",
    labelEn: "Inquiries",
    icon: MessageSquare,
  },
  { href: "/profile", labelAr: "الملف الشخصي", labelEn: "Profile", icon: User },
  {
    href: "/settings",
    labelAr: "الإعدادات",
    labelEn: "Settings",
    icon: Settings,
  },
] as const;

function isActivePath(pathname: string, href: string) {
  return (
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
  );
}

export function DashboardSidebar({
  unreadInquiryCount = 0,
}: {
  unreadInquiryCount?: number;
}) {
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const text = copy[locale];

  return (
    <aside className="border-b border-border bg-background lg:min-h-[calc(100vh-4rem)] lg:w-72 lg:border-b-0 lg:border-e">
      <div className="snap-strip sticky top-16 flex gap-1 overflow-x-auto px-4 py-3 lg:flex-col lg:overflow-visible lg:p-4">
        <Link
          className="hidden items-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-small font-medium text-foreground lg:flex"
          href="/dashboard"
        >
          <Home className="size-4 shrink-0" />
          {text.workspace}
        </Link>

        <nav
          aria-label={text.navLabel}
          className="flex min-w-max gap-1 lg:min-w-0 lg:flex-col"
        >
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "transition-colors-fast inline-flex h-11 items-center justify-center gap-2.5 whitespace-nowrap rounded-xl px-4 text-small lg:justify-start",
                  active
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                href={item.href}
                key={item.href}
                title={locale === "ar" ? item.labelAr : item.labelEn}
              >
                <Icon className="size-4 shrink-0" />
                <span className="whitespace-nowrap">
                  {locale === "ar" ? item.labelAr : item.labelEn}
                </span>
                {item.href === "/inquiries" && unreadInquiryCount > 0 ? (
                  <span className="ms-auto grid min-w-5 place-items-center rounded-md bg-destructive px-1.5 text-[10px] font-semibold leading-5 text-destructive-foreground">
                    {unreadInquiryCount > 99 ? "99+" : unreadInquiryCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="hidden rounded-lg border border-border bg-muted/30 p-3 text-small text-muted-foreground lg:mt-2 lg:block">
          <div className="mb-1.5 flex items-center gap-2 font-medium text-foreground">
            <Bell className="size-3.5 text-gold-700" />
            {text.note}
          </div>
          {text.noteDescription}
        </div>
      </div>
    </aside>
  );
}
