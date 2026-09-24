"use client";

import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export type AmenityOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  iconName: string | null;
  category: string | null;
  sortOrder: number;
};

const groupLabels = {
  ar: {
    indoor: "داخل المبنى",
    outdoor: "خارج المبنى",
    location: "الموقع",
    utilities: "المرافق",
    luxury: "الرفاهية",
    other: "أخرى",
    loading: "جار تحميل المرافق",
    loadError: "تعذر تحميل المرافق.",
  },
  en: {
    indoor: "Indoor",
    outdoor: "Outdoor",
    location: "Location",
    utilities: "Utilities",
    luxury: "Luxury",
    other: "Other",
    loading: "Loading amenities",
    loadError: "Could not load amenities.",
  },
} as const;

const groupOrder = ["indoor", "outdoor", "location", "utilities", "luxury"];

async function fetchAmenities() {
  const response = await fetch("/api/amenities");
  const payload = (await response.json()) as ApiResponse<AmenityOption[]>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? "Request failed" : payload.error);
  }

  return payload.data;
}

function getName(
  item: { nameAr: string; nameEn: string },
  locale: "ar" | "en",
) {
  return locale === "ar" ? item.nameAr : item.nameEn;
}

export function AmenitiesGrid({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const locale = (useLocale() === "en" ? "en" : "ar") as "ar" | "en";
  const labels = groupLabels[locale];
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const [amenities, setAmenities] = useState<AmenityOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const groupedAmenities = useMemo(() => {
    const groups = new Map<string, AmenityOption[]>();

    for (const amenity of amenities) {
      const key = amenity.category ?? "other";
      const current = groups.get(key) ?? [];
      current.push(amenity);
      groups.set(key, current);
    }

    return Array.from(groups.entries()).sort(([left], [right]) => {
      const leftIndex = groupOrder.indexOf(left);
      const rightIndex = groupOrder.indexOf(right);

      if (leftIndex === -1 && rightIndex === -1)
        return left.localeCompare(right);
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });
  }, [amenities]);

  useEffect(() => {
    let mounted = true;

    async function loadAmenities() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchAmenities();
        if (mounted) setAmenities(data);
      } catch {
        if (mounted) setError(labels.loadError);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadAmenities();

    return () => {
      mounted = false;
    };
  }, [labels.loadError]);

  function toggleAmenity(id: string) {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
      return;
    }

    onChange([...selectedIds, id]);
  }

  if (isLoading) {
    return (
      <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        {labels.loading}
      </div>
    );
  }

  if (error) {
    return <Alert variant="destructive">{error}</Alert>;
  }

  return (
    <div className="grid gap-6">
      {groupedAmenities.map(([group, items]) => (
        <section className="grid gap-3" key={group}>
          <h3 className="text-base font-bold">
            {labels[group as keyof typeof labels] ?? labels.other}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((amenity) => (
              <Label
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                htmlFor={`amenity-${amenity.id}`}
                key={amenity.id}
              >
                <Checkbox
                  checked={selectedSet.has(amenity.id)}
                  id={`amenity-${amenity.id}`}
                  onChange={() => toggleAmenity(amenity.id)}
                />
                <span>{getName(amenity, locale)}</span>
              </Label>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
