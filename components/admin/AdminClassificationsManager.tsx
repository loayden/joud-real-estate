"use client";

import {
  CheckCircle2,
  Layers3,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Tag,
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
  AdminAmenity,
  AdminCategory,
  AdminClassifications,
  AdminPropertyType,
} from "@/lib/admin-cms";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    categories: "الفئات",
    types: "الأنواع",
    amenities: "المرافق",
    active: "نشط",
    inactive: "غير نشط",
    properties: "عقار",
    typeCount: "نوع",
    addCategory: "إضافة فئة",
    editCategory: "تعديل فئة",
    addType: "إضافة نوع",
    editType: "تعديل نوع",
    addAmenity: "إضافة مرفق",
    editAmenity: "تعديل مرفق",
    nameAr: "الاسم العربي",
    nameEn: "الاسم الإنجليزي",
    slug: "الرابط المختصر",
    iconName: "اسم الأيقونة",
    imageUrl: "رابط الصورة",
    sortOrder: "الترتيب",
    parentCategory: "الفئة",
    group: "المجموعة",
    allGroups: "كل المجموعات",
    noGroup: "بدون مجموعة",
    indoor: "داخل المبنى",
    outdoor: "خارج المبنى",
    location: "الموقع",
    utilities: "المرافق",
    luxury: "الرفاهية",
    selectCategory: "اختر فئة لإدارة أنواعها.",
    save: "حفظ",
    create: "إنشاء",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    enable: "تفعيل",
    disable: "تعطيل",
    emptyCategories: "لا توجد فئات بعد.",
    emptyTypes: "لا توجد أنواع في هذه الفئة.",
    emptyAmenities: "لا توجد مرافق مطابقة.",
    confirmDeleteCategory:
      "حذف الفئة مسموح فقط إذا لم تكن مرتبطة بأنواع أو عقارات. هل تريد المتابعة؟",
    confirmDeleteType:
      "حذف النوع مسموح فقط إذا لم يكن مرتبطاً بعقارات. هل تريد المتابعة؟",
    confirmDeleteAmenity:
      "حذف المرفق مسموح فقط إذا لم يكن مرتبطاً بعقارات. هل تريد المتابعة؟",
    saved: "تم حفظ التغييرات.",
    failed: "تعذر تنفيذ العملية.",
    requiredParent: "اختر الفئة أولاً.",
  },
  en: {
    categories: "Categories",
    types: "Types",
    amenities: "Amenities",
    active: "Active",
    inactive: "Inactive",
    properties: "properties",
    typeCount: "types",
    addCategory: "Add category",
    editCategory: "Edit category",
    addType: "Add type",
    editType: "Edit type",
    addAmenity: "Add amenity",
    editAmenity: "Edit amenity",
    nameAr: "Arabic name",
    nameEn: "English name",
    slug: "Slug",
    iconName: "Icon name",
    imageUrl: "Image URL",
    sortOrder: "Sort order",
    parentCategory: "Category",
    group: "Group",
    allGroups: "All groups",
    noGroup: "No group",
    indoor: "Indoor",
    outdoor: "Outdoor",
    location: "Location",
    utilities: "Utilities",
    luxury: "Luxury",
    selectCategory: "Select a category to manage its types.",
    save: "Save",
    create: "Create",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    enable: "Enable",
    disable: "Disable",
    emptyCategories: "No categories yet.",
    emptyTypes: "No types in this category.",
    emptyAmenities: "No matching amenities.",
    confirmDeleteCategory:
      "Category deletion is allowed only when it has no types or properties. Continue?",
    confirmDeleteType:
      "Type deletion is allowed only when it has no properties. Continue?",
    confirmDeleteAmenity:
      "Amenity deletion is allowed only when it has no properties. Continue?",
    saved: "Changes saved.",
    failed: "Could not complete the operation.",
    requiredParent: "Select a category first.",
  },
} as const;

const knownAmenityGroups = [
  "indoor",
  "outdoor",
  "location",
  "utilities",
  "luxury",
] as const;

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

