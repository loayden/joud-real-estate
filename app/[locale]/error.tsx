"use client";

import * as Sentry from "@sentry/nextjs";
import { Home, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

const copy = {
  ar: {
    title: "حدث خطأ غير متوقع",
    description:
      "تم تسجيل الخطأ للمراجعة. حاول مرة أخرى، أو عد إلى الصفحة الرئيسية.",
    retry: "حاول مرة أخرى",
    home: "العودة للرئيسية",
  },
  en: {
    title: "Something went wrong",
    description:
      "The error has been logged for review. Try again, or return home.",
    retry: "Try again",
    home: "Back home",
  },
} as const;

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale() as "ar" | "en";
  const text = copy[locale];

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-bold text-gold-700">500</p>
      <h1 className="mt-3 text-3xl font-bold text-primary sm:text-4xl">
        {text.title}
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">{text.description}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} type="button">
          <RefreshCw className="h-4 w-4" />
          {text.retry}
        </Button>
        <Button asChild type="button" variant="secondary">
          <Link href="/">
            <Home className="h-4 w-4" />
            {text.home}
          </Link>
        </Button>
      </div>
    </section>
  );
}
