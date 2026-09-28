"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Link, type Locale } from "@/i18n/routing";
import { apiFetch } from "@/lib/api-client";

type PriceAlertItem = {
  id: string;
  targetPrice: number | null;
  property: {
    id: string;
    slug: string;
    titleAr: string;
    titleEn: string | null;
    price: number;
    primaryImageUrl: string | null;
  };
};

const copy = {
  ar: {
    current: "السعر الحالي",
    target: "السعر المستهدف",
    view: "عرض العقار",
    delete: "حذف",
    anyDrop: "أي انخفاض",
  },
  en: {
    current: "Current price",
    target: "Target price",
    view: "View",
    delete: "Delete",
    anyDrop: "Any drop",
  },
} as const;

function formatCurrency(value: number | null, locale: Locale) {
  if (value === null) return copy[locale].anyDrop;
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    currency: "EGP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function PriceAlertsList({
  alerts,
  locale,
}: {
  alerts: PriceAlertItem[];
  locale: Locale;
}) {
  const text = copy[locale];
  const [items, setItems] = useState(alerts);

  async function removeAlert(id: string) {
    const response = await apiFetch(`/api/price-alerts/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setItems((current) => current.filter((alert) => alert.id !== id));
    }
  }

  return (
    <div className="grid gap-4">
      {items.map((alert) => (
        <article
          className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-[120px_1fr_auto] md:items-center"
          key={alert.id}
        >
          <div className="relative aspect-video overflow-hidden rounded-md bg-muted md:aspect-square">
            <Image
              alt={
                locale === "ar" || !alert.property.titleEn
                  ? alert.property.titleAr
                  : alert.property.titleEn
              }
              className="object-cover"
              fill
              sizes="120px"
              src={
                alert.property.primaryImageUrl ??
                `/api/pexels/placeholder?seed=${alert.property.id}`
              }
            />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {locale === "ar" || !alert.property.titleEn
                ? alert.property.titleAr
                : alert.property.titleEn}
            </h2>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              {text.current}: {formatCurrency(alert.property.price, locale)} ·{" "}
              {text.target}: {formatCurrency(alert.targetPrice, locale)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href={`/property/${alert.property.slug}`}>{text.view}</Link>
            </Button>
            <Button
              onClick={() => removeAlert(alert.id)}
              type="button"
              variant="ghost"
            >
              <Trash2 className="size-4" />
              {text.delete}
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
