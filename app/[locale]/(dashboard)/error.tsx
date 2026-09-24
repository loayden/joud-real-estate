"use client";

import { useLocale } from "next-intl";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

const copy = {
  ar: {
    title: "خطأ في لوحة التحكم",
    description: "حدث خطأ أثناء تحميل لوحة التحكم. يرجى المحاولة مرة أخرى.",
    retry: "حاول مرة أخرى",
    dashboard: "لوحة التحكم",
  },
  en: {
    title: "Dashboard error",
    description:
      "Something went wrong loading your dashboard. Please try again.",
    retry: "Try again",
    dashboard: "Dashboard",
  },
} as const;

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = (useLocale() === "en" ? "en" : "ar") as "ar" | "en";
  const text = copy[locale];

  return (
    <div className="grid min-h-[50vh] place-items-center px-4 py-16 text-center">
      <div className="grid max-w-md justify-items-center gap-4">
        <AlertTriangle className="size-11 text-destructive" />
        <h2 className="text-2xl font-bold">{text.title}</h2>
        <p className="text-muted-foreground">{text.description}</p>
        <div className="flex gap-3">
          <Button onClick={reset} variant="secondary">
            {text.retry}
          </Button>
          <Button asChild>
            <Link href="/dashboard">{text.dashboard}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
