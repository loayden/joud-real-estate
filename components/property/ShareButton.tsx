"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";

const copy = {
  ar: {
    share: "مشاركة",
    copied: "تم نسخ الرابط",
  },
  en: {
    share: "Share",
    copied: "Link copied",
  },
} as const;

export function ShareButton({
  locale,
  title,
  url,
}: {
  locale: Locale;
  title: string;
  url: string;
}) {
  const text = copy[locale];
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      // User cancelled share or share failed — fall through to clipboard
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard write failed — silently ignore
    }
  }

  return (
    <Button onClick={handleShare} type="button" variant="secondary">
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
      {copied ? text.copied : text.share}
    </Button>
  );
}
