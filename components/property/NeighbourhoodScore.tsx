"use client";

import { Loader2, MapPinned } from "lucide-react";
import { useEffect, useState } from "react";

import type { Locale } from "@/i18n/routing";

type ScorePayload = {
  overall: number;
  dimensions: Array<{
    key: string;
    labelAr: string;
    labelEn: string;
    score: number;
  }>;
};

const copy = {
  ar: { title: "مؤشر الحي", loading: "جاري حساب مؤشر الحي..." },
  en: { title: "Neighbourhood score", loading: "Calculating score..." },
} as const;

export function NeighbourhoodScore({
  slug,
  locale,
}: {
  slug: string;
  locale: Locale;
}) {
  const text = copy[locale];
  const [score, setScore] = useState<ScorePayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadScore() {
      const response = await fetch(
        `/api/properties/${slug}/neighbourhood-score`,
      );
      const payload = (await response.json()) as {
        success: boolean;
        data?: ScorePayload;
      };

      if (!cancelled && payload.success) {
        setScore(payload.data ?? null);
      }
    }

    loadScore();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <section className="grid gap-4 rounded-lg border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <MapPinned className="size-5 text-primary" />
        {text.title}
      </h2>
      {score ? (
        <div className="grid gap-5 md:grid-cols-[140px_1fr] md:items-center">
          <div
            className="grid size-32 place-items-center rounded-full"
            style={{
              background: `conic-gradient(#1B4B8A 0 ${score.overall}%, #e5e7eb ${score.overall}% 100%)`,
            }}
          >
            <div className="grid size-24 place-items-center rounded-full bg-card text-center">
              <span className="text-3xl font-bold text-primary">
                {score.overall}
              </span>
              <span className="-mt-2 text-xs font-bold text-muted-foreground">
                /100
              </span>
            </div>
          </div>
          <div className="grid gap-3">
            {score.dimensions.map((dimension) => (
              <div className="grid gap-1" key={dimension.key}>
                <div className="flex justify-between gap-3 text-sm font-bold">
                  <span>
                    {locale === "ar" ? dimension.labelAr : dimension.labelEn}
                  </span>
                  <span>{dimension.score}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${dimension.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 py-4 text-sm font-semibold text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {text.loading}
        </div>
      )}
    </section>
  );
}
