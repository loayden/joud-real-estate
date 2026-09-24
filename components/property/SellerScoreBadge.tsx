import { ShieldCheck, Star } from "lucide-react";

import type { Locale } from "@/i18n/routing";

const copy = {
  ar: { reviews: "تقييمات موثقة", owner: "مالك موثّق" },
  en: { reviews: "verified reviews", owner: "Verified owner" },
} as const;

export function SellerScoreBadge({
  score,
  count,
  locale,
}: {
  score: number | null | undefined;
  count: number | null | undefined;
  locale: Locale;
}) {
  const text = copy[locale];
  const hasScore = typeof score === "number" && (count ?? 0) > 0;

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-primary-50 px-3 py-2 text-xs font-bold text-primary">
      {hasScore ? (
        <>
          <Star className="size-4 fill-current text-gold-700" />
          {score.toFixed(1)} · {count} {text.reviews}
        </>
      ) : (
        <>
          <ShieldCheck className="size-4" />
          {text.owner}
        </>
      )}
    </div>
  );
}
