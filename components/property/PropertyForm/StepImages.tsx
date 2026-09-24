"use client";

import { useState } from "react";

import type { StepProps } from "@/components/property/PropertyForm/types";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const text = {
  ar: {
    title: "صور العقار",
    body: "أضف حتى 20 صورة. يتم تحويل الصور إلى WebP وإزالة بيانات الموقع والبيانات الوصفية قبل التخزين.",
    missingDraft:
      "احفظ المعلومات الأساسية أولاً حتى يتم إنشاء مسودة قبل رفع الصور.",
    back: "السابق",
    next: "متابعة للمراجعة",
  },
  en: {
    title: "Property images",
    body: "Add up to 20 images. Images are converted to WebP and metadata is stripped before storage.",
    missingDraft:
      "Save the basic information first so a draft exists before uploading images.",
    back: "Back",
    next: "Continue to review",
  },
} as const;

export function StepImages({ data, locale, onBack, onNext }: StepProps) {
  const copy = text[locale];
  const [images, setImages] = useState(data.images ?? []);

  return (
    <div className="grid gap-6">
      <Alert>
        <div className="grid gap-2">
          <strong>{copy.title}</strong>
          <span>{copy.body}</span>
        </div>
      </Alert>

      {data.id ? (
        <ImageUploader
          existingImages={images}
          locale={locale}
          maxImages={20}
          onImagesChange={setImages}
          propertyId={data.id}
        />
      ) : (
        <Alert variant="destructive">{copy.missingDraft}</Alert>
      )}

      <div className="flex items-center justify-between">
        <Button onClick={onBack} type="button" variant="secondary">
          {copy.back}
        </Button>
        <Button onClick={() => onNext({ images })} type="button">
          {copy.next}
        </Button>
      </div>
    </div>
  );
}
