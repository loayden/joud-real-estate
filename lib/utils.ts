import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { Locale } from "@/i18n/routing";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  currency = "EGP",
  locale: Locale = "ar",
): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function localizeName(
  item: { nameAr: string; nameEn: string } | null | undefined,
  locale: Locale,
): string {
  if (!item) return "";
  return locale === "ar" ? item.nameAr : item.nameEn;
}

export function localizePropertyTitle(
  property: { titleAr: string; titleEn: string | null },
  locale: Locale,
): string {
  if (locale === "en" && property.titleEn) return property.titleEn;
  return property.titleAr;
}

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
  }).format(date);
}

export function formatArea(
  area: number | null | undefined,
  locale: Locale = "ar",
): string | null {
  if (!area) return null;
  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    maximumFractionDigits: 0,
  }).format(area);
  return locale === "ar" ? `${formatted} م²` : `${formatted} sqm`;
}
