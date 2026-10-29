import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PropertyForm } from "@/components/property/PropertyForm";
import type { PropertyFormData } from "@/components/property/PropertyForm/types";
import type { Locale } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { findPropertyDetailById } from "@/lib/property-service";
import { serializeProperty } from "@/lib/property-serialization";

function isAdmin(role?: string | null) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

const copy = {
  ar: { title: "تعديل العقار" },
  en: { title: "Edit Property" },
} as const;

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = (await paramsPromise) as { locale: Locale };
  return { title: copy[locale].title };
}

export default async function EditPropertyPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = (await paramsPromise) as {
    id: string;
    locale: Locale;
  };
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/my-listings/${id}/edit`);
  }

  const property = await findPropertyDetailById(id);

  if (!property) {
    notFound();
  }

  if (property.userId !== session.user.id && !isAdmin(session.user.role)) {
    notFound();
  }

  const serialized = serializeProperty(property);
  const initialProperty: Partial<PropertyFormData> = {
    id: serialized.id,
    slug: serialized.slug,
    status: serialized.status,
    titleAr: serialized.titleAr,
    titleEn: serialized.titleEn ?? "",
    descriptionAr: serialized.descriptionAr,
    descriptionEn: serialized.descriptionEn ?? "",
    listingType: serialized.listingType,
    categoryId: serialized.categoryId,
    typeId: serialized.typeId,
    regionId: serialized.regionId,
    cityId: serialized.cityId,
    neighborhoodId: serialized.neighborhoodId,
    price: serialized.price,
    priceNegotiable: serialized.priceNegotiable,
    area: serialized.area,
    areaUnit: serialized.areaUnit,
    bedrooms: serialized.bedrooms ?? undefined,
    bathrooms: serialized.bathrooms ?? undefined,
    floors: serialized.floors ?? undefined,
    parkingSpaces: serialized.parkingSpaces ?? undefined,
    yearBuilt: serialized.yearBuilt ?? undefined,
    streetWidth: serialized.streetWidth ?? undefined,
    address: serialized.address ?? "",
    amenityIds: serialized.amenityIds,
    images: serialized.images,
  };

  return <PropertyForm initialProperty={initialProperty} />;
}
