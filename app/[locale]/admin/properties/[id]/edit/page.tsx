import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PropertyForm } from "@/components/property/PropertyForm";
import type { PropertyFormData } from "@/components/property/PropertyForm/types";
import type { Locale } from "@/i18n/routing";
import { getAdminPropertyForReview } from "@/lib/admin-properties";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: { title: "تعديل العقار | الإدارة" },
  en: { title: "Edit Property | Admin" },
} as const;

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale; id: string };
}): Metadata {
  return { title: copy[locale].title };
}

export default async function AdminEditPropertyPage({
  params: { id },
}: {
  params: { id: string; locale: Locale };
}) {
  const review = await getAdminPropertyForReview(id);

  if (!review) {
    notFound();
  }

  const { property } = review;
  const initialProperty: Partial<PropertyFormData> = {
    id: property.id,
    slug: property.slug,
    status: property.status,
    titleAr: property.titleAr,
    titleEn: property.titleEn ?? "",
    descriptionAr: property.descriptionAr,
    descriptionEn: property.descriptionEn ?? "",
    listingType: property.listingType,
    categoryId: property.categoryId,
    typeId: property.typeId,
    regionId: property.regionId,
    cityId: property.cityId,
    neighborhoodId: property.neighborhoodId,
    price: property.price,
    priceNegotiable: property.priceNegotiable,
    area: property.area,
    areaUnit: property.areaUnit,
    bedrooms: property.bedrooms ?? undefined,
    bathrooms: property.bathrooms ?? undefined,
    floors: property.floors ?? undefined,
    parkingSpaces: property.parkingSpaces ?? undefined,
    yearBuilt: property.yearBuilt ?? undefined,
    streetWidth: property.streetWidth ?? undefined,
    address: property.address ?? "",
    amenityIds: property.amenityIds,
    images: property.images,
  };

  return (
    <PropertyForm
      apiBasePath="/api/admin/properties"
      initialProperty={initialProperty}
      returnPath="/admin/properties"
    />
  );
}
