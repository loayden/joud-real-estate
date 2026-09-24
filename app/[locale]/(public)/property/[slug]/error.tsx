"use client";

import { useLocale } from "next-intl";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

const copy = {
  ar: {
    title: "العقار غير متاح",
    description: "تعذر تحميل هذا العقار. ربما تم حذقه أو أنه غير متاح مؤقتاً.",
    retry: "حاول مرة أخرى",
    browse: "تصفح العقارات",
  },
  en: {
    title: "Property not available",
    description:
      "This property could not be loaded. It may have been removed or is temporarily unavailable.",
    retry: "Try again",
    browse: "Browse Properties",
  },
} as const;

export default function PropertyDetailError({
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
            <Link href="/properties">{text.browse}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
