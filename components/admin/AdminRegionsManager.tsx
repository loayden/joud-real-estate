"use client";

import {
  Building2,
  CheckCircle2,
  Loader2,
  Map,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { type Locale, useRouter } from "@/i18n/routing";
import type {
  AdminCity,
  AdminGeography,
  AdminNeighborhood,
  AdminRegion,
} from "@/lib/admin-cms";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    regions: "المناطق",
    cities: "المدن",
    neighborhoods: "الأحياء",
    geography: "البيانات الجغرافية",
    active: "نشط",
    inactive: "غير نشط",
    properties: "عقار",
    citiesCount: "مدينة",
    neighborhoodsCount: "حي",
    selectRegion: "اختر منطقة لإدارة مدنها.",
    selectCity: "اختر مدينة لإدارة أحيائها.",
    addRegion: "إضافة منطقة",
    editRegion: "تعديل منطقة",
    addCity: "إضافة مدينة",
    editCity: "تعديل مدينة",
    addNeighborhood: "إضافة حي",
    editNeighborhood: "تعديل حي",
    nameAr: "الاسم العربي",
    nameEn: "الاسم الإنجليزي",
    slug: "الرابط المختصر",
    code: "الكود",
    sortOrder: "الترتيب",
    latitude: "خط العرض",
    longitude: "خط الطول",
    parentRegion: "المنطقة",
    parentCity: "المدينة",
    save: "حفظ",
    create: "إنشاء",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    enable: "تفعيل",
    disable: "تعطيل",
    saving: "جار الحفظ",
    emptyRegions: "لا توجد مناطق بعد.",
    emptyCities: "لا توجد مدن في هذه المنطقة.",
    emptyNeighborhoods: "لا توجد أحياء في هذه المدينة.",
    confirmDeleteRegion:
      "حذف المنطقة مسموح فقط إذا لم تكن مرتبطة بمدن أو عقارات. هل تريد المتابعة؟",
    confirmDeleteCity:
      "حذف المدينة مسموح فقط إذا لم تكن مرتبطة بأحياء أو عقارات. هل تريد المتابعة؟",
    confirmDeleteNeighborhood:
      "حذف الحي مسموح فقط إذا لم يكن مرتبطاً بعقارات. هل تريد المتابعة؟",
    saved: "تم حفظ التغييرات.",
    failed: "تعذر تنفيذ العملية.",
    requiredParent: "اختر العنصر الرئيسي أولاً.",
  },
  en: {
    regions: "Regions",
    cities: "Cities",
    neighborhoods: "Neighborhoods",
    geography: "Geographic data",
    active: "Active",
    inactive: "Inactive",
    properties: "properties",
    citiesCount: "cities",
    neighborhoodsCount: "neighborhoods",
    selectRegion: "Select a region to manage its cities.",
    selectCity: "Select a city to manage its neighborhoods.",
    addRegion: "Add region",
    editRegion: "Edit region",
    addCity: "Add city",
    editCity: "Edit city",
    addNeighborhood: "Add neighborhood",
    editNeighborhood: "Edit neighborhood",
    nameAr: "Arabic name",
    nameEn: "English name",
    slug: "Slug",
    code: "Code",
    sortOrder: "Sort order",
    latitude: "Latitude",
    longitude: "Longitude",
    parentRegion: "Region",
    parentCity: "City",
    save: "Save",
    create: "Create",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    enable: "Enable",
    disable: "Disable",
    saving: "Saving",
    emptyRegions: "No regions yet.",
    emptyCities: "No cities in this region.",
    emptyNeighborhoods: "No neighborhoods in this city.",
    confirmDeleteRegion:
      "Region deletion is allowed only when it has no cities or properties. Continue?",
    confirmDeleteCity:
      "City deletion is allowed only when it has no neighborhoods or properties. Continue?",
    confirmDeleteNeighborhood:
      "Neighborhood deletion is allowed only when it has no properties. Continue?",
    saved: "Changes saved.",
    failed: "Could not complete the operation.",
    requiredParent: "Select the parent item first.",
  },
} as const;

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

