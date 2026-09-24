"use client";

import { Building2, LogOut, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { Link } from "@/i18n/routing";
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

import { LocaleSwitcher } from "./LocaleSwitcher";

const navLinks = [
  { href: "/", labelKey: "home" },
  { href: "/properties", labelKey: "properties" },
  { href: "/search", labelKey: "search" },
  { href: "/compounds", labelKey: "compounds" },
  { href: "/agents", labelKey: "agents" },
] as const;

type CurrentUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export function Header() {
  const t = useTranslations("nav");
  const site = useTranslations("site");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const initials = useMemo(() => {
    if (!currentUser) return "";
    const value = `${currentUser.firstName?.at(0) ?? ""}${
      currentUser.lastName?.at(0) ?? ""
    }`;
    return value || currentUser.email.at(0)?.toUpperCase() || "";
  }, [currentUser]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          signal: controller.signal,
        });

        if (!response.ok) {
          setCurrentUser(null);
          return;
        }

        const payload = (await response.json()) as ApiResponse<CurrentUser>;
        setCurrentUser(payload.success ? payload.data : null);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setCurrentUser(null);
        }
      }
    }

    void loadUser();
    window.addEventListener("joud:user-updated", loadUser);

    return () => {
      controller.abort();
      window.removeEventListener("joud:user-updated", loadUser);
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          aria-label={site("name")}
          className="transition-colors-fast flex items-center gap-2.5 text-lg font-bold text-foreground hover:text-primary"
          href="/"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-[18px]" />
          </span>
          <span className="leading-none tracking-tight">{site("name")}</span>
        </Link>

        {/* Desktop Nav */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          {navLinks.map((item) => (
            <Link
              className="transition-colors-fast rounded-lg px-3.5 py-2 text-small text-muted-foreground hover:bg-muted hover:text-foreground"
              href={item.href}
              key={item.href}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <LocaleSwitcher />
          {currentUser ? (
            <>
              <Button asChild size="sm" variant="secondary">
                <Link href="/dashboard">{t("dashboard")}</Link>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleLogout}
                aria-label={t("logout")}
                className="size-9 text-muted-foreground"
              >
                <LogOut className="size-4" />
              </Button>
              <Link aria-label={t("dashboard")} href="/profile">
                <Avatar
                  src={currentUser.avatarUrl}
                  fallback={initials}
                  size="md"
                />
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
                className="size-9"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{site("name")}</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 grid gap-0.5">
                {navLinks.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      className="transition-colors-fast rounded-lg px-3 py-2.5 text-body text-foreground hover:bg-muted"
                      href={item.href}
                    >
                      {t(item.labelKey)}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-6 grid gap-2.5">
                {currentUser ? (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="secondary">
                        <Link href="/dashboard">{t("dashboard")}</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild variant="ghost">
                        <Link href="/profile">
                          {initials || t("dashboard")}
                        </Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button variant="ghost" onClick={handleLogout}>
                        <LogOut className="size-4" />
                        {t("logout")}
                      </Button>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="secondary">
                        <Link href="/login">{t("login")}</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild>
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
