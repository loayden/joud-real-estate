"use client";

import { SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { usePathname, useRouter, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import type { SearchFilterLookups } from "./types";

const copy = {
  ar: {
    title: "الفلاتر",
    listingType: "نوع الإعلان",
    all: "الكل",
    sale: "للبيع",
    rent: "للإيجار",
    price: "السعر",
    minPrice: "أقل سعر",
    maxPrice: "أعلى سعر",
    area: "المساحة",
    minArea: "أقل مساحة",
    maxArea: "أعلى مساحة",
    bedrooms: "غرف النوم",
    bathrooms: "دورات المياه",
    category: "تصنيف العقار",
    type: "نوع العقار",
    region: "المنطقة",
    city: "المدينة",
    selectCategory: "اختر التصنيف",
    selectType: "اختر النوع",
    selectRegion: "اختر المنطقة",
    selectCity: "اختر المدينة",
    any: "أي",
    apply: "تطبيق الفلتر",
    clear: "مسح الكل",
  },
  en: {
    title: "Filters",
    listingType: "Listing type",
    all: "All",
    sale: "For sale",
    rent: "For rent",
    price: "Price",
    minPrice: "Min price",
    maxPrice: "Max price",
    area: "Area",
    minArea: "Min area",
    maxArea: "Max area",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    category: "Property category",
    type: "Property type",
    region: "Region",
    city: "City",
    selectCategory: "Select category",
    selectType: "Select type",
    selectRegion: "Select region",
    selectCity: "Select city",
    any: "Any",
    apply: "Apply filters",
    clear: "Clear all",
  },
} as const;

const filterKeys = [
  "listingType",
  "regionId",
  "region",
  "regionSlug",
  "cityId",
  "city",
  "citySlug",
  "categoryId",
  "typeId",
  "minPrice",
  "maxPrice",
  "minArea",
  "maxArea",
  "bedrooms",
  "bathrooms",
];

function getInitialId(
  value: string | null,
  options: Array<{ id: string; slug?: string }>,
) {
  if (!value) return "";
  return (
    options.find((option) => option.id === value || option.slug === value)
      ?.id ?? ""
  );
}

function getNumberParam(params: URLSearchParams, key: string) {
  return params.get(key) ?? "";
}

function localize(item: { nameAr: string; nameEn: string }, locale: Locale) {
  return locale === "ar" ? item.nameAr : item.nameEn;
}

function NumberField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="numeric"
        min={0}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0"
        type="number"
        value={value}
      />
    </div>
  );
}

