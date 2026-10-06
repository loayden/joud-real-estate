"use client";

import { Heart, Home, Plus, Search, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

function isActiveRoute(pathname: string, href: string) {
  const normalized = pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
  if (href === "/") return normalized === "/";
  return normalized === href || normalized.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const items = [
    { href: "/", label: t("home"), Icon: Home },
    { href: "/search", label: t("search"), Icon: Search },
    { href: "/my-listings/new", label: t("add"), Icon: Plus, fab: true },
    { href: "/favorites", label: t("favorites"), Icon: Heart },
    { href: "/dashboard", label: t("account"), Icon: UserRound },
  ] as const;

  return (
    <nav
      aria-label={t("primary")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5">
        {items.map(({ href, label, Icon, ...rest }) => {
          const active = isActiveRoute(pathname, href);
          const fab = "fab" in rest && rest.fab;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={cn(
                "relative flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
              href={href}
              key={href}
            >
              {active ? (
                <span
                  aria-hidden
                  className="absolute top-0 h-0.5 w-10 rounded-full bg-primary"
                />
              ) : null}
              {fab ? (
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-2xl shadow-sm transition-transform active:scale-90",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-foreground text-background",
                  )}
                >
                  <Icon className="size-5" />
                </span>
              ) : (
                <Icon
                  className={cn(
                    "size-[22px] transition-transform",
                    active && "scale-110",
                  )}
                />
              )}
              <span className={cn(!fab && active && "font-bold")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
