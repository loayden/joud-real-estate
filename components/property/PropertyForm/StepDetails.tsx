"use client";

import { useForm } from "react-hook-form";

import type {
  PropertyFormData,
  StepProps,
} from "@/components/property/PropertyForm/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DetailsValues = Pick<
  PropertyFormData,
  | "price"
  | "priceNegotiable"
  | "area"
  | "bedrooms"
  | "bathrooms"
  | "floors"
  | "parkingSpaces"
  | "yearBuilt"
  | "streetWidth"
>;

const text = {
  ar: {
    price: "السعر",
    negotiable: "السعر قابل للتفاوض",
    area: "المساحة",
    bedrooms: "غرف النوم",
    bathrooms: "دورات المياه",
    floors: "عدد الأدوار",
    parking: "مواقف السيارات",
    yearBuilt: "سنة البناء",
    streetWidth: "عرض الشارع",
    back: "السابق",
    next: "حفظ ومتابعة",
    required: "هذا الحقل مطلوب",
    minPrice: "السعر يجب أن يكون 1 على الأقل",
    minArea: "المساحة يجب أن تكون 1 م² على الأقل",
  },
  en: {
    price: "Price",
    negotiable: "Price is negotiable",
    area: "Area",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    floors: "Floors",
    parking: "Parking spaces",
    yearBuilt: "Year built",
    streetWidth: "Street width",
    back: "Back",
    next: "Save and continue",
    required: "This field is required",
    minPrice: "Price must be at least 1",
    minArea: "Area must be at least 1 sqm",
  },
} as const;

const numberValue = (value: unknown) =>
  value === "" ? undefined : Number(value);

export function StepDetails({
  data,
  isSaving,
  locale,
  onBack,
  onNext,
}: StepProps) {
  const copy = text[locale];
  const {
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DetailsValues>({
    defaultValues: {
      price: data.price,
      priceNegotiable: data.priceNegotiable,
      area: data.area,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      floors: data.floors,
      parkingSpaces: data.parkingSpaces,
      yearBuilt: data.yearBuilt,
      streetWidth: data.streetWidth,
    },
  });

  return (
    <form
      className="grid gap-6"
      onSubmit={handleSubmit((values) =>
        onNext({ ...values, areaUnit: "sqm" }),
      )}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="price">{copy.price}</Label>
          <Input
            id="price"
            inputMode="decimal"
            min={1}
            type="number"
            {...register("price", {
              min: { message: copy.minPrice, value: 1 },
              required: { message: copy.required, value: true },
              setValueAs: numberValue,
            })}
            aria-invalid={Boolean(errors.price)}
          />
          {errors.price ? (
            <p className="text-xs text-destructive">{errors.price.message}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="area">{copy.area}</Label>
          <Input
            id="area"
            inputMode="decimal"
            min={1}
            type="number"
            {...register("area", {
              min: { message: copy.minArea, value: 1 },
              required: { message: copy.required, value: true },
              setValueAs: numberValue,
            })}
            aria-invalid={Boolean(errors.area)}
          />
          {errors.area ? (
            <p className="text-xs text-destructive">{errors.area.message}</p>
          ) : null}
        </div>
      </div>

      <Label className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 py-2 text-sm font-semibold">
        <Checkbox
          checked={Boolean(watch("priceNegotiable"))}
          onChange={(event) =>
            setValue("priceNegotiable", event.currentTarget.checked)
          }
        />
        {copy.negotiable}
      </Label>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["bedrooms", copy.bedrooms, 0, 50],
          ["bathrooms", copy.bathrooms, 0, 30],
          ["floors", copy.floors, 1, 50],
          ["parkingSpaces", copy.parking, 0, 20],
          ["yearBuilt", copy.yearBuilt, 1900, new Date().getFullYear() + 1],
          ["streetWidth", copy.streetWidth, 1, 100],
        ].map(([name, label, min, max]) => (
          <div className="grid gap-2" key={name}>
            <Label htmlFor={String(name)}>{label}</Label>
            <Input
              id={String(name)}
              inputMode="decimal"
              max={Number(max)}
              min={Number(min)}
              type="number"
              {...register(name as keyof DetailsValues, {
                max: Number(max),
                min: Number(min),
                setValueAs: numberValue,
              })}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button
          disabled={isSaving}
          onClick={onBack}
          type="button"
          variant="secondary"
        >
          {copy.back}
        </Button>
        <Button disabled={isSaving} type="submit">
          {isSaving ? "..." : copy.next}
        </Button>
      </div>
    </form>
  );
}