type RegionForm = {
  nameAr: string;
  nameEn: string;
  slug: string;
  code: string;
  sortOrder: string;
  isActive: boolean;
};

type CityForm = {
  regionId: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  latitude: string;
  longitude: string;
  sortOrder: string;
  isActive: boolean;
};

type NeighborhoodForm = {
  cityId: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  isActive: boolean;
};

const emptyRegionForm: RegionForm = {
  nameAr: "",
  nameEn: "",
  slug: "",
  code: "",
  sortOrder: "0",
  isActive: true,
};

function emptyCityForm(regionId = ""): CityForm {
  return {
    regionId,
    nameAr: "",
    nameEn: "",
    slug: "",
    latitude: "",
    longitude: "",
    sortOrder: "0",
    isActive: true,
  };
}

function emptyNeighborhoodForm(cityId = ""): NeighborhoodForm {
  return {
    cityId,
    nameAr: "",
    nameEn: "",
    slug: "",
    isActive: true,
  };
}

function localizedName(
  item: { nameAr: string; nameEn: string },
  locale: Locale,
) {
  return locale === "ar" ? item.nameAr : item.nameEn;
}

function regionToForm(region: AdminRegion): RegionForm {
  return {
    nameAr: region.nameAr,
    nameEn: region.nameEn,
    slug: region.slug,
    code: region.code ?? "",
    sortOrder: String(region.sortOrder),
    isActive: region.isActive,
  };
}

function cityToForm(city: AdminCity): CityForm {
  return {
    regionId: city.regionId,
    nameAr: city.nameAr,
    nameEn: city.nameEn,
    slug: city.slug,
    latitude: city.latitude === null ? "" : String(city.latitude),
    longitude: city.longitude === null ? "" : String(city.longitude),
    sortOrder: String(city.sortOrder),
    isActive: city.isActive,
  };
}

function neighborhoodToForm(neighborhood: AdminNeighborhood): NeighborhoodForm {
  return {
    cityId: neighborhood.cityId,
    nameAr: neighborhood.nameAr,
    nameEn: neighborhood.nameEn,
    slug: neighborhood.slug,
    isActive: neighborhood.isActive,
  };
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}

function regionPayload(form: RegionForm) {
  return {
    nameAr: form.nameAr,
    nameEn: form.nameEn,
    slug: form.slug,
    code: form.code.trim() || undefined,
    sortOrder: Number(form.sortOrder || 0),
    isActive: form.isActive,
  };
}

function cityPayload(form: CityForm) {
  return {
    regionId: form.regionId,
    nameAr: form.nameAr,
    nameEn: form.nameEn,
    slug: form.slug,
    latitude: optionalNumber(form.latitude),
    longitude: optionalNumber(form.longitude),
    sortOrder: Number(form.sortOrder || 0),
    isActive: form.isActive,
  };
}

function neighborhoodPayload(form: NeighborhoodForm) {
  return {
    cityId: form.cityId,
    nameAr: form.nameAr,
    nameEn: form.nameEn,
    slug: form.slug,
    isActive: form.isActive,
  };
}

async function parseApi<T>(response: Response) {
  const payload = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload && !payload.success ? payload.error : "Request failed",
    );
  }

  return payload.data;
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function StatusPill({ active, locale }: { active: boolean; locale: Locale }) {
  const text = copy[locale];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold",
        active
          ? "bg-green-50 text-green-700"
          : "bg-muted text-muted-foreground",
      )}
    >
      {active ? (
        <CheckCircle2 className="size-3" />
      ) : (
        <XCircle className="size-3" />
      )}
      {active ? text.active : text.inactive}
    </span>
  );
}

