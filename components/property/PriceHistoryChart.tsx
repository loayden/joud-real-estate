"use client";

import { Loader2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Locale } from "@/i18n/routing";

type PricePoint = {
  id: string;
  price: number;
  createdAt: string;
  note: string | null;
};

const copy = {
  ar: {
    title: "تاريخ السعر",
    empty: "لا توجد تغييرات سعر مسجلة بعد.",
    loading: "جارٍ التحميل...",
  },
  en: {
    title: "Price history",
    empty: "No price changes recorded yet.",
    loading: "Loading...",
  },
} as const;

function formatCurrency(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    currency: "EGP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function PriceHistoryChart({
  propertyId,
  locale,
}: {
  propertyId: string;
  locale: Locale;
}) {
  const text = copy[locale];
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const response = await fetch(
          `/api/properties/${propertyId}/price-history`,
        );
        const payload = (await response.json()) as {
          success: boolean;
          data?: { history: PricePoint[] };
        };

        if (!cancelled) {
          setHistory(payload.data?.history ?? []);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  return (
    <section className="grid gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-5 text-primary" />
        <h2 className="text-xl font-bold">{text.title}</h2>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {text.loading}
        </div>
      ) : history.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="createdAt"
                tickFormatter={(value) =>
                  new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
                    month: "short",
                    day: "numeric",
                  }).format(new Date(value))
                }
              />
              <YAxis
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value), locale)}
                labelFormatter={(value) =>
                  new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
                    dateStyle: "medium",
                  }).format(new Date(value))
                }
              />
              <Line
                dataKey="price"
                dot
                stroke="#1B4B8A"
                strokeWidth={3}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-border p-4 text-sm font-semibold text-muted-foreground">
          {text.empty}
        </p>
      )}
    </section>
  );
}
