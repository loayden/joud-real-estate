"use client";

import { useState } from "react";

import { AmenitiesGrid } from "@/components/property/AmenitiesGrid";
import type { StepProps } from "@/components/property/PropertyForm/types";
import { Button } from "@/components/ui/button";

const text = {
  ar: { back: "السابق", next: "حفظ ومتابعة" },
  en: { back: "Back", next: "Save and continue" },
} as const;

export function StepAmenities({
  data,
  isSaving,
  locale,
  onBack,
  onNext,
}: StepProps) {
  const copy = text[locale];
  const [selectedIds, setSelectedIds] = useState(data.amenityIds);

  return (
    <div className="grid gap-6">
      <AmenitiesGrid onChange={setSelectedIds} selectedIds={selectedIds} />

      <div className="flex items-center justify-between">
        <Button
          disabled={isSaving}
          onClick={onBack}
          type="button"
          variant="secondary"
        >
          {copy.back}
        </Button>
        <Button
          disabled={isSaving}
          onClick={() => onNext({ amenityIds: selectedIds })}
          type="button"
        >
          {isSaving ? "..." : copy.next}
        </Button>
      </div>
    </div>
  );
}
