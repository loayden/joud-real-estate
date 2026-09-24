"use client";

import { useMemo } from "react";

import type { PropertyFormData } from "@/components/property/PropertyForm/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

const text = {
  ar: {
    pending: "سيتم إرسال العقار للمراجعة، ولن يظهر للعامة قبل موافقة الإدارة.",
    submit: "تأكيد وإرسال للمراجعة",
    back: "السابق",
    edit: "تعديل",
    summary: "ملخص العقار",
    titleAr: "العنوان بالعربية",
    titleEn: "العنوان بالإنجليزية",
    sale: "للبيع",
    rent: "للإيجار",
    price: "السعر",
    negotiable: "قابل للتفاوض",
    area: "المساحة",
    bedrooms: "غرف النوم",
    bathrooms: "دورات المياه",
    descriptionAr: "الوصف بالعربية",
    descriptionEn: "الوصف بالإنجليزية",
    location: "الموقع",
    city: "المدينة",
    areaLocation: "المنطقة",
    street: "الشارع / العنوان التفصيلي",
    building: "رقم العمارة",
    apartment: "رقم الشقة",
    floor: "الدور",
    coordinates: "الإحداثيات",
    amenities: "المرافق المختارة",
    noAmenities: "لم يتم اختيار أي مرافق",
    media: "الوسائط (صور / فيديو)",
    noMedia: "لم يتم رفع أي وسائط",
    confirm: "هل أنت متأكد من إرسال هذا العقار للمراجعة؟",
  },
  en: {
    pending:
      "The property will be sent for moderation and will not be public until approved.",
    submit: "Confirm and submit",
    back: "Back",
    edit: "Edit",
    summary: "Property summary",
    titleAr: "Arabic title",
    titleEn: "English title",
    sale: "For sale",
    rent: "For rent",
    price: "Price",
    negotiable: "Negotiable",
    area: "Area",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    descriptionAr: "Arabic description",
    descriptionEn: "English description",
    location: "Location",
    city: "City",
    areaLocation: "Area",
    street: "Street / Address",
    building: "Building no.",
    apartment: "Apt no.",
    floor: "Floor",
    coordinates: "Coordinates",
    amenities: "Selected amenities",
    noAmenities: "No amenities selected",
    media: "Media (Images / Video)",
    noMedia: "No media uploaded",
    confirm: "Are you sure you want to submit this property for review?",
  },
} as const;

function formatPrice(price: number | undefined, locale: "ar" | "en") {
  if (!price) return "-";
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    currency: "EGP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(price);
}

type ReviewSectionProps = {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
  editLabel?: string;
};

