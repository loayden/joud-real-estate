import {
  Bath,
  BedDouble,
  Building2,
  Check,
  MapPin,
  Maximize2,
  X,
} from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Link, type Locale } from "@/i18n/routing";

type ComparedProperty = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string | null;
  price: number;
  currency: string;
  area: number;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  listingType: "SALE" | "RENT";
  avgRating?: number | null;
  ratingCount?: number;
  images: Array<{
    id: string;
    url: string;
    thumbnailUrl: string | null;
    isPrimary: boolean;
  }>;
  city: { nameAr: string; nameEn: string };
  region: { nameAr: string; nameEn: string };
  category: { nameAr: string; nameEn: string };
  type: { nameAr: string; nameEn: string };
};

const copy = {
  ar: {
    view: "عرض العقار",
    price: "السعر",
    location: "الموقع",
    type: "النوع",
    area: "المساحة",
    beds: "غرف النوم",
    baths: "دورات المياه",
    parking: "مواقف",
    rating: "التقييم",
    sale: "للبيع",
    rent: "للإيجار",
    yes: "نعم",
    no: "لا",
    empty: "لم يتم اختيار عقارات.",
  },
  en: {
    view: "View property",
    price: "Price",
    location: "Location",
    type: "Type",
    area: "Area",
    beds: "Bedrooms",
    baths: "Bathrooms",
    parking: "Parking",
    rating: "Rating",
    sale: "For sale",
    rent: "For rent",
    yes: "Yes",
    no: "No",
    empty: "No properties selected.",
  },
} as const;

function localize(value: { nameAr: string; nameEn: string }, locale: Locale) {
  return locale === "ar" ? value.nameAr : value.nameEn;
}

function title(property: ComparedProperty, locale: Locale) {
  return locale === "ar" || !property.titleEn
    ? property.titleAr
    : property.titleEn;
}

function formatCurrency(value: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function ComparisonTable({
  properties,
  locale,
}: {
  properties: ComparedProperty[];
  locale: Locale;
}) {
  const text = copy[locale];
  const rows = [
    {
      label: text.price,
      icon: Building2,
      value: (property: ComparedProperty) =>
        formatCurrency(property.price, property.currency, locale),
    },
    {
      label: text.location,
      icon: MapPin,
      value: (property: ComparedProperty) =>
        `${localize(property.city, locale)}${locale === "ar" ? "،" : ", "}${localize(property.region, locale)}`,
    },
    {
      label: text.type,
      icon: Building2,
      value: (property: ComparedProperty) =>
        `${localize(property.category, locale)} · ${localize(property.type, locale)}`,
    },
    {
      label: text.area,
      icon: Maximize2,
      value: (property: ComparedProperty) =>
        `${property.area} ${locale === "ar" ? "م²" : "sqm"}`,
    },
    {
      label: text.beds,
      icon: BedDouble,
      value: (property: ComparedProperty) => property.bedrooms ?? "-",
    },
    {
      label: text.baths,
      icon: Bath,
      value: (property: ComparedProperty) => property.bathrooms ?? "-",
    },
    {
      label: text.parking,
      icon: Check,
      value: (property: ComparedProperty) => property.parkingSpaces ?? "-",
    },
    {
      label: text.rating,
      icon: Check,
      value: (property: ComparedProperty) =>
        property.avgRating
          ? `${property.avgRating.toFixed(1)} (${property.ratingCount ?? 0})`
          : "-",
    },
  ];

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[860px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 align-top">
            <th className="w-48 px-4 py-4 text-start font-bold"> </th>
            {properties.map((property) => (
              <th className="px-4 py-4 text-start" key={property.id}>
                <div className="grid gap-3">
                  <div className="aspect-video overflow-hidden rounded-md bg-muted">
                    <div className="relative h-full w-full">
                      <Image
                        alt={title(property, locale)}
                        className="object-cover"
                        fill
                        sizes="240px"
                        src={
                          property.images[0]?.thumbnailUrl ??
                          property.images[0]?.url ??
                          `/api/pexels/placeholder?seed=${property.id}`
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <p className="line-clamp-2 text-base font-bold">
                      {title(property, locale)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      {property.listingType === "SALE" ? text.sale : text.rent}
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/property/${property.slug}`}>{text.view}</Link>
                  </Button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const Icon = row.icon;

            return (
              <tr key={row.label}>
                <th className="bg-muted/35 px-4 py-4 text-start font-bold">
                  <span className="inline-flex items-center gap-2">
                    <Icon className="size-4 text-primary" />
                    {row.label}
                  </span>
                </th>
                {properties.map((property) => (
                  <td className="px-4 py-4 font-semibold" key={property.id}>
                    {row.value(property)}
                  </td>
                ))}
              </tr>
            );
          })}
          {properties.length === 0 ? (
            <tr>
              <td
                className="px-4 py-10 text-center text-muted-foreground"
                colSpan={5}
              >
                <X className="mx-auto mb-2 size-6" />
                {text.empty}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
