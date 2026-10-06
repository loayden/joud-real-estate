"use client";

import * as Sentry from "@sentry/nextjs";
import { Home, RefreshCw, TriangleAlert } from "lucide-react";
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
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_20%,rgba(196,54,42,0.08),transparent_70%)]"
      />
      <div className="mx-auto flex min-h-[70dvh] w-full max-w-3xl animate-slide-up flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <span className="grid size-16 place-items-center rounded-3xl bg-destructive/10 text-destructive">
          <TriangleAlert className="size-8" />
        </span>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {text.title}
        </h1>
        <p className="mt-4 max-w-xl text-body text-muted-foreground">
          {text.description}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={reset}
            type="button"
            className="h-11 rounded-xl px-6"
          >
            <RefreshCw className="size-4" />
            {text.retry}
          </Button>
          <Button
            asChild
            type="button"
            variant="secondary"
            className="h-11 rounded-xl px-6"
          >
            <Link href="/">
              <Home className="size-4" />
              {text.home}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
