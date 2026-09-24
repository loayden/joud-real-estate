import type { Metadata } from "next";
import { Star } from "lucide-react";

import { ReviewModerationQueue } from "@/components/admin/ReviewModerationQueue";
import type { Locale } from "@/i18n/routing";
import { listAdminRatings } from "@/lib/ratings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: {
    title: "مراجعة التقييمات",
    description: "اعتمد أو ارفض تقييمات المستخدمين قبل ظهورها للعامة.",
  },
  en: {
    title: "Review moderation",
    description: "Approve or reject user reviews before they go public.",
  },
} as const;

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  return { title: copy[locale].title };
}

export default async function AdminRatingsPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const text = copy[locale];
  const ratings = await listAdminRatings("PENDING");

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <div className="inline-flex w-fit items-center gap-2 rounded-md bg-primary-50 px-3 py-2 text-sm font-bold text-primary">
          <Star className="size-4" />
          {ratings.length}
        </div>
        <h1 className="text-3xl font-bold tracking-normal">{text.title}</h1>
        <p className="text-muted-foreground">{text.description}</p>
      </div>
      <ReviewModerationQueue initialRatings={ratings} locale={locale} />
    </div>
  );
}
