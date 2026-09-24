"use client";

import { useCallback } from "react";
import { useForm } from "react-hook-form";

import { CategoryTypeSelect } from "@/components/property/CategoryTypeSelect";
import type {
  PropertyFormData,
  StepProps,
} from "@/components/property/PropertyForm/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type BasicInfoValues = Pick<
  PropertyFormData,
  | "titleAr"
  | "titleEn"
  | "descriptionAr"
  | "descriptionEn"
  | "listingType"
  | "categoryId"
  | "typeId"
>;

const text = {
  ar: {
    title: "المعلومات الأساسية",
    titleAr: "عنوان الإعلان بالعربية",
    titleEn: "العنوان بالإنجليزية",
    descriptionAr: "وصف العقار بالعربية",
    descriptionEn: "الوصف بالإنجليزية",
    listingType: "نوع الإعلان",
    sale: "للبيع",
    rent: "للإيجار",
    next: "حفظ ومتابعة",
    required: "هذا الحقل مطلوب",
    titleMin: "يجب أن يكون العنوان 5 أحرف على الأقل",
    descMin: "يجب أن يكون الوصف 20 حرفاً على الأقل",
    categoryRequired: "يرجى اختيار نوع العقار",
  },
  en: {
    title: "Basic information",
    titleAr: "Arabic listing title",
    titleEn: "English title",
    descriptionAr: "Arabic property description",
    descriptionEn: "English description",
    listingType: "Listing type",
    sale: "For sale",
    rent: "For rent",
    next: "Save and continue",
    required: "This field is required",
    titleMin: "Title must be at least 5 characters",
    descMin: "Description must be at least 20 characters",
    categoryRequired: "Please select a property type",
  },
} as const;

export function StepBasicInfo({ data, isSaving, locale, onNext }: StepProps) {
  const copy = text[locale];
  const {
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BasicInfoValues>({
    defaultValues: {
      titleAr: data.titleAr,
      titleEn: data.titleEn ?? "",
      descriptionAr: data.descriptionAr,
      descriptionEn: data.descriptionEn ?? "",
      listingType: data.listingType,
      categoryId: data.categoryId,
      typeId: data.typeId,
    },
  });

  const handleCategoryChange = useCallback(
    (selection: { categoryId: string; typeId: string }) => {
      setValue("categoryId", selection.categoryId, { shouldValidate: true });
      setValue("typeId", selection.typeId, { shouldValidate: true });
    },
    [setValue],
  );

  return (
    <form
      className="grid gap-6"
      onSubmit={handleSubmit((values) => onNext(values))}
    >
      <div className="grid gap-2">
        <Label htmlFor="titleAr">{copy.titleAr}</Label>
        <Input
          id="titleAr"
          {...register("titleAr", {
            minLength: { message: copy.titleMin, value: 5 },
            required: { message: copy.required, value: true },
          })}
          aria-invalid={Boolean(errors.titleAr)}
        />
        {errors.titleAr ? (
          <p className="text-xs text-destructive">{errors.titleAr.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="titleEn">{copy.titleEn}</Label>
        <Input id="titleEn" {...register("titleEn")} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="descriptionAr">{copy.descriptionAr}</Label>
        <Textarea
          id="descriptionAr"
          rows={5}
          {...register("descriptionAr", {
            minLength: { message: copy.descMin, value: 20 },
            required: { message: copy.required, value: true },
          })}
          aria-invalid={Boolean(errors.descriptionAr)}
        />
        {errors.descriptionAr ? (
          <p className="text-xs text-destructive">
            {errors.descriptionAr.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="descriptionEn">{copy.descriptionEn}</Label>
        <Textarea id="descriptionEn" rows={4} {...register("descriptionEn")} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="listingType">{copy.listingType}</Label>
        <Select
          id="listingType"
          {...register("listingType", { required: true })}
        >
          <option value="SALE">{copy.sale}</option>
          <option value="RENT">{copy.rent}</option>
        </Select>
      </div>

      <CategoryTypeSelect
        categoryId={watch("categoryId")}
        onChange={handleCategoryChange}
        required
        typeId={watch("typeId")}
      />
      <input
        type="hidden"
        {...register("categoryId", {
          required: { message: copy.categoryRequired, value: true },
        })}
        aria-hidden="true"
      />
      <input
        type="hidden"
        {...register("typeId", {
          required: { message: copy.categoryRequired, value: true },
        })}
        aria-hidden="true"
      />

      <div className="flex justify-end">
        <Button disabled={isSaving} type="submit">
          {isSaving ? "..." : copy.next}
        </Button>
      </div>
    </form>
  );
}
