"use client";

import { Activity, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import type { Locale } from "@/i18n/routing";

type Estimate = {
  currency: string;
  sampleSize: number;
  low: number;
  mid: number;
  high: number;
  confidence: "high" | "medium" | "low";
};

const copy = {
  ar: {
    title: "تقدير القيمة السوقية",
    range: "النطاق المتوقع",
    confidence: "مستوى الثقة",
    samples: "عينة مشابهة",
    loading: "جارٍ حساب التقدير...",
    unavailable: "التقدير غير متاح حالياً.",
  },
  en: {
    title: "Market value estimate",
    range: "Expected range",
    confidence: "Confidence",
    samples: "similar samples",
    loading: "Calculating estimate...",
    unavailable: "Estimate is currently unavailable.",
  },
} as const;

function formatCurrency(value: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function PropertyEstimate({
  propertyId,
  locale,
}: {
  propertyId: string;
  locale: Locale;
}) {
  const text = copy[locale];
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadEstimate() {
      try {
        const response = await fetch(`/api/properties/${propertyId}/estimate`);
        const payload = (await response.json()) as {
          success: boolean;
          data?: Estimate;
        };

        if (!cancelled) {
          if (payload.success && payload.data) {
            setEstimate(payload.data);
          } else {
            setHasError(true);
          }
        }
      } catch {
        if (!cancelled) {
          setHasError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadEstimate();

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  if (isLoading) {
    return (
      <section className="grid gap-3 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          <h2 className="text-xl font-bold">{text.title}</h2>
        </div>
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {text.loading}
        </div>
      </section>
    );
  }

  if (hasError || !estimate) {
    return null;
  }

  return (
    <section className="grid gap-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Activity className="size-5 text-primary" />
        <h2 className="text-xl font-bold">{text.title}</h2>
      </div>
      <div className="rounded-md bg-primary-50 p-4 text-primary">
        <p className="text-xs font-bold opacity-80">{text.range}</p>
        <p className="mt-1 text-xl font-bold">
          {formatCurrency(estimate.low, estimate.currency, locale)} -{" "}
          {formatCurrency(estimate.high, estimate.currency, locale)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-bold text-muted-foreground">
        <span className="rounded-full bg-muted px-3 py-1">
          {text.confidence}: {estimate.confidence}
        </span>
        <span className="rounded-full bg-muted px-3 py-1">
          {estimate.sampleSize} {text.samples}
        </span>
      </div>
    </section>
  );
}
