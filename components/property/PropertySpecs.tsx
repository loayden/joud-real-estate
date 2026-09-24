import {
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Car,
  Layers3,
  MapPin,
  Maximize2,
  Ruler,
  Tag,
} from "lucide-react";
import type { ComponentType } from "react";

import type { Locale } from "@/i18n/routing";

type SpecItem = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number | null | undefined;
};

const copy = {
  ar: {
    price: "السعر",
    area: "المساحة",
    type: "نوع العقار",
    listingType: "نوع الإعلان",
    bedrooms: "غرف النوم",
    bathrooms: "دورات المياه",
    floors: "الطوابق",
    parking: "المواقف",
    yearBuilt: "سنة البناء",
    streetWidth: "عرض الشارع",
    location: "الموقع",
    sale: "للبيع",
    rent: "للإيجار",
    sqm: "م²",
    meter: "م",
  },
  en: {
    price: "Price",
    area: "Area",
    type: "Property type",
    listingType: "Listing type",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    floors: "Floors",
    parking: "Parking",
    yearBuilt: "Year built",
    streetWidth: "Street width",
    location: "Location",
    sale: "For sale",
    rent: "For rent",
    sqm: "sqm",
    meter: "m",
  },
} as const;

function localizedName(
  value: { nameAr: string; nameEn: string } | null | undefined,
  locale: Locale,
) {
  if (!value) return null;
  return locale === "ar" ? value.nameAr : value.nameEn;
}

function formatCurrency(value: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function PropertySpecs({
  property,
  locale,
}: {
  property: {
    price: number;
    currency: string;
    area: number;
    bedrooms: number | null;
    bathrooms: number | null;
    floors: number | null;
    parkingSpaces: number | null;
    yearBuilt: number | null;
    streetWidth: number | null;
    listingType: "SALE" | "RENT";
    city: { nameAr: string; nameEn: string };
    region: { nameAr: string; nameEn: string };
    type: { nameAr: string; nameEn: string };
  };
  locale: Locale;
}) {
  const text = copy[locale];
  const location = `${localizedName(property.city, locale)}, ${localizedName(
    property.region,
    locale,
  )}`;
  const specs: SpecItem[] = [
    {
      icon: Tag,
      label: text.price,
      value: formatCurrency(property.price, property.currency, locale),
    },
    {
      icon: Maximize2,
      label: text.area,
      value: `${property.area.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")} ${text.sqm}`,
    },
    {
      icon: Building2,
      label: text.type,
      value: localizedName(property.type, locale),
    },
    {
      icon: Tag,
      label: text.listingType,
      value: property.listingType === "SALE" ? text.sale : text.rent,
    },
    { icon: BedDouble, label: text.bedrooms, value: property.bedrooms },
    { icon: Bath, label: text.bathrooms, value: property.bathrooms },
    { icon: Layers3, label: text.floors, value: property.floors },
    { icon: Car, label: text.parking, value: property.parkingSpaces },
    { icon: CalendarDays, label: text.yearBuilt, value: property.yearBuilt },
    {
      icon: Ruler,
      label: text.streetWidth,
      value: property.streetWidth
        ? `${property.streetWidth} ${text.meter}`
        : null,
    },
    { icon: MapPin, label: text.location, value: location },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {specs
        .filter((spec) => spec.value !== null && spec.value !== undefined)
        .map((spec) => {
          const Icon = spec.icon;

          return (
            <div
              className="flex min-h-20 items-center gap-3 rounded-lg border border-border bg-card p-4"
              key={spec.label}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary-50 text-primary">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted-foreground">
                  {spec.label}
                </p>
                <p className="mt-1 truncate text-sm font-bold text-foreground">
                  {spec.value}
                </p>
              </div>
            </div>
          );
        })}
    </div>
  );
}
