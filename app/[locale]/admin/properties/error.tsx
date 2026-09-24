"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

const copy = {
  ar: {
    title: "خطأ في إدارة العقارات",
    description: "حدث خطأ أثناء تحميل بيانات العقارات.",
    retry: "إعادة المحاولة",
  },
  en: {
    title: "Properties error",
    description: "Something went wrong while loading property data.",
    retry: "Try again",
  },
} as const;

export default function AdminPropertiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale() as "ar" | "en";
  const text = copy[locale];

  useEffect(() => {
    console.error("[Admin Properties Error]", error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[40vh] w-full flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="mb-4 size-10 text-red-500" />
      <h1 className="text-xl font-bold text-foreground">{text.title}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {text.description}
      </p>
      <Button className="mt-4" onClick={reset} type="button" size="sm">
        <RefreshCw className="size-4" />
        {text.retry}
      </Button>
    </section>
  );
}
