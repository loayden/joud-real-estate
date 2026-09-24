import { Heart } from "lucide-react";
import type { Metadata } from "next";

import { FavoritesGrid } from "@/components/property/FavoritesGrid";
import { type Locale } from "@/i18n/routing";
import { requireSession } from "@/lib/auth-utils";
import { getUserFavorites } from "@/lib/favorites";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: {
    pageTitle: "المفضلة | جود العقارية",
    title: "المفضلة",
    description: "كل العقارات التي حفظتها للرجوع إليها بسرعة.",
    count: "عقار محفوظ",
  },
  en: {
    pageTitle: "Favorites | Joud Real Estate",
    title: "Favorites",
    description: "All properties you saved for quick access.",
    count: "saved properties",
  },
} as const;

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  return {
    title: copy[locale].pageTitle,
  };
}

export default async function FavoritesPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const session = await requireSession();
  const text = copy[locale];
  const favorites = await getUserFavorites(session.user.id);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="grid gap-2">
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-normal">
            <Heart className="size-7 text-primary" />
            {text.title}
          </h1>
          <p className="max-w-2xl text-muted-foreground">{text.description}</p>
        </div>
        <span className="w-fit rounded-full bg-muted px-3 py-1 text-sm font-bold text-muted-foreground">
          {favorites.length} {text.count}
        </span>
      </div>

      <FavoritesGrid initialFavorites={favorites} locale={locale} />
    </div>
  );
}
