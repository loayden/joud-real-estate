"use client";

import { MessageSquarePlus, X } from "lucide-react";
import { useState } from "react";

import { RatingWidget } from "@/components/property/RatingWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/i18n/routing";

const copy = {
  ar: {
    open: "إضافة تقييم",
    title: "قيّم تجربتك مع العقار",
    subtitle: "التقييم يظهر بعد مراجعة الإدارة.",
    overall: "التقييم العام",
    accuracy: "دقة المعلومات",
    value: "القيمة مقابل السعر",
    location: "الموقع",
    communication: "تواصل المالك",
    reviewTitle: "عنوان التقييم",
    reviewBody: "اكتب تجربتك",
    submit: "إرسال للمراجعة",
    pending: "تم إرسال التقييم للمراجعة.",
    close: "إغلاق",
  },
  en: {
    open: "Add review",
    title: "Rate your property experience",
    subtitle: "Your review appears after admin moderation.",
    overall: "Overall rating",
    accuracy: "Accuracy",
    value: "Value",
    location: "Location",
    communication: "Owner communication",
    reviewTitle: "Review title",
    reviewBody: "Write your experience",
    submit: "Submit for review",
    pending: "Review submitted for moderation.",
    close: "Close",
  },
} as const;

type Scores = {
  overallScore: number;
  accuracyScore: number;
  valueScore: number;
  locationScore: number;
  commScore: number;
};

export function SubmitReviewModal({
  propertyId,
  locale,
}: {
  propertyId: string;
  locale: Locale;
}) {
  const text = copy[locale];
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState<Scores>({
    overallScore: 5,
    accuracyScore: 5,
    valueScore: 5,
    locationScore: 5,
    commScore: 5,
  });
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submitReview() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          ...scores,
          reviewTitle,
          reviewBody,
        }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!payload.success) {
        setMessage(payload.error ?? "Unable to submit review");
        return;
      }

      setMessage(text.pending);
      setReviewTitle("");
      setReviewBody("");
    } finally {
      setLoading(false);
    }
  }

  const rows: Array<{
    key: keyof Scores;
    label: string;
  }> = [
    { key: "overallScore", label: text.overall },
    { key: "accuracyScore", label: text.accuracy },
    { key: "valueScore", label: text.value },
    { key: "locationScore", label: text.location },
    { key: "commScore", label: text.communication },
  ];

  return (
    <>
      <Button onClick={() => setOpen(true)} type="button" variant="secondary">
        <MessageSquarePlus className="size-4" />
        {text.open}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-background shadow-soft">
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <h2 className="text-xl font-bold">{text.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {text.subtitle}
                </p>
              </div>
              <Button
                aria-label={text.close}
                onClick={() => setOpen(false)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="grid gap-4 p-5">
              {rows.map((row) => (
                <div
                  className="flex items-center justify-between gap-4"
                  key={row.key}
                >
                  <span className="text-sm font-bold">{row.label}</span>
                  <RatingWidget
                    onChange={(value) =>
                      setScores((current) => ({ ...current, [row.key]: value }))
                    }
                    value={scores[row.key]}
                  />
                </div>
              ))}
              <Input
                maxLength={200}
                onChange={(event) => setReviewTitle(event.target.value)}
                placeholder={text.reviewTitle}
                value={reviewTitle}
              />
              <Textarea
                maxLength={4000}
                onChange={(event) => setReviewBody(event.target.value)}
                placeholder={text.reviewBody}
                rows={5}
                value={reviewBody}
              />
              {message ? (
                <p className="text-sm font-semibold text-primary">{message}</p>
              ) : null}
              <Button disabled={loading} onClick={submitReview} type="button">
                {text.submit}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