function ReviewSection({
  title,
  children,
  onEdit,
  editLabel,
}: ReviewSectionProps) {
  return (
    <section className="relative grid gap-4 rounded-md border border-border p-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-h3 font-bold">{title}</h3>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            type="button"
            className="shrink-0"
          >
            <Pencil className="ms-1.5 size-4" />
            <span className="hidden sm:inline">{editLabel ?? "Edit"}</span>
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}

export function StepReview({
  data,
  isSaving,
  locale,
  onBack,
  onSubmit,
  onEdit,
}: {
  data: PropertyFormData;
  isSaving: boolean;
  locale: "ar" | "en";
  onBack: () => void;
  onSubmit: () => Promise<void>;
  onEdit?: (stepIndex: number) => void;
}) {
  const copy = text[locale];

  const amenityNames = useMemo(() => {
    if (!data.amenityIds.length) return [];
    return data.amenityIds.map((id) => id);
  }, [data.amenityIds]);

  async function handleConfirm() {
    if (!window.confirm(copy.confirm)) return;
    await onSubmit();
  }

  return (
    <div className="grid gap-6">
      <Alert>{copy.pending}</Alert>

      <ReviewSection
        title={copy.summary}
        onEdit={onEdit ? () => onEdit(0) : undefined}
        editLabel={copy.edit}
      >
        <dl className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-small font-bold text-muted-foreground">
              {copy.titleAr}
            </dt>
            <dd className="mt-0.5">{data.titleAr || "-"}</dd>
          </div>
          <div>
            <dt className="text-small font-bold text-muted-foreground">
              {copy.titleEn}
            </dt>
            <dd className="mt-0.5">{data.titleEn || "-"}</dd>
          </div>
          <div>
            <dt className="text-small font-bold text-muted-foreground">
              {data.listingType === "SALE" ? copy.sale : copy.rent}
            </dt>
            <dd className="mt-0.5 flex items-center gap-2">
              <span>{formatPrice(data.price, locale)}</span>
              {data.priceNegotiable ? (
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary">
                  {copy.negotiable}
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-small font-bold text-muted-foreground">
              {copy.area}
            </dt>
            <dd className="mt-0.5">
              {data.area
                ? `${data.area} ${locale === "ar" ? "م²" : "sqm"}`
                : "-"}
            </dd>
          </div>
          {data.bedrooms != null && data.bedrooms > 0 ? (
            <div>
              <dt className="text-small font-bold text-muted-foreground">
                {copy.bedrooms}
              </dt>
              <dd className="mt-0.5">{data.bedrooms}</dd>
            </div>
          ) : null}
          {data.bathrooms != null && data.bathrooms > 0 ? (
            <div>
              <dt className="text-small font-bold text-muted-foreground">
                {copy.bathrooms}
              </dt>
              <dd className="mt-0.5">{data.bathrooms}</dd>
            </div>
          ) : null}
          <div className="md:col-span-2">
            <dt className="text-small font-bold text-muted-foreground">
              {copy.descriptionAr}
            </dt>
            <dd className="mt-1 leading-7">{data.descriptionAr || "-"}</dd>
          </div>
          {data.descriptionEn ? (
            <div className="md:col-span-2">
              <dt className="text-small font-bold text-muted-foreground">
                {copy.descriptionEn}
              </dt>
              <dd className="mt-1 leading-7">{data.descriptionEn}</dd>
            </div>
          ) : null}
        </dl>
      </ReviewSection>

      <ReviewSection
        title={copy.location}
        onEdit={onEdit ? () => onEdit(1) : undefined}
        editLabel={copy.edit}
      >
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-small font-bold text-muted-foreground">
              {copy.city}
            </dt>
            <dd className="mt-0.5">{data.cityId ? "—" : "-"}</dd>
          </div>
          <div>
            <dt className="text-small font-bold text-muted-foreground">
              {copy.areaLocation}
            </dt>
            <dd className="mt-0.5">{data.neighborhoodId ? "—" : "-"}</dd>
          </div>
          {data.street ? (
            <div>
              <dt className="text-small font-bold text-muted-foreground">
                {copy.street}
              </dt>
              <dd className="mt-0.5">{data.street}</dd>
            </div>
          ) : null}
          {data.buildingNumber ? (
            <div>
              <dt className="text-small font-bold text-muted-foreground">
                {copy.building}
              </dt>
              <dd className="mt-0.5">{data.buildingNumber}</dd>
            </div>
          ) : null}
          {data.apartmentNumber ? (
            <div>
              <dt className="text-small font-bold text-muted-foreground">
                {copy.apartment}
              </dt>
              <dd className="mt-0.5">{data.apartmentNumber}</dd>
            </div>
          ) : null}
          {data.floorNumber ? (
            <div>
              <dt className="text-small font-bold text-muted-foreground">
                {copy.floor}
              </dt>
              <dd className="mt-0.5">{data.floorNumber}</dd>
            </div>
          ) : null}
          {data.latitude && data.longitude ? (
            <div>
              <dt className="text-small font-bold text-muted-foreground">
                {copy.coordinates}
              </dt>
              <dd className="mt-0.5">
                {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
              </dd>
            </div>
          ) : null}
        </dl>
      </ReviewSection>

      <ReviewSection
        title={copy.amenities}
        onEdit={onEdit ? () => onEdit(3) : undefined}
        editLabel={copy.edit}
      >
        {amenityNames.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {amenityNames.map((id) => (
              <span
                key={id}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold"
              >
                {id}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{copy.noAmenities}</p>
        )}
      </ReviewSection>

      <ReviewSection
        title={copy.media}
        onEdit={onEdit ? () => onEdit(4) : undefined}
        editLabel={copy.edit}
      >
        {data.images && data.images.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.images.map((image, index) => (
              <span
                key={image.id}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold"
              >
                {image.mediaType === "video" ? "🎥" : "🖼️"}
                {index + 1}
                {image.isPrimary && (
                  <span className="rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-gold-foreground">
                    Primary
                  </span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{copy.noMedia}</p>
        )}
      </ReviewSection>

      <div className="flex items-center justify-between">
        <Button
          disabled={isSaving}
          onClick={onBack}
          type="button"
          variant="secondary"
        >
          {copy.back}
        </Button>
        <Button disabled={isSaving} onClick={handleConfirm} type="button">
          {isSaving ? "..." : copy.submit}
        </Button>
      </div>
    </div>
  );
}
