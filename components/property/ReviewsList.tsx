"use client";

import { useEffect, useMemo, useState } from "react";

import { ReviewCard, type ReviewItem } from "@/components/property/ReviewCard";
import { SubmitReviewModal } from "@/components/property/SubmitReviewModal";
import { RatingWidget } from "@/components/property/RatingWidget";
import type { Locale } from "@/i18n/routing";

const copy = {
  ar: {
    title: "تقييمات العقار",
    empty: "لا توجد تقييمات معتمدة لهذا العقار بعد.",
    count: "تقييم",
    loading: "جاري تحميل التقييمات...",
  },
  en: {
    title: "Property reviews",
    empty: "No approved reviews for this property yet.",
    count: "reviews",
    loading: "Loading reviews...",
  },
} as const;

type ReviewsPayload = {
  ratings: ReviewItem[];
  summary: {
    count: number;
    overall: number | null;
    accuracy: number | null;
    value: number | null;
    location: number | null;
    communication: number | null;
  };
};

export function ReviewsList({
  propertyId,
  locale,
  canRespond = false,
}: {
  propertyId: string;
  locale: Locale;
  canRespond?: boolean;
}) {
  const text = copy[locale];
  const [data, setData] = useState<ReviewsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      const response = await fetch(`/api/ratings/property/${propertyId}`);
      const payload = (await response.json()) as {
        success: boolean;
        data?: ReviewsPayload;
      };

      if (!cancelled) {
        setData(payload.data ?? { ratings: [], summary: emptySummary });
        setLoading(false);
      }
    }

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const summary = data?.summary ?? emptySummary;
  const average = useMemo(() => summary.overall ?? 0, [summary.overall]);

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{text.title}</h2>
          <div className="mt-2 flex items-center gap-2">
            <RatingWidget readOnly value={average} />
            <span className="text-sm font-bold text-muted-foreground">
              {average ? average.toFixed(1) : "0.0"} · {summary.count}{" "}
              {text.count}
            </span>
          </div>
        </div>
        <SubmitReviewModal locale={locale} propertyId={propertyId} />
      </div>

      {loading ? (
        <div className="rounded-md border border-dashed border-border p-6 text-sm font-semibold text-muted-foreground">
          {text.loading}
        </div>
      ) : data && data.ratings.length > 0 ? (
        <div className="grid gap-4">
          {data.ratings.map((review) => (
            <ReviewCard
              canRespond={canRespond}
              key={review.id}
              locale={locale}
              review={review}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border p-6 text-sm font-semibold text-muted-foreground">
          {text.empty}
        </div>
      )}
    </section>
  );
}

const emptySummary: ReviewsPayload["summary"] = {
  count: 0,
  overall: null,
  accuracy: null,
  value: null,
  location: null,
  communication: null,
};
