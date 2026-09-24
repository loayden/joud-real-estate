"use client";

import { Bell, BellRing } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";

const copy = {
  ar: {
    subscribe: "تنبيه انخفاض السعر",
    subscribed: "تم تفعيل التنبيه",
    login: "سجّل الدخول لتفعيل التنبيه",
    genericError: "حدث خطأ. حاول مرة أخرى.",
  },
  en: {
    subscribe: "Price drop alert",
    subscribed: "Alert enabled",
    login: "Sign in to enable alerts",
    genericError: "Something went wrong. Please try again.",
  },
} as const;

export function PriceAlertButton({
  propertyId,
  locale,
}: {
  propertyId: string;
  locale: Locale;
}) {
  const text = copy[locale];
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/price-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        error?: string;
        code?: string;
      };

      if (!payload.success) {
        setMessage(
          payload.code === "UNAUTHORIZED"
            ? text.login
            : (payload.error ?? text.genericError),
        );
        return;
      }

      setEnabled(true);
      setMessage(text.subscribed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button
        disabled={loading || enabled}
        onClick={subscribe}
        type="button"
        variant={enabled ? "gold" : "secondary"}
      >
        {enabled ? (
          <BellRing className="size-4" />
        ) : (
          <Bell className="size-4" />
        )}
        {enabled ? text.subscribed : text.subscribe}
      </Button>
      {message ? (
        <p className="text-xs font-semibold text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