type CategoryForm = {
  nameAr: string;
  nameEn: string;
  slug: string;
  iconName: string;
  imageUrl: string;
  sortOrder: string;
  isActive: boolean;
};

type TypeForm = {
  categoryId: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  sortOrder: string;
  isActive: boolean;
};

type AmenityForm = {
  nameAr: string;
  nameEn: string;
  iconName: string;
  category: string;
  sortOrder: string;
};

const emptyCategoryForm: CategoryForm = {
  nameAr: "",
  nameEn: "",
  slug: "",
  iconName: "",
  imageUrl: "",
  sortOrder: "0",
  isActive: true,
};

function emptyTypeForm(categoryId = ""): TypeForm {
  return {
    categoryId,
    nameAr: "",
    nameEn: "",
    slug: "",
    sortOrder: "0",
    isActive: true,
  };
}

const emptyAmenityForm: AmenityForm = {
  nameAr: "",
  nameEn: "",
  iconName: "",
  category: "indoor",
  sortOrder: "0",
};

function localizedName(
  item: { nameAr: string; nameEn: string },
  locale: Locale,
) {
  return locale === "ar" ? item.nameAr : item.nameEn;
}

function groupLabel(value: string | null, locale: Locale) {
  const text = copy[locale];

  if (!value) return text.noGroup;
  if (value in text) return text[value as keyof typeof text];

  return value;
}

function categoryToForm(category: AdminCategory): CategoryForm {
  return {
    nameAr: category.nameAr,
    nameEn: category.nameEn,
    slug: category.slug,
    iconName: category.iconName ?? "",
    imageUrl: category.imageUrl ?? "",
    sortOrder: String(category.sortOrder),
    isActive: category.isActive,
  };
}

function typeToForm(type: AdminPropertyType): TypeForm {
  return {
    categoryId: type.categoryId,
    nameAr: type.nameAr,
    nameEn: type.nameEn,
    slug: type.slug,
    sortOrder: String(type.sortOrder),
    isActive: type.isActive,
  };
}

function amenityToForm(amenity: AdminAmenity): AmenityForm {
  return {
    nameAr: amenity.nameAr,
    nameEn: amenity.nameEn,
    iconName: amenity.iconName ?? "",
    category: amenity.category ?? "",
    sortOrder: String(amenity.sortOrder),
  };
}

function categoryPayload(form: CategoryForm) {
  return {
    nameAr: form.nameAr,
    nameEn: form.nameEn,
    slug: form.slug,
    iconName: form.iconName.trim() || undefined,
    imageUrl: form.imageUrl.trim() || undefined,
    sortOrder: Number(form.sortOrder || 0),
    isActive: form.isActive,
  };
}

function typePayload(form: TypeForm) {
  return {
    categoryId: form.categoryId,
    nameAr: form.nameAr,
    nameEn: form.nameEn,
    slug: form.slug,
    sortOrder: Number(form.sortOrder || 0),
    isActive: form.isActive,
  };
}

