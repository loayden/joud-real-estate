"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

import { RatingWidget } from "@/components/property/RatingWidget";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

export type ReviewItem = {
  id: string;
  overallScore: number;
  accuracyScore: number | null;
  valueScore: number | null;
  locationScore: number | null;
  commScore: number | null;
  reviewTitle: string | null;
  reviewBody: string | null;
  ownerResponse: string | null;
  helpfulCount: number;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

const copy = {
  ar: {
    helpful: "مفيد",
    notHelpful: "غير مفيد",
    ownerResponse: "رد المالك",
    respond: "الرد على التقييم",
    saveResponse: "حفظ الرد",
    responsePlaceholder: "اكتب رداً مهنياً وواضحاً على التقييم...",
    saved: "تم حفظ الرد",
  },
  en: {
    helpful: "Helpful",
    notHelpful: "Not helpful",
    ownerResponse: "Owner response",
    respond: "Respond",
    saveResponse: "Save response",
    responsePlaceholder: "Write a professional response to this review...",
    saved: "Response saved",
  },
} as const;

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function ReviewCard({
  review,
  locale,
  canRespond = false,
}: {
  review: ReviewItem;
  locale: Locale;
  canRespond?: boolean;
}) {
  const text = copy[locale];
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [response, setResponse] = useState(review.ownerResponse ?? "");
  const [responseOpen, setResponseOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function vote(isHelpful: boolean) {
    const result = await apiFetch(`/api/ratings/${review.id}/helpful`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHelpful }),
    });
    const payload = (await result.json()) as {
      success: boolean;
      data?: { helpfulCount: number };
      error?: string;
    };

    if (payload.success && payload.data) {
      setHelpfulCount(payload.data.helpfulCount);
    } else {
      setMessage(payload.error ?? "Unable to vote");
    }
  }

  async function submitResponse() {
    setSaving(true);
    setMessage(null);

    try {
      const result = await apiFetch(`/api/ratings/${review.id}/respond`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });
      const payload = (await result.json()) as {
        success: boolean;
        error?: string;
      };

      if (!payload.success) {
        setMessage(payload.error ?? "Unable to save response");
        return;
      }

      setResponseOpen(false);
      setMessage(text.saved);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="grid gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <RatingWidget readOnly size="sm" value={review.overallScore} />
            <span className="text-sm font-bold text-foreground">
              {review.overallScore}/5
            </span>
          </div>
          <h3 className="mt-2 text-base font-bold text-foreground">
            {review.reviewTitle ?? review.reviewer.name}
          </h3>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {review.reviewer.name} · {formatDate(review.createdAt, locale)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            aria-label={text.helpful}
            onClick={() => vote(true)}
            size="sm"
            type="button"
            variant="secondary"
          >
            <ThumbsUp className="size-4" />
            {helpfulCount}
          </Button>
          <Button
            aria-label={text.notHelpful}
            onClick={() => vote(false)}
            size="sm"
            type="button"
            variant="ghost"
          >
            <ThumbsDown className="size-4" />
          </Button>
        </div>
      </div>

      {review.reviewBody ? (
        <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
          {review.reviewBody}
        </p>
      ) : null}

      {response ? (
        <div className="rounded-md bg-primary-50 p-3 text-sm leading-7 text-primary">
          <p className="mb-1 font-bold">{text.ownerResponse}</p>
          <p>{response}</p>
        </div>
      ) : null}

      {canRespond && !review.ownerResponse ? (
        <div className="grid gap-3">
          <Button
            className="w-fit"
            onClick={() => setResponseOpen((open) => !open)}
            size="sm"
            type="button"
            variant="secondary"
          >
            {text.respond}
          </Button>
          {responseOpen ? (
            <div className="grid gap-2">
              <Textarea
                onChange={(event) => setResponse(event.target.value)}
                placeholder={text.responsePlaceholder}
                value={response}
              />
              <Button
                className="w-fit"
                disabled={saving || response.trim().length < 2}
                onClick={submitResponse}
                size="sm"
                type="button"
              >
                {text.saveResponse}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p
          className={cn(
            "text-sm font-semibold",
            message === text.saved ? "text-success" : "text-destructive",
          )}
        >
          {message}
        </p>
      ) : null}
    </article>
  );
}
