"use client";

import { Building2, LogOut, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";

import { Link, usePathname } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";

import { LocaleSwitcher } from "./LocaleSwitcher";

const navLinks = [
  { href: "/", labelKey: "home" },
  { href: "/properties", labelKey: "properties" },
  { href: "/search", labelKey: "search" },
  { href: "/compounds", labelKey: "compounds" },
  { href: "/agents", labelKey: "agents" },
] as const;

function isActiveRoute(pathname: string, href: string) {
  const normalized = pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
  if (href === "/") return normalized === "/";
  return normalized === href || normalized.startsWith(`${href}/`);
}

export function Header() {
  const t = useTranslations("nav");
  const site = useTranslations("site");
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const initials = useMemo(() => {
    if (!user) return "";
    const value = `${user.firstName?.at(0) ?? ""}${user.lastName?.at(0) ?? ""}`;
    return value || user.email.at(0)?.toUpperCase() || "";
  }, [user]);

  useCallback(() => {
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        // Scrolled state is now purely cosmetic; no auth impact.
        ticking = false;
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md transition-shadow duration-200">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          aria-label={site("name")}
          className="transition-colors-fast group flex items-center gap-2.5 rounded-lg text-lg font-bold text-foreground hover:text-primary"
          href="/"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
            <Building2 className="size-[18px]" />
          </span>
          <span className="leading-none tracking-tight">{site("name")}</span>
        </Link>

        {/* Desktop Nav */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          {navLinks.map((item) => {
            const active = isActiveRoute(pathname, item.href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "transition-colors-fast relative rounded-lg px-3.5 py-2 text-small",
                  active
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                href={item.href}
                key={item.href}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <LocaleSwitcher />
          {isLoading ? null : user ? (
            <>
              <Button asChild size="sm" variant="secondary">
                <Link href="/dashboard">{t("dashboard")}</Link>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={logout}
                aria-label={t("logout")}
                className="size-9 text-muted-foreground"
              >
                <LogOut className="size-4" />
              </Button>
              <Link aria-label={t("dashboard")} href="/profile">
                <Avatar src={user.avatarUrl} fallback={initials} size="md" />
              </Link>
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">{t("register")}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-1 lg:hidden">
          <LocaleSwitcher />
          <Sheet>
            <SheetTrigger asChild>
              <Button
                aria-label={t("menu")}
                size="icon"
                variant="ghost"
                className="size-10"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col">
              <SheetHeader>
                <SheetTitle>{site("name")}</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 grid gap-1" aria-label={t("menu")}>
                {navLinks.map((item) => {
                  const active = isActiveRoute(pathname, item.href);
                  return (
                    <SheetClose asChild key={item.href}>
                      <Link
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "transition-colors-fast flex min-h-11 items-center rounded-xl px-4 py-2.5 text-body",
                          active
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-foreground hover:bg-muted",
                        )}
                        href={item.href}
                      >
                        {t(item.labelKey)}
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>
              <div className="mt-auto grid gap-2.5 pt-6">
                {isLoading ? null : user ? (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="secondary" className="h-11">
                        <Link href="/dashboard">{t("dashboard")}</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild variant="ghost" className="h-11">
                        <Link href="/profile">
                          {initials || t("dashboard")}
                        </Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button variant="ghost" onClick={logout} className="h-11">
                        <LogOut className="size-4" />
                        {t("logout")}
                      </Button>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="secondary" className="h-11">
                        <Link href="/login">{t("login")}</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild className="h-11">
                        <Link href="/register">{t("register")}</Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