export function AdminRegionsManager({
  initialRegions,
  locale,
}: {
  initialRegions: AdminGeography;
  locale: Locale;
}) {
  const text = copy[locale];
  const router = useRouter();
  const [regions, setRegions] = useState(initialRegions);
  const [selectedRegionId, setSelectedRegionId] = useState(
    initialRegions[0]?.id ?? "",
  );
  const [selectedCityId, setSelectedCityId] = useState(
    initialRegions[0]?.cities[0]?.id ?? "",
  );
  const [regionForm, setRegionForm] = useState<RegionForm>(emptyRegionForm);
  const [cityForm, setCityForm] = useState<CityForm>(
    emptyCityForm(initialRegions[0]?.id),
  );
  const [neighborhoodForm, setNeighborhoodForm] = useState<NeighborhoodForm>(
    emptyNeighborhoodForm(initialRegions[0]?.cities[0]?.id),
  );
  const [editingRegionId, setEditingRegionId] = useState<string | null>(null);
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingNeighborhoodId, setEditingNeighborhoodId] = useState<
    string | null
  >(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRegions(initialRegions);
  }, [initialRegions]);

  const selectedRegion = useMemo(
    () =>
      regions.find((region) => region.id === selectedRegionId) ?? regions[0],
    [regions, selectedRegionId],
  );

  const selectedCity = useMemo(
    () =>
      selectedRegion?.cities.find((city) => city.id === selectedCityId) ??
      selectedRegion?.cities[0],
    [selectedCityId, selectedRegion],
  );

  useEffect(() => {
    if (!selectedRegion) {
      setSelectedRegionId("");
      setSelectedCityId("");
      return;
    }

    if (selectedRegion.id !== selectedRegionId) {
      setSelectedRegionId(selectedRegion.id);
    }

    if (!selectedRegion.cities.some((city) => city.id === selectedCityId)) {
      setSelectedCityId(selectedRegion.cities[0]?.id ?? "");
    }
  }, [selectedCityId, selectedRegion, selectedRegionId]);

  useEffect(() => {
    if (!editingCityId) {
      setCityForm((current) => ({
        ...current,
        regionId: selectedRegion?.id ?? "",
      }));
    }
  }, [editingCityId, selectedRegion?.id]);

  useEffect(() => {
    if (!editingNeighborhoodId) {
      setNeighborhoodForm((current) => ({
        ...current,
        cityId: selectedCity?.id ?? "",
      }));
    }
  }, [editingNeighborhoodId, selectedCity?.id]);

  async function mutate<T>(
    path: string,
    method: "POST" | "PUT" | "DELETE",
    body?: unknown,
  ) {
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const data = await parseApi<T>(
        await fetch(path, {
          body: body ? JSON.stringify(body) : undefined,
          headers: body ? { "Content-Type": "application/json" } : undefined,
          method,
        }),
      );
      setMessage(text.saved);
      router.refresh();
      return data;
    } catch (mutationError) {
      setError(
        mutationError instanceof Error ? mutationError.message : text.failed,
      );
      return null;
    } finally {
      setPending(false);
    }
  }

  async function submitRegion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = regionPayload(regionForm);
    const saved = await mutate(
      editingRegionId
        ? `/api/admin/regions/${editingRegionId}`
        : "/api/admin/regions",
      editingRegionId ? "PUT" : "POST",
      data,
    );

    if (saved) {
      setEditingRegionId(null);
      setRegionForm(emptyRegionForm);
    }
  }

  async function submitCity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cityForm.regionId) {
      setError(text.requiredParent);
      return;
    }

    const saved = await mutate(
      editingCityId
        ? `/api/admin/cities/${editingCityId}`
        : "/api/admin/cities",
      editingCityId ? "PUT" : "POST",
      cityPayload(cityForm),
    );

    if (saved) {
      setEditingCityId(null);
      setCityForm(emptyCityForm(selectedRegion?.id));
    }
  }

  async function submitNeighborhood(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!neighborhoodForm.cityId) {
      setError(text.requiredParent);
      return;
    }

    const saved = await mutate(
      editingNeighborhoodId
        ? `/api/admin/neighborhoods/${editingNeighborhoodId}`
        : "/api/admin/neighborhoods",
      editingNeighborhoodId ? "PUT" : "POST",
      neighborhoodPayload(neighborhoodForm),
    );

    if (saved) {
      setEditingNeighborhoodId(null);
      setNeighborhoodForm(emptyNeighborhoodForm(selectedCity?.id));
    }
  }

  function editRegion(region: AdminRegion) {
    setEditingRegionId(region.id);
    setRegionForm(regionToForm(region));
  }

  function editCity(city: AdminCity) {
    setEditingCityId(city.id);
    setCityForm(cityToForm(city));
  }

  function editNeighborhood(neighborhood: AdminNeighborhood) {
    setEditingNeighborhoodId(neighborhood.id);
    setNeighborhoodForm(neighborhoodToForm(neighborhood));
  }

  async function toggleRegion(region: AdminRegion) {
    await mutate(`/api/admin/regions/${region.id}`, "PUT", {
      ...regionPayload(regionToForm(region)),
      isActive: !region.isActive,
    });
  }

  async function toggleCity(city: AdminCity) {
    await mutate(`/api/admin/cities/${city.id}`, "PUT", {
      ...cityPayload(cityToForm(city)),
      isActive: !city.isActive,
    });
  }

  async function toggleNeighborhood(neighborhood: AdminNeighborhood) {
    await mutate(`/api/admin/neighborhoods/${neighborhood.id}`, "PUT", {
      ...neighborhoodPayload(neighborhoodToForm(neighborhood)),
      isActive: !neighborhood.isActive,
    });
  }

  async function deleteRegion(region: AdminRegion) {
    if (!window.confirm(text.confirmDeleteRegion)) return;
    await mutate(`/api/admin/regions/${region.id}`, "DELETE");
  }

  async function deleteCity(city: AdminCity) {
    if (!window.confirm(text.confirmDeleteCity)) return;
    await mutate(`/api/admin/cities/${city.id}`, "DELETE");
  }

  async function deleteNeighborhood(neighborhood: AdminNeighborhood) {
    if (!window.confirm(text.confirmDeleteNeighborhood)) return;
    await mutate(`/api/admin/neighborhoods/${neighborhood.id}`, "DELETE");
  }

  return (
    <div className="grid gap-4">
      {message ? <Alert>{message}</Alert> : null}
      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_1.05fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Map className="size-5 text-primary" />
              {text.regions}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid max-h-[420px] gap-2 overflow-y-auto pe-1">
              {regions.length > 0 ? (
                regions.map((region) => {
                  const selected = region.id === selectedRegion?.id;

                  return (
                    <div
                      className={cn(
                        "rounded-lg border p-3 transition-colors",
                        selected
                          ? "border-primary bg-primary-50"
                          : "border-border bg-background",
                      )}
                      key={region.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          className="min-w-0 flex-1 text-start"
                          onClick={() => {
                            setSelectedRegionId(region.id);
                            setSelectedCityId(region.cities[0]?.id ?? "");
                          }}
                          type="button"
                        >
                          <span className="block truncate font-bold">
                            {localizedName(region, locale)}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {region.slug}
                            {region.code ? ` · ${region.code}` : ""}
                          </span>
                        </button>
                        <StatusPill active={region.isActive} locale={locale} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>
                          {region.counts.cities} {text.citiesCount}
                        </span>
                        <span>
                          {region.counts.properties} {text.properties}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            disabled={pending}
                            onClick={() => editRegion(region)}
                            size="icon"
                            title={text.edit}
                            type="button"
                            variant="ghost"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            disabled={pending}
                            onClick={() => toggleRegion(region)}
                            size="icon"
                            title={region.isActive ? text.disable : text.enable}
                            type="button"
                            variant="ghost"
                          >
                            {region.isActive ? (
                              <XCircle className="size-4" />
                            ) : (
                              <CheckCircle2 className="size-4" />
                            )}
                          </Button>
                          <Button
                            className="text-red-700 hover:bg-red-50"
                            disabled={pending}
                            onClick={() => deleteRegion(region)}
                            size="icon"
                            title={text.delete}
                            type="button"
                            variant="ghost"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  {text.emptyRegions}
                </p>
              )}
            </div>

            <form className="grid gap-3 border-t pt-4" onSubmit={submitRegion}>
              <h3 className="flex items-center gap-2 font-bold">
                <Plus className="size-4 text-primary" />
                {editingRegionId ? text.editRegion : text.addRegion}
              </h3>
              <Field id="region-name-ar" label={text.nameAr}>
                <Input
                  id="region-name-ar"
                  required
                  value={regionForm.nameAr}
                  onChange={(event) =>
                    setRegionForm((current) => ({
                      ...current,
                      nameAr: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field id="region-name-en" label={text.nameEn}>
                <Input
                  id="region-name-en"
                  required
                  value={regionForm.nameEn}
                  onChange={(event) =>
                    setRegionForm((current) => ({
                      ...current,
                      nameEn: event.target.value,
                    }))
                  }
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field id="region-slug" label={text.slug}>
                  <Input
                    id="region-slug"
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    required
                    value={regionForm.slug}
                    onChange={(event) =>
                      setRegionForm((current) => ({
                        ...current,
                        slug: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field id="region-code" label={text.code}>
                  <Input
                    id="region-code"
                    value={regionForm.code}
                    onChange={(event) =>
                      setRegionForm((current) => ({
                        ...current,
                        code: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field id="region-sort" label={text.sortOrder}>
                  <Input
                    id="region-sort"
                    min={0}
                    type="number"
                    value={regionForm.sortOrder}
                    onChange={(event) =>
                      setRegionForm((current) => ({
                        ...current,
                        sortOrder: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <Checkbox
                  checked={regionForm.isActive}
                  onChange={(event) =>
                    setRegionForm((current) => ({
                      ...current,
                      isActive: event.currentTarget.checked,
                    }))
                  }
                />
                {text.active}
              </label>
              <div className="flex flex-wrap gap-2">
                <Button disabled={pending} type="submit">
                  {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                  {editingRegionId ? text.save : text.create}
                </Button>
                {editingRegionId ? (
                  <Button
                    disabled={pending}
                    onClick={() => {
                      setEditingRegionId(null);
                      setRegionForm(emptyRegionForm);
                    }}
                    type="button"
                    variant="secondary"
                  >
                    {text.cancel}
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building2 className="size-5 text-primary" />
              {text.cities}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {selectedRegion ? (
              <div className="grid max-h-[420px] gap-2 overflow-y-auto pe-1">
                {selectedRegion.cities.length > 0 ? (
                  selectedRegion.cities.map((city) => {
                    const selected = city.id === selectedCity?.id;

                    return (
                      <div
                        className={cn(
                          "rounded-lg border p-3 transition-colors",
                          selected
                            ? "border-primary bg-primary-50"
                            : "border-border bg-background",
                        )}
                        key={city.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            className="min-w-0 flex-1 text-start"
                            onClick={() => setSelectedCityId(city.id)}
                            type="button"
                          >
                            <span className="block truncate font-bold">
                              {localizedName(city, locale)}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {city.slug}
                            </span>
                          </button>
                          <StatusPill active={city.isActive} locale={locale} />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>
                            {city.counts.neighborhoods}{" "}
                            {text.neighborhoodsCount}
                          </span>
                          <span>
                            {city.counts.properties} {text.properties}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              disabled={pending}
                              onClick={() => editCity(city)}
                              size="icon"
                              title={text.edit}
                              type="button"
                              variant="ghost"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              disabled={pending}
                              onClick={() => toggleCity(city)}
                              size="icon"
                              title={city.isActive ? text.disable : text.enable}
                              type="button"
                              variant="ghost"
                            >
                              {city.isActive ? (
                                <XCircle className="size-4" />
                              ) : (
                                <CheckCircle2 className="size-4" />
                              )}
                            </Button>
                            <Button
                              className="text-red-700 hover:bg-red-50"
                              disabled={pending}
                              onClick={() => deleteCity(city)}
                              size="icon"
                              title={text.delete}
                              type="button"
                              variant="ghost"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    {text.emptyCities}
                  </p>
                )}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {text.selectRegion}
              </p>
            )}

            <form className="grid gap-3 border-t pt-4" onSubmit={submitCity}>
              <h3 className="flex items-center gap-2 font-bold">
                <Plus className="size-4 text-primary" />
                {editingCityId ? text.editCity : text.addCity}
              </h3>
              <Field id="city-region" label={text.parentRegion}>
                <Select
                  id="city-region"
                  required
                  value={cityForm.regionId}
                  onChange={(event) =>
                    setCityForm((current) => ({
                      ...current,
                      regionId: event.target.value,
                    }))
                  }
                >
                  <option value="">{text.selectRegion}</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {localizedName(region, locale)}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="city-name-ar" label={text.nameAr}>
                  <Input
                    id="city-name-ar"
                    required
                    value={cityForm.nameAr}
                    onChange={(event) =>
                      setCityForm((current) => ({
                        ...current,
                        nameAr: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field id="city-name-en" label={text.nameEn}>
                  <Input
                    id="city-name-en"
                    required
                    value={cityForm.nameEn}
                    onChange={(event) =>
                      setCityForm((current) => ({
                        ...current,
                        nameEn: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field id="city-slug" label={text.slug}>
                  <Input
                    id="city-slug"
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    required
                    value={cityForm.slug}
                    onChange={(event) =>
                      setCityForm((current) => ({
                        ...current,
                        slug: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field id="city-sort" label={text.sortOrder}>
                  <Input
                    id="city-sort"
                    min={0}
                    type="number"
                    value={cityForm.sortOrder}
                    onChange={(event) =>
                      setCityForm((current) => ({
                        ...current,
                        sortOrder: event.target.value,
                      }))
                    }
                  />
                </Field>
                <label className="flex items-end gap-2 pb-3 text-sm font-semibold">
                  <Checkbox
                    checked={cityForm.isActive}
                    onChange={(event) =>
                      setCityForm((current) => ({
                        ...current,
                        isActive: event.currentTarget.checked,
                      }))
                    }
                  />
                  {text.active}
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="city-latitude" label={text.latitude}>
                  <Input
                    id="city-latitude"
                    step="0.0000001"
                    type="number"
                    value={cityForm.latitude}
                    onChange={(event) =>
                      setCityForm((current) => ({
                        ...current,
                        latitude: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field id="city-longitude" label={text.longitude}>
                  <Input
                    id="city-longitude"
                    step="0.0000001"
                    type="number"
                    value={cityForm.longitude}
                    onChange={(event) =>
                      setCityForm((current) => ({
                        ...current,
                        longitude: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={pending} type="submit">
                  {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                  {editingCityId ? text.save : text.create}
                </Button>
                {editingCityId ? (
                  <Button
                    disabled={pending}
                    onClick={() => {
                      setEditingCityId(null);
                      setCityForm(emptyCityForm(selectedRegion?.id));
                    }}
                    type="button"
                    variant="secondary"
                  >
                    {text.cancel}
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MapPin className="size-5 text-primary" />
              {text.neighborhoods}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {selectedCity ? (
              <div className="grid max-h-[420px] gap-2 overflow-y-auto pe-1">
                {selectedCity.neighborhoods.length > 0 ? (
                  selectedCity.neighborhoods.map((neighborhood) => (
                    <div
                      className="rounded-lg border border-border bg-background p-3"
                      key={neighborhood.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="block truncate font-bold">
                            {localizedName(neighborhood, locale)}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {neighborhood.slug}
                          </span>
                        </div>
                        <StatusPill
                          active={neighborhood.isActive}
                          locale={locale}
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>
                          {neighborhood.counts.properties} {text.properties}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            disabled={pending}
                            onClick={() => editNeighborhood(neighborhood)}
                            size="icon"
                            title={text.edit}
                            type="button"
                            variant="ghost"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            disabled={pending}
                            onClick={() => toggleNeighborhood(neighborhood)}
                            size="icon"
                            title={
                              neighborhood.isActive ? text.disable : text.enable
                            }
                            type="button"
                            variant="ghost"
                          >
                            {neighborhood.isActive ? (
                              <XCircle className="size-4" />
                            ) : (
                              <CheckCircle2 className="size-4" />
                            )}
                          </Button>
                          <Button
                            className="text-red-700 hover:bg-red-50"
                            disabled={pending}
                            onClick={() => deleteNeighborhood(neighborhood)}
                            size="icon"
                            title={text.delete}
                            type="button"
                            variant="ghost"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    {text.emptyNeighborhoods}
                  </p>
                )}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {text.selectCity}
              </p>
            )}

            <form
              className="grid gap-3 border-t pt-4"
              onSubmit={submitNeighborhood}
            >
              <h3 className="flex items-center gap-2 font-bold">
                <Plus className="size-4 text-primary" />
                {editingNeighborhoodId
                  ? text.editNeighborhood
                  : text.addNeighborhood}
              </h3>
              <Field id="neighborhood-city" label={text.parentCity}>
                <Select
                  id="neighborhood-city"
                  required
                  value={neighborhoodForm.cityId}
                  onChange={(event) =>
                    setNeighborhoodForm((current) => ({
                      ...current,
                      cityId: event.target.value,
                    }))
                  }
                >
                  <option value="">{text.selectCity}</option>
                  {regions.flatMap((region) =>
                    region.cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {localizedName(city, locale)} ·{" "}
                        {localizedName(region, locale)}
                      </option>
                    )),
                  )}
                </Select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="neighborhood-name-ar" label={text.nameAr}>
                  <Input
                    id="neighborhood-name-ar"
                    required
                    value={neighborhoodForm.nameAr}
                    onChange={(event) =>
                      setNeighborhoodForm((current) => ({
                        ...current,
                        nameAr: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field id="neighborhood-name-en" label={text.nameEn}>
                  <Input
                    id="neighborhood-name-en"
                    required
                    value={neighborhoodForm.nameEn}
                    onChange={(event) =>
                      setNeighborhoodForm((current) => ({
                        ...current,
                        nameEn: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <Field id="neighborhood-slug" label={text.slug}>
                  <Input
                    id="neighborhood-slug"
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    required
                    value={neighborhoodForm.slug}
                    onChange={(event) =>
                      setNeighborhoodForm((current) => ({
                        ...current,
                        slug: event.target.value,
                      }))
                    }
                  />
                </Field>
                <label className="flex items-end gap-2 pb-3 text-sm font-semibold">
                  <Checkbox
                    checked={neighborhoodForm.isActive}
                    onChange={(event) =>
                      setNeighborhoodForm((current) => ({
                        ...current,
                        isActive: event.currentTarget.checked,
                      }))
                    }
                  />
                  {text.active}
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={pending} type="submit">
                  {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                  {editingNeighborhoodId ? text.save : text.create}
                </Button>
                {editingNeighborhoodId ? (
                  <Button
                    disabled={pending}
                    onClick={() => {
                      setEditingNeighborhoodId(null);
                      setNeighborhoodForm(
                        emptyNeighborhoodForm(selectedCity?.id),
                      );
                    }}
                    type="button"
                    variant="secondary"
                  >
                    {text.cancel}
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
