"use client";

import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export type PropertyTypeOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
};

export type PropertyCategoryOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  iconName: string | null;
  imageUrl: string | null;
  types: PropertyTypeOption[];
};

const copy = {
  ar: {
    category: "تصنيف العقار",
    type: "نوع العقار",
    selectCategory: "اختر التصنيف",
    selectType: "اختر النوع",
    loading: "جار التحميل",
    loadError: "تعذر تحميل تصنيفات العقارات.",
  },
  en: {
    category: "Property Category",
    type: "Property Type",
    selectCategory: "Select category",
    selectType: "Select type",
    loading: "Loading",
    loadError: "Could not load property classifications.",
  },
} as const;

async function fetchCategories() {
  const response = await fetch("/api/categories");
  const payload = (await response.json()) as ApiResponse<
    PropertyCategoryOption[]
  >;

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

export function CategoryTypeSelect({
  categoryId,
  typeId,
  onChange,
  required = false,
  className,
}: {
  categoryId?: string;
  typeId?: string;
  onChange: (selection: {
    categoryId: string;
    typeId: string;
    category: PropertyCategoryOption | null;
    type: PropertyTypeOption | null;
  }) => void;
  required?: boolean;
  className?: string;
}) {
  const locale = (useLocale() === "en" ? "en" : "ar") as "ar" | "en";
  const text = copy[locale];
  const [categories, setCategories] = useState<PropertyCategoryOption[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categoryId ?? "",
  );
  const [selectedTypeId, setSelectedTypeId] = useState(typeId ?? "");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () =>
      categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );
  const availableTypes = useMemo(
    () => selectedCategory?.types ?? [],
    [selectedCategory],
  );
  const selectedType = useMemo(
    () => availableTypes.find((type) => type.id === selectedTypeId) ?? null,
    [availableTypes, selectedTypeId],
  );

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchCategories();
        if (mounted) setCategories(data);
      } catch {
        if (mounted) setError(text.loadError);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadCategories();

    return () => {
      mounted = false;
    };
  }, [text.loadError]);

  useEffect(() => {
    setSelectedCategoryId(categoryId ?? "");
  }, [categoryId]);

  useEffect(() => {
    setSelectedTypeId(typeId ?? "");
  }, [typeId]);

  useEffect(() => {
    if (
      selectedTypeId &&
      availableTypes.length > 0 &&
      !availableTypes.some((type) => type.id === selectedTypeId)
    ) {
      setSelectedTypeId("");
    }
  }, [availableTypes, selectedTypeId]);

  useEffect(() => {
    onChange({
      categoryId: selectedCategory?.id ?? "",
      typeId: selectedType?.id ?? "",
      category: selectedCategory,
      type: selectedType,
    });
  }, [onChange, selectedCategory, selectedType]);

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {error ? (
        <div className="sm:col-span-2">
          <Alert variant="destructive">{error}</Alert>
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="property-category">{text.category}</Label>
        <Select
          disabled={isLoading}
          id="property-category"
          onChange={(event) => {
            setSelectedCategoryId(event.target.value);
            setSelectedTypeId("");
          }}
          required={required}
          value={selectedCategoryId}
        >
          <option value="">
            {isLoading ? text.loading : text.selectCategory}
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {getName(category, locale)}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="property-type">{text.type}</Label>
        <Select
          disabled={!selectedCategoryId || isLoading}
          id="property-type"
          onChange={(event) => setSelectedTypeId(event.target.value)}
          required={required}
          value={selectedTypeId}
        >
          <option value="">{isLoading ? text.loading : text.selectType}</option>
          {availableTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {getName(type, locale)}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
