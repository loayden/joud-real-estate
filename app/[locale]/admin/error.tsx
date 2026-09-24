"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

const copy = {
  ar: {
    title: "خطأ في لوحة الإدارة",
    description: "حدث خطأ غير متوقع. تم تسجيل التفاصيل للمراجعة.",
    retry: "إعادة المحاولة",
  },
  en: {
    title: "Admin error",
    description:
      "Something went wrong. The details have been logged for review.",
    retry: "Try again",
  },
} as const;

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale() as "ar" | "en";
  const text = copy[locale];

  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[50vh] w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="mb-4 size-12 text-red-500" />
      <h1 className="text-2xl font-bold text-foreground">{text.title}</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">{text.description}</p>
      <Button className="mt-6" onClick={reset} type="button">
        <RefreshCw className="size-4" />
        {text.retry}
      </Button>
    </section>
  );
}