function SegmentedButtons({
  label,
  options,
  value,
  onChange,
  columns = 5,
}: {
  label: string;
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
  columns?: 3 | 5;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div
        className={cn(
          "grid gap-2",
          columns === 3 ? "grid-cols-3" : "grid-cols-5",
        )}
        role="group"
        aria-label={label}
      >
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              aria-pressed={selected}
              className={cn(
                "tnum min-h-11 rounded-xl border border-border bg-background px-1 text-sm font-bold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected &&
                  "border-primary bg-primary text-primary-foreground hover:bg-primary-700",
              )}
              key={option.value || "any"}
              onClick={() => onChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FilterSidebar({
  locale,
  lookups,
  className,
  onApplied,
}: {
  locale: Locale;
  lookups: SearchFilterLookups;
  className?: string;
  onApplied?: () => void;
}) {
  const text = copy[locale];
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const cities = useMemo(
    () => lookups.regions.flatMap((region) => region.cities),
    [lookups.regions],
  );
  const types = useMemo(
    () => lookups.categories.flatMap((category) => category.types),
    [lookups.categories],
  );
  const [listingType, setListingType] = useState(
    () => searchParams.get("listingType") ?? "",
  );
  const [regionId, setRegionId] = useState(() =>
    getInitialId(
      searchParams.get("regionId") ??
        searchParams.get("region") ??
        searchParams.get("regionSlug"),
      lookups.regions,
    ),
  );
  const [cityId, setCityId] = useState(() =>
    getInitialId(
      searchParams.get("cityId") ??
        searchParams.get("city") ??
        searchParams.get("citySlug"),
      cities,
    ),
  );
  const [categoryId, setCategoryId] = useState(() =>
    getInitialId(searchParams.get("categoryId"), lookups.categories),
  );
  const [typeId, setTypeId] = useState(() =>
    getInitialId(searchParams.get("typeId"), types),
  );
  const [minPrice, setMinPrice] = useState(() =>
    getNumberParam(searchParams, "minPrice"),
  );
  const [maxPrice, setMaxPrice] = useState(() =>
    getNumberParam(searchParams, "maxPrice"),
  );
  const [minArea, setMinArea] = useState(() =>
    getNumberParam(searchParams, "minArea"),
  );
  const [maxArea, setMaxArea] = useState(() =>
    getNumberParam(searchParams, "maxArea"),
  );
  const [bedrooms, setBedrooms] = useState(() =>
    getNumberParam(searchParams, "bedrooms"),
  );
  const [bathrooms, setBathrooms] = useState(() =>
    getNumberParam(searchParams, "bathrooms"),
  );
  const selectedCategory = useMemo(
    () => lookups.categories.find((category) => category.id === categoryId),
    [categoryId, lookups.categories],
  );
  const availableTypes = selectedCategory?.types ?? [];
  const selectedRegion = useMemo(
    () => lookups.regions.find((region) => region.id === regionId),
    [lookups.regions, regionId],
  );
  const availableCities = selectedRegion?.cities ?? [];

  useEffect(() => {
    setListingType(searchParams.get("listingType") ?? "");
    setRegionId(
      getInitialId(
        searchParams.get("regionId") ??
          searchParams.get("region") ??
          searchParams.get("regionSlug"),
        lookups.regions,
      ),
    );
    setCityId(
      getInitialId(
        searchParams.get("cityId") ??
          searchParams.get("city") ??
          searchParams.get("citySlug"),
        cities,
      ),
    );
    setCategoryId(
      getInitialId(searchParams.get("categoryId"), lookups.categories),
    );
    setTypeId(getInitialId(searchParams.get("typeId"), types));
    setMinPrice(getNumberParam(searchParams, "minPrice"));
    setMaxPrice(getNumberParam(searchParams, "maxPrice"));
    setMinArea(getNumberParam(searchParams, "minArea"));
    setMaxArea(getNumberParam(searchParams, "maxArea"));
    setBedrooms(getNumberParam(searchParams, "bedrooms"));
    setBathrooms(getNumberParam(searchParams, "bathrooms"));
  }, [cities, lookups.categories, lookups.regions, searchParams, types]);

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());
    filterKeys.forEach((key) => params.delete(key));
    params.delete("page");

    if (listingType === "SALE" || listingType === "RENT") {
      params.set("listingType", listingType);
    }
    if (regionId) params.set("regionId", regionId);
    if (cityId) params.set("cityId", cityId);
    if (categoryId) params.set("categoryId", categoryId);
    if (typeId) params.set("typeId", typeId);
    if (minPrice.trim()) params.set("minPrice", minPrice.trim());
    if (maxPrice.trim()) params.set("maxPrice", maxPrice.trim());
    if (minArea.trim()) params.set("minArea", minArea.trim());
    if (maxArea.trim()) params.set("maxArea", maxArea.trim());
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (bathrooms) params.set("bathrooms", bathrooms);

    const query = params.toString();

    startTransition(() => {
      router.push((query ? `${pathname}?${query}` : pathname) as never);
      onApplied?.();
    });
  }

  function clearFilters() {
    startTransition(() => {
      router.push(pathname as never);
      onApplied?.();
    });
  }

  const countOptions = [
    { label: text.any, value: "" },
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "4+", value: "4" },
  ];

  return (
    <div
      className={cn(
        "grid content-start gap-6 rounded-2xl border border-border bg-background p-5 shadow-xs",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-lg font-bold">
          <SlidersHorizontal className="size-5 text-primary" />
          {text.title}
        </h2>
        <button
          className="min-h-9 rounded-lg px-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={isPending}
          onClick={clearFilters}
          type="button"
        >
          {text.clear}
        </button>
      </div>

      <SegmentedButtons
        label={text.listingType}
        columns={3}
        onChange={setListingType}
        options={[
          { label: text.all, value: "" },
          { label: text.sale, value: "SALE" },
          { label: text.rent, value: "RENT" },
        ]}
        value={listingType}
      />

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="search-category">{text.category}</Label>
          <Select
            id="search-category"
            onChange={(event) => {
              setCategoryId(event.target.value);
              setTypeId("");
            }}
            value={categoryId}
          >
            <option value="">{text.selectCategory}</option>
            {lookups.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {localize(category, locale)}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="search-type">{text.type}</Label>
          <Select
            disabled={!categoryId}
            id="search-type"
            onChange={(event) => setTypeId(event.target.value)}
            value={typeId}
          >
            <option value="">{text.selectType}</option>
            {availableTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {localize(type, locale)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="search-region">{text.region}</Label>
          <Select
            id="search-region"
            onChange={(event) => {
              setRegionId(event.target.value);
              setCityId("");
            }}
            value={regionId}
          >
            <option value="">{text.selectRegion}</option>
            {lookups.regions.map((region) => (
              <option key={region.id} value={region.id}>
                {localize(region, locale)}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="search-city">{text.city}</Label>
          <Select
            disabled={!regionId}
            id="search-city"
            onChange={(event) => setCityId(event.target.value)}
            value={cityId}
          >
            <option value="">{text.selectCity}</option>
            {availableCities.map((city) => (
              <option key={city.id} value={city.id}>
                {localize(city, locale)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-3">
        <Label>{text.price}</Label>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            id="min-price"
            label={text.minPrice}
            onChange={setMinPrice}
            value={minPrice}
          />
          <NumberField
            id="max-price"
            label={text.maxPrice}
            onChange={setMaxPrice}
            value={maxPrice}
          />
        </div>
      </div>

      <div className="grid gap-3">
        <Label>{text.area}</Label>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            id="min-area"
            label={text.minArea}
            onChange={setMinArea}
            value={minArea}
          />
          <NumberField
            id="max-area"
            label={text.maxArea}
            onChange={setMaxArea}
            value={maxArea}
          />
        </div>
      </div>

      <SegmentedButtons
        label={text.bedrooms}
        onChange={setBedrooms}
        options={countOptions}
        value={bedrooms}
      />
      <SegmentedButtons
        label={text.bathrooms}
        onChange={setBathrooms}
        options={countOptions}
        value={bathrooms}
      />

      <div className="sticky bottom-0 -mx-5 -mb-5 border-t border-border bg-background/95 p-5 backdrop-blur-sm">
        <Button
          className="h-12 w-full rounded-xl"
          disabled={isPending}
          onClick={applyFilters}
        >
          {text.apply}
        </Button>
      </div>
    </div>
  );
}
