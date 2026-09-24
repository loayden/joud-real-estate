"use client";

import { Archive, CheckCircle2, ImageIcon, XCircle } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { AdminPropertyActions } from "@/components/admin/AdminPropertyActions";
import { PropertyStatusBadge } from "@/components/property/PropertyStatusBadge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, type Locale, useRouter } from "@/i18n/routing";
import type { AdminPropertyListItem } from "@/lib/admin-properties";

const copy = {
  ar: {
    property: "العقار",
    owner: "المالك",
    location: "الموقع",
    price: "السعر",
    status: "الحالة",
    submitted: "تاريخ الإرسال",
    actions: "الإجراءات",
    selected: "محدد",
    bulkApprove: "اعتماد المحدد",
    bulkReject: "رفض المحدد",
    bulkArchive: "أرشفة المحدد",
    rejectPrompt: "سبب الرفض للمجموعة (10 أحرف على الأقل)",
    rejectRequired: "سبب الرفض مطلوب ويجب ألا يقل عن 10 أحرف.",
    empty: "لا توجد عقارات مطابقة للفلاتر الحالية.",
    noImage: "لا توجد صورة",
    error: "تعذر تنفيذ الإجراء الجماعي. حاول مرة أخرى.",
  },
  en: {
    property: "Property",
    owner: "Owner",
    location: "Location",
    price: "Price",
    status: "Status",
    submitted: "Submitted",
    actions: "Actions",
    selected: "selected",
    bulkApprove: "Approve selected",
    bulkReject: "Reject selected",
    bulkArchive: "Archive selected",
    rejectPrompt: "Bulk rejection reason (at least 10 characters)",
    rejectRequired: "A rejection reason of at least 10 characters is required.",
    empty: "No properties match the current filters.",
    noImage: "No image",
    error: "Could not complete the bulk action. Try again.",
  },
} as const;

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

async function parseResponse(response: Response) {
  const payload = (await response
    .json()
    .catch(() => null)) as ApiResponse<unknown> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload && !payload.success ? payload.error : "Request failed",
    );
  }

  return payload.data;
}

function formatPrice(property: AdminPropertyListItem, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    currency: property.currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(property.price);
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) return "-";

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function localizeName(
  value: { nameAr: string; nameEn: string },
  locale: Locale,
) {
  return locale === "ar" ? value.nameAr : value.nameEn;
}

function ownerName(property: AdminPropertyListItem) {
  return (
    [property.owner.firstName, property.owner.lastName]
      .filter(Boolean)
      .join(" ") || property.owner.email
  );
}

export function AdminPropertiesTable({
  properties,
  locale,
}: {
  properties: AdminPropertyListItem[];
  locale: Locale;
}) {
  const text = copy[locale];
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected =
    properties.length > 0 &&
    properties.every((property) => selectedSet.has(property.id));

  function toggleAll() {
    setSelectedIds(
      allSelected ? [] : properties.map((property) => property.id),
    );
  }

  function toggleOne(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  async function bulkAction(action: "approve" | "reject" | "archive") {
    if (selectedIds.length === 0) return;

    const reason =
      action === "reject" ? window.prompt(text.rejectPrompt) : undefined;

    if (action === "reject" && (!reason || reason.trim().length < 10)) {
      setError(text.rejectRequired);
      return;
    }

    setPending(true);
    setError(null);

    try {
      await parseResponse(
        await fetch("/api/admin/properties/bulk-action", {
          body: JSON.stringify({
            ids: selectedIds,
            action,
            reason: reason?.trim(),
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      );
      setSelectedIds([]);
      router.refresh();
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : text.error);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4">
      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary-50 px-4 py-3">
          <span className="text-sm font-bold text-primary-900">
            {selectedIds.length} {text.selected}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={pending}
              onClick={() => bulkAction("approve")}
              size="sm"
              type="button"
            >
              <CheckCircle2 className="size-4" />
              {text.bulkApprove}
            </Button>
            <Button
              className="border-red-200 text-red-700 hover:bg-red-50"
              disabled={pending}
              onClick={() => bulkAction("reject")}
              size="sm"
              type="button"
              variant="secondary"
            >
              <XCircle className="size-4" />
              {text.bulkReject}
            </Button>
            <Button
              disabled={pending}
              onClick={() => bulkAction("archive")}
              size="sm"
              type="button"
              variant="secondary"
            >
              <Archive className="size-4" />
              {text.bulkArchive}
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-muted/60 text-xs font-bold text-muted-foreground">
            <tr>
              <th className="w-12 px-4 py-3 text-start">
                <Checkbox
                  aria-label="Select all properties"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-4 py-3 text-start">{text.property}</th>
              <th className="px-4 py-3 text-start">{text.owner}</th>
              <th className="px-4 py-3 text-start">{text.location}</th>
              <th className="px-4 py-3 text-start">{text.price}</th>
              <th className="px-4 py-3 text-start">{text.status}</th>
              <th className="px-4 py-3 text-start">{text.submitted}</th>
              <th className="px-4 py-3 text-end">{text.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {properties.length > 0 ? (
              properties.map((property) => {
                const title =
                  locale === "ar" || !property.titleEn
                    ? property.titleAr
                    : property.titleEn;

                return (
                  <tr className="align-top" key={property.id}>
                    <td className="px-4 py-4">
                      <Checkbox
                        aria-label={`Select ${title}`}
                        checked={selectedSet.has(property.id)}
                        onChange={() => toggleOne(property.id)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        className="grid min-w-64 grid-cols-[72px_1fr] gap-3"
                        href={`/admin/properties/${property.id}`}
                      >
                        <span className="relative grid size-[72px] place-items-center overflow-hidden rounded-md bg-muted text-muted-foreground">
                          {property.primaryImageUrl ? (
                            <Image
                              alt={title}
                              className="object-cover"
                              fill
                              sizes="72px"
                              src={property.primaryImageUrl}
                            />
                          ) : (
                            <ImageIcon className="size-5" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="line-clamp-2 font-bold text-foreground">
                            {title}
                          </span>
                          <span className="mt-1 block truncate text-xs text-muted-foreground">
                            {property.slug}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-foreground">
                        {ownerName(property)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {property.owner.email}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold">
                        {localizeName(property.city, locale)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {localizeName(property.region, locale)}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-bold text-primary">
                      {formatPrice(property, locale)}
                    </td>
                    <td className="px-4 py-4">
                      <PropertyStatusBadge
                        locale={locale}
                        status={property.status}
                      />
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatDate(property.createdAt, locale)}
                    </td>
                    <td className="px-4 py-4 text-end">
                      <AdminPropertyActions
                        compact
                        isFeatured={property.isFeatured}
                        locale={locale}
                        propertyId={property.id}
                        status={property.status}
                      />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  className="px-4 py-12 text-center text-muted-foreground"
                  colSpan={8}
                >
                  {text.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
