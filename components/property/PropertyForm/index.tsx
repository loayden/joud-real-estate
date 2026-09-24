"use client";

import { useLocale } from "next-intl";
import { useMemo, useState } from "react";

import { StepAmenities } from "@/components/property/PropertyForm/StepAmenities";
import { StepBasicInfo } from "@/components/property/PropertyForm/StepBasicInfo";
import { StepDetails } from "@/components/property/PropertyForm/StepDetails";
import { StepImages } from "@/components/property/PropertyForm/StepImages";
import { StepLocation } from "@/components/property/PropertyForm/StepLocation";
import { StepReview } from "@/components/property/PropertyForm/StepReview";
import {
  emptyPropertyFormData,
  type ApiResponse,
  type PropertyFormData,
  type SerializedProperty,
} from "@/components/property/PropertyForm/types";
import { Alert } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type SavePayload =
  | SerializedProperty
  | { id: string; slug: string; property: SerializedProperty | null };

const stepCopy = {
  ar: {
    heading: "إضافة عقار",
    editHeading: "تعديل العقار",
    description:
      "أكمل الخطوات بالترتيب. يتم حفظ المسودة تلقائياً بعد أول خطوة.",
    steps: [
      "المعلومات الأساسية",
      "الموقع",
      "التفاصيل",
      "المرافق",
      "الصور",
      "المراجعة",
    ],
    saveError: "تعذر حفظ العقار. تحقق من البيانات وحاول مرة أخرى.",
  },
  en: {
    heading: "Add property",
    editHeading: "Edit property",
    description:
      "Complete the steps in order. A draft is saved after the first step.",
    steps: ["Basics", "Location", "Details", "Amenities", "Images", "Review"],
    saveError: "Could not save the property. Check the data and try again.",
  },
} as const;

function isFilledString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function cleanPayload(data: PropertyFormData, action: "draft" | "submit") {
  const payload: Record<string, unknown> = { action };

  for (const [key, value] of Object.entries(data)) {
    if (
      key === "id" ||
      key === "slug" ||
      key === "status" ||
      key === "images"
    ) {
      continue;
    }
    if (value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (typeof value === "number" && Number.isNaN(value)) continue;
    if (value === undefined) continue;
    payload[key] = value;
  }

  return payload;
}

function extractSavedProperty(payload: SavePayload): Partial<PropertyFormData> {
  if ("property" in payload) {
    return payload.property ?? { id: payload.id, slug: payload.slug };
  }

  return payload;
}

function mergeInitialProperty(
  initialProperty?: Partial<PropertyFormData> | null,
): PropertyFormData {
  return {
    ...emptyPropertyFormData,
    ...initialProperty,
    titleEn: initialProperty?.titleEn ?? "",
    descriptionEn: initialProperty?.descriptionEn ?? "",
    neighborhoodId: initialProperty?.neighborhoodId ?? null,
    priceNegotiable: initialProperty?.priceNegotiable ?? false,
    areaUnit: initialProperty?.areaUnit ?? "sqm",
    street: initialProperty?.street ?? "",
    buildingNumber: initialProperty?.buildingNumber ?? "",
    apartmentNumber: initialProperty?.apartmentNumber ?? "",
    floorNumber: initialProperty?.floorNumber,
    latitude: initialProperty?.latitude,
    longitude: initialProperty?.longitude,
    amenityIds: initialProperty?.amenityIds ?? [],
  };
}

async function parseApiResponse<T>(response: Response) {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? "Request failed" : payload.error);
  }

  return payload.data;
}

export function PropertyForm({
  initialProperty,
  apiBasePath = "/api/properties",
  returnPath = "/my-listings",
}: {
  initialProperty?: Partial<PropertyFormData> | null;
  apiBasePath?: string;
  returnPath?: string;
}) {
  const locale = (useLocale() === "en" ? "en" : "ar") as "ar" | "en";
  const copy = stepCopy[locale];
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState(() => mergeInitialProperty(initialProperty));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(
    () =>
      initialProperty?.id && isFilledString(initialProperty.titleAr)
        ? copy.editHeading
        : copy.heading,
    [
      copy.editHeading,
      copy.heading,
      initialProperty?.id,
      initialProperty?.titleAr,
    ],
  );

  async function saveProperty(
    partial: Partial<PropertyFormData>,
    action: "draft" | "submit",
  ) {
    const nextData = { ...data, ...partial };
    setIsSaving(true);
    setError(null);

    try {
      const payload = cleanPayload(nextData, action);
      const response = await fetch(
        nextData.id ? `${apiBasePath}/${nextData.id}` : apiBasePath,
        {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: nextData.id ? "PUT" : "POST",
        },
      );
      const saved = await parseApiResponse<SavePayload>(response);
      const savedProperty = extractSavedProperty(saved);
      const merged = mergeInitialProperty({
        ...nextData,
        ...savedProperty,
      });
      setData(merged);
      return merged;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : copy.saveError);
      throw saveError;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleNext(partial: Partial<PropertyFormData>) {
    try {
      if (step === 4) {
        setData((current) => ({ ...current, ...partial }));
        setStep((current) => Math.min(current + 1, copy.steps.length - 1));
        return;
      }

      await saveProperty(partial, "draft");
      setStep((current) => Math.min(current + 1, copy.steps.length - 1));
    } catch {
      // Error is surfaced above the current step.
    }
  }

  async function handleSubmit() {
    try {
      await saveProperty({}, "submit");
      router.push(returnPath);
      router.refresh();
    } catch {
      // Error is surfaced above the current step.
    }
  }

  function handleBack() {
    setError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8">
        <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {copy.steps.map((label, index) => {
            const active = index === step;
            const completed = index < step;

            return (
              <li
                className={cn(
                  "flex min-h-14 items-center gap-3 rounded-md border px-3 text-sm font-bold",
                  active && "border-primary bg-primary-50 text-primary",
                  completed &&
                    "border-emerald-200 bg-emerald-50 text-emerald-800",
                  !active &&
                    !completed &&
                    "border-border bg-background text-muted-foreground",
                )}
                key={label}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border text-xs",
                    active &&
                      "border-primary bg-primary text-primary-foreground",
                    completed && "border-emerald-600 bg-emerald-600 text-white",
                  )}
                >
                  {index + 1}
                </span>
                <span>{label}</span>
              </li>
            );
          })}
        </ol>

        {error ? <Alert variant="destructive">{error}</Alert> : null}

        {step === 0 ? (
          <StepBasicInfo
            data={data}
            isSaving={isSaving}
            locale={locale}
            onBack={handleBack}
            onNext={handleNext}
          />
        ) : null}
        {step === 1 ? (
          <StepLocation
            data={data}
            isSaving={isSaving}
            locale={locale}
            onBack={handleBack}
            onNext={handleNext}
          />
        ) : null}
        {step === 2 ? (
          <StepDetails
            data={data}
            isSaving={isSaving}
            locale={locale}
            onBack={handleBack}
            onNext={handleNext}
          />
        ) : null}
        {step === 3 ? (
          <StepAmenities
            data={data}
            isSaving={isSaving}
            locale={locale}
            onBack={handleBack}
            onNext={handleNext}
          />
        ) : null}
        {step === 4 ? (
          <StepImages
            data={data}
            isSaving={isSaving}
            locale={locale}
            onBack={handleBack}
            onNext={handleNext}
          />
        ) : null}
        {step === 5 ? (
          <StepReview
            data={data}
            isSaving={isSaving}
            locale={locale}
            onBack={handleBack}
            onSubmit={handleSubmit}
            onEdit={(stepIndex) => setStep(stepIndex)}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
