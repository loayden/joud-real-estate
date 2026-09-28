"use client";

import { Flag, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/i18n/routing";
import { apiFetch } from "@/lib/api-client";

const reasons = [
  "FAKE_LISTING",
  "DUPLICATE",
  "WRONG_PRICE",
  "WRONG_LOCATION",
  "INAPPROPRIATE",
  "SOLD_NOT_UPDATED",
  "OTHER",
] as const;

const labels = {
  ar: {
    FAKE_LISTING: "إعلان وهمي",
    DUPLICATE: "إعلان مكرر",
    WRONG_PRICE: "السعر غير صحيح",
    WRONG_LOCATION: "الموقع غير صحيح",
    INAPPROPRIATE: "محتوى غير مناسب",
    SOLD_NOT_UPDATED: "تم البيع ولم يتم التحديث",
    OTHER: "أخرى",
  },
  en: {
    FAKE_LISTING: "Fake listing",
    DUPLICATE: "Duplicate",
    WRONG_PRICE: "Wrong price",
    WRONG_LOCATION: "Wrong location",
    INAPPROPRIATE: "Inappropriate",
    SOLD_NOT_UPDATED: "Sold but not updated",
    OTHER: "Other",
  },
} as const;

const copy = {
  ar: {
    open: "الإبلاغ عن العقار",
    title: "الإبلاغ عن مشكلة",
    details: "تفاصيل إضافية",
    submit: "إرسال البلاغ",
    sent: "تم إرسال البلاغ للإدارة.",
    close: "إغلاق",
  },
  en: {
    open: "Report property",
    title: "Report an issue",
    details: "Additional details",
    submit: "Submit report",
    sent: "Report sent to admins.",
    close: "Close",
  },
} as const;

export function ReportButton({
  propertyId,
  locale,
}: {
  propertyId: string;
  locale: Locale;
}) {
  const text = copy[locale];
  const [open, setOpen] = useState(false);
  const [reason, setReason] =
    useState<(typeof reasons)[number]>("FAKE_LISTING");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  async function submit() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await apiFetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, reason, details }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      setMessage(
        payload.success ? text.sent : (payload.error ?? "Unable to report"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} type="button" variant="ghost">
        <Flag className="size-4" />
        {text.open}
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={text.title}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="w-full max-w-md rounded-lg bg-background shadow-soft">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h2 className="text-xl font-bold">{text.title}</h2>
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
              <div className="grid gap-2">
                {reasons.map((item) => (
                  <label
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 text-sm font-bold"
                    key={item}
                  >
                    <input
                      checked={reason === item}
                      onChange={() => setReason(item)}
                      type="radio"
                    />
                    {labels[locale][item]}
                  </label>
                ))}
              </div>
              <Textarea
                maxLength={4000}
                onChange={(event) => setDetails(event.target.value)}
                placeholder={text.details}
                value={details}
              />
              {message ? (
                <p className="text-sm font-semibold text-primary">{message}</p>
              ) : null}
              <Button disabled={loading} onClick={submit} type="button">
                {text.submit}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