function amenityPayload(form: AmenityForm) {
  return {
    nameAr: form.nameAr,
    nameEn: form.nameEn,
    iconName: form.iconName.trim() || undefined,
    category: form.category.trim() || undefined,
    sortOrder: Number(form.sortOrder || 0),
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

export function AdminClassificationsManager({
  initialData,
  locale,
}: {
  initialData: AdminClassifications;
  locale: Locale;
}) {
  const text = copy[locale];
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialData.categories[0]?.id ?? "",
  );
  const [categoryForm, setCategoryForm] =
    useState<CategoryForm>(emptyCategoryForm);
  const [typeForm, setTypeForm] = useState<TypeForm>(
    emptyTypeForm(initialData.categories[0]?.id),
  );
  const [amenityForm, setAmenityForm] = useState<AmenityForm>(emptyAmenityForm);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingAmenityId, setEditingAmenityId] = useState<string | null>(null);
  const [amenityGroup, setAmenityGroup] = useState("all");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const selectedCategory = useMemo(
    () =>
      data.categories.find((category) => category.id === selectedCategoryId) ??
      data.categories[0],
    [data.categories, selectedCategoryId],
  );

  useEffect(() => {
    if (!selectedCategory) {
      setSelectedCategoryId("");
      return;
    }

    if (selectedCategory.id !== selectedCategoryId) {
      setSelectedCategoryId(selectedCategory.id);
    }
  }, [selectedCategory, selectedCategoryId]);

  useEffect(() => {
    if (!editingTypeId) {
      setTypeForm((current) => ({
        ...current,
        categoryId: selectedCategory?.id ?? "",
      }));
    }
  }, [editingTypeId, selectedCategory?.id]);

  const amenityGroups = useMemo(() => {
    const groups = new Set<string>(knownAmenityGroups);
    for (const amenity of data.amenities) {
      if (amenity.category) groups.add(amenity.category);
    }
    return Array.from(groups);
  }, [data.amenities]);

  const filteredAmenities = useMemo(
    () =>
      amenityGroup === "all"
        ? data.amenities
        : data.amenities.filter(
            (amenity) => (amenity.category ?? "") === amenityGroup,
          ),
    [amenityGroup, data.amenities],
  );

  async function mutate<T>(
    path: string,
    method: "POST" | "PUT" | "DELETE",
    body?: unknown,
  ) {
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const result = await parseApi<T>(
        await fetch(path, {
          body: body ? JSON.stringify(body) : undefined,
          headers: body ? { "Content-Type": "application/json" } : undefined,
          method,
        }),
      );
      setMessage(text.saved);
      router.refresh();
      return result;
    } catch (mutationError) {
      setError(
        mutationError instanceof Error ? mutationError.message : text.failed,
      );
      return null;
    } finally {
      setPending(false);
    }
  }

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await mutate(
      editingCategoryId
        ? `/api/admin/categories/${editingCategoryId}`
        : "/api/admin/categories",
      editingCategoryId ? "PUT" : "POST",
      categoryPayload(categoryForm),
    );

    if (saved) {
      setEditingCategoryId(null);
      setCategoryForm(emptyCategoryForm);
    }
  }

  async function submitType(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!typeForm.categoryId) {
      setError(text.requiredParent);
      return;
    }

    const saved = await mutate(
      editingTypeId ? `/api/admin/types/${editingTypeId}` : "/api/admin/types",
      editingTypeId ? "PUT" : "POST",
      typePayload(typeForm),
    );

    if (saved) {
      setEditingTypeId(null);
      setTypeForm(emptyTypeForm(selectedCategory?.id));
    }
  }

  async function submitAmenity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await mutate(
      editingAmenityId
        ? `/api/admin/amenities/${editingAmenityId}`
        : "/api/admin/amenities",
      editingAmenityId ? "PUT" : "POST",
      amenityPayload(amenityForm),
    );

    if (saved) {
      setEditingAmenityId(null);
      setAmenityForm(emptyAmenityForm);
    }
  }

  function editCategory(category: AdminCategory) {
    setEditingCategoryId(category.id);
    setCategoryForm(categoryToForm(category));
  }

  function editType(type: AdminPropertyType) {
    setEditingTypeId(type.id);
    setTypeForm(typeToForm(type));
  }

  function editAmenity(amenity: AdminAmenity) {
    setEditingAmenityId(amenity.id);
    setAmenityForm(amenityToForm(amenity));
  }

  async function toggleCategory(category: AdminCategory) {
    await mutate(`/api/admin/categories/${category.id}`, "PUT", {
      ...categoryPayload(categoryToForm(category)),
      isActive: !category.isActive,
    });
  }

  async function toggleType(type: AdminPropertyType) {
    await mutate(`/api/admin/types/${type.id}`, "PUT", {
      ...typePayload(typeToForm(type)),
      isActive: !type.isActive,
    });
  }

  async function deleteCategory(category: AdminCategory) {
    if (!window.confirm(text.confirmDeleteCategory)) return;
    await mutate(`/api/admin/categories/${category.id}`, "DELETE");
  }

  async function deleteType(type: AdminPropertyType) {
    if (!window.confirm(text.confirmDeleteType)) return;
    await mutate(`/api/admin/types/${type.id}`, "DELETE");
  }

  async function deleteAmenity(amenity: AdminAmenity) {
    if (!window.confirm(text.confirmDeleteAmenity)) return;
    await mutate(`/api/admin/amenities/${amenity.id}`, "DELETE");
  }

  return (
    <div className="grid gap-4">
      {message ? <Alert>{message}</Alert> : null}
      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Layers3 className="size-5 text-primary" />
              {text.categories}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="grid max-h-[520px] gap-2 overflow-y-auto pe-1">
                {data.categories.length > 0 ? (
                  data.categories.map((category) => {
                    const selected = category.id === selectedCategory?.id;

                    return (
                      <div
                        className={cn(
                          "rounded-lg border p-3 transition-colors",
                          selected
                            ? "border-primary bg-primary-50"
                            : "border-border bg-background",
                        )}
                        key={category.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            className="min-w-0 flex-1 text-start"
                            onClick={() => setSelectedCategoryId(category.id)}
                            type="button"
                          >
                            <span className="block truncate font-bold">
                              {localizedName(category, locale)}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {category.slug}
                            </span>
                          </button>
                          <StatusPill
                            active={category.isActive}
                            locale={locale}
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>
                            {category.counts.types} {text.typeCount}
                          </span>
                          <span>
                            {category.counts.properties} {text.properties}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              disabled={pending}
                              onClick={() => editCategory(category)}
                              size="icon"
                              title={text.edit}
                              type="button"
                              variant="ghost"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              disabled={pending}
                              onClick={() => toggleCategory(category)}
                              size="icon"
                              title={
                                category.isActive ? text.disable : text.enable
                              }
                              type="button"
                              variant="ghost"
                            >
                              {category.isActive ? (
                                <XCircle className="size-4" />
                              ) : (
                                <CheckCircle2 className="size-4" />
                              )}
                            </Button>
                            <Button
                              className="text-red-700 hover:bg-red-50"
                              disabled={pending}
                              onClick={() => deleteCategory(category)}
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
                    {text.emptyCategories}
                  </p>
                )}
              </div>

              <div className="grid content-start gap-2">
                <h3 className="flex items-center gap-2 font-bold">
                  <Tag className="size-4 text-primary" />
                  {text.types}
                </h3>
                {selectedCategory ? (
                  selectedCategory.types.length > 0 ? (
                    selectedCategory.types.map((type) => (
                      <div
                        className="rounded-lg border border-border bg-background p-3"
                        key={type.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="block truncate font-bold">
                              {localizedName(type, locale)}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {type.slug}
                            </span>
                          </div>
                          <StatusPill active={type.isActive} locale={locale} />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>
                            {type.counts.properties} {text.properties}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              disabled={pending}
                              onClick={() => editType(type)}
                              size="icon"
                              title={text.edit}
                              type="button"
                              variant="ghost"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              disabled={pending}
                              onClick={() => toggleType(type)}
                              size="icon"
                              title={type.isActive ? text.disable : text.enable}
                              type="button"
                              variant="ghost"
                            >
                              {type.isActive ? (
                                <XCircle className="size-4" />
                              ) : (
                                <CheckCircle2 className="size-4" />
                              )}
                            </Button>
                            <Button
                              className="text-red-700 hover:bg-red-50"
                              disabled={pending}
                              onClick={() => deleteType(type)}
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
                      {text.emptyTypes}
                    </p>
                  )
                ) : (
                  <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    {text.selectCategory}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 border-t pt-4 lg:grid-cols-2">
              <form className="grid gap-3" onSubmit={submitCategory}>
                <h3 className="flex items-center gap-2 font-bold">
                  <Plus className="size-4 text-primary" />
                  {editingCategoryId ? text.editCategory : text.addCategory}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id="category-name-ar" label={text.nameAr}>
                    <Input
                      id="category-name-ar"
                      required
                      value={categoryForm.nameAr}
                      onChange={(event) =>
                        setCategoryForm((current) => ({
                          ...current,
                          nameAr: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field id="category-name-en" label={text.nameEn}>
                    <Input
                      id="category-name-en"
                      required
                      value={categoryForm.nameEn}
                      onChange={(event) =>
                        setCategoryForm((current) => ({
                          ...current,
                          nameEn: event.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id="category-slug" label={text.slug}>
                    <Input
                      id="category-slug"
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                      required
                      value={categoryForm.slug}
                      onChange={(event) =>
                        setCategoryForm((current) => ({
                          ...current,
                          slug: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field id="category-sort" label={text.sortOrder}>
                    <Input
                      id="category-sort"
                      min={0}
                      type="number"
                      value={categoryForm.sortOrder}
                      onChange={(event) =>
                        setCategoryForm((current) => ({
                          ...current,
                          sortOrder: event.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id="category-icon" label={text.iconName}>
                    <Input
                      id="category-icon"
                      value={categoryForm.iconName}
                      onChange={(event) =>
                        setCategoryForm((current) => ({
                          ...current,
                          iconName: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field id="category-image" label={text.imageUrl}>
                    <Input
                      id="category-image"
                      type="url"
                      value={categoryForm.imageUrl}
                      onChange={(event) =>
                        setCategoryForm((current) => ({
                          ...current,
                          imageUrl: event.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <Checkbox
                    checked={categoryForm.isActive}
                    onChange={(event) =>
                      setCategoryForm((current) => ({
                        ...current,
                        isActive: event.currentTarget.checked,
                      }))
                    }
                  />
                  {text.active}
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={pending} type="submit">
                    {pending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    {editingCategoryId ? text.save : text.create}
                  </Button>
                  {editingCategoryId ? (
                    <Button
                      disabled={pending}
                      onClick={() => {
                        setEditingCategoryId(null);
                        setCategoryForm(emptyCategoryForm);
                      }}
                      type="button"
                      variant="secondary"
                    >
                      {text.cancel}
                    </Button>
                  ) : null}
                </div>
              </form>

              <form className="grid gap-3" onSubmit={submitType}>
                <h3 className="flex items-center gap-2 font-bold">
                  <Plus className="size-4 text-primary" />
                  {editingTypeId ? text.editType : text.addType}
                </h3>
                <Field id="type-category" label={text.parentCategory}>
                  <Select
                    id="type-category"
                    required
                    value={typeForm.categoryId}
                    onChange={(event) =>
                      setTypeForm((current) => ({
                        ...current,
                        categoryId: event.target.value,
                      }))
                    }
                  >
                    <option value="">{text.selectCategory}</option>
                    {data.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {localizedName(category, locale)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id="type-name-ar" label={text.nameAr}>
                    <Input
                      id="type-name-ar"
                      required
                      value={typeForm.nameAr}
                      onChange={(event) =>
                        setTypeForm((current) => ({
                          ...current,
                          nameAr: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field id="type-name-en" label={text.nameEn}>
                    <Input
                      id="type-name-en"
                      required
                      value={typeForm.nameEn}
                      onChange={(event) =>
                        setTypeForm((current) => ({
                          ...current,
                          nameEn: event.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                  <Field id="type-slug" label={text.slug}>
                    <Input
                      id="type-slug"
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                      required
                      value={typeForm.slug}
                      onChange={(event) =>
                        setTypeForm((current) => ({
                          ...current,
                          slug: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field id="type-sort" label={text.sortOrder}>
                    <Input
                      id="type-sort"
                      min={0}
                      type="number"
                      value={typeForm.sortOrder}
                      onChange={(event) =>
                        setTypeForm((current) => ({
                          ...current,
                          sortOrder: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <label className="flex items-end gap-2 pb-3 text-sm font-semibold">
                    <Checkbox
                      checked={typeForm.isActive}
                      onChange={(event) =>
                        setTypeForm((current) => ({
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
                    {pending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    {editingTypeId ? text.save : text.create}
                  </Button>
                  {editingTypeId ? (
                    <Button
                      disabled={pending}
                      onClick={() => {
                        setEditingTypeId(null);
                        setTypeForm(emptyTypeForm(selectedCategory?.id));
                      }}
                      type="button"
                      variant="secondary"
                    >
                      {text.cancel}
                    </Button>
                  ) : null}
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="size-5 text-primary" />
              {text.amenities}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setAmenityGroup("all")}
                size="sm"
                type="button"
                variant={amenityGroup === "all" ? "default" : "secondary"}
              >
                {text.allGroups}
              </Button>
              {amenityGroups.map((group) => (
                <Button
                  key={group}
                  onClick={() => setAmenityGroup(group)}
                  size="sm"
                  type="button"
                  variant={amenityGroup === group ? "default" : "secondary"}
                >
                  {groupLabel(group, locale)}
                </Button>
              ))}
            </div>

            <div className="grid max-h-[520px] gap-2 overflow-y-auto pe-1">
              {filteredAmenities.length > 0 ? (
                filteredAmenities.map((amenity) => (
                  <div
                    className="rounded-lg border border-border bg-background p-3"
                    key={amenity.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="block truncate font-bold">
                          {localizedName(amenity, locale)}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {groupLabel(amenity.category, locale)}
                          {amenity.iconName ? ` · ${amenity.iconName}` : ""}
                        </span>
                      </div>
                      <span className="rounded-full bg-muted px-2 py-1 text-xs font-bold text-muted-foreground">
                        {amenity.counts.properties} {text.properties}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-end gap-1">
                      <Button
                        disabled={pending}
                        onClick={() => editAmenity(amenity)}
                        size="icon"
                        title={text.edit}
                        type="button"
                        variant="ghost"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        className="text-red-700 hover:bg-red-50"
                        disabled={pending}
                        onClick={() => deleteAmenity(amenity)}
                        size="icon"
                        title={text.delete}
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  {text.emptyAmenities}
                </p>
              )}
            </div>

            <form className="grid gap-3 border-t pt-4" onSubmit={submitAmenity}>
              <h3 className="flex items-center gap-2 font-bold">
                <Plus className="size-4 text-primary" />
                {editingAmenityId ? text.editAmenity : text.addAmenity}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="amenity-name-ar" label={text.nameAr}>
                  <Input
                    id="amenity-name-ar"
                    required
                    value={amenityForm.nameAr}
                    onChange={(event) =>
                      setAmenityForm((current) => ({
                        ...current,
                        nameAr: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field id="amenity-name-en" label={text.nameEn}>
                  <Input
                    id="amenity-name-en"
                    required
                    value={amenityForm.nameEn}
                    onChange={(event) =>
                      setAmenityForm((current) => ({
                        ...current,
                        nameEn: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field id="amenity-group" label={text.group}>
                  <Select
                    id="amenity-group"
                    value={amenityForm.category}
                    onChange={(event) =>
                      setAmenityForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                  >
                    <option value="">{text.noGroup}</option>
                    {amenityGroups.map((group) => (
                      <option key={group} value={group}>
                        {groupLabel(group, locale)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field id="amenity-icon" label={text.iconName}>
                  <Input
                    id="amenity-icon"
                    value={amenityForm.iconName}
                    onChange={(event) =>
                      setAmenityForm((current) => ({
                        ...current,
                        iconName: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field id="amenity-sort" label={text.sortOrder}>
                  <Input
                    id="amenity-sort"
                    min={0}
                    type="number"
                    value={amenityForm.sortOrder}
                    onChange={(event) =>
                      setAmenityForm((current) => ({
                        ...current,
                        sortOrder: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={pending} type="submit">
                  {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                  {editingAmenityId ? text.save : text.create}
                </Button>
                {editingAmenityId ? (
                  <Button
                    disabled={pending}
                    onClick={() => {
                      setEditingAmenityId(null);
                      setAmenityForm(emptyAmenityForm);
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
