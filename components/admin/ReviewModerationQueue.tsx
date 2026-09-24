"use client";

import { CheckCircle2, Flag, XCircle } from "lucide-react";
import { useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { RatingWidget } from "@/components/property/RatingWidget";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";

type AdminRating = {
  id: string;
  overallScore: number;
  reviewTitle: string | null;
  reviewBody: string | null;
  status: string;
  createdAt: string;
  reviewer: { name: string };
  property: { titleAr: string; titleEn: string | null; slug: string };
};

const copy = {
  ar: {
    property: "العقار",
    reviewer: "المقيّم",
    rating: "التقييم",
    review: "المراجعة",
    status: "الحالة",
    actions: "الإجراءات",
    empty: "لا توجد تقييمات بانتظار المراجعة.",
    approve: "اعتماد",
    reject: "رفض",
    flag: "تعليم",
  },
  en: {
    property: "Property",
    reviewer: "Reviewer",
    rating: "Rating",
    review: "Review",
    status: "Status",
    actions: "Actions",
    empty: "No reviews are waiting for moderation.",
    approve: "Approve",
    reject: "Reject",
    flag: "Flag",
  },
} as const;

export function ReviewModerationQueue({
  initialRatings,
  locale,
}: {
  initialRatings: AdminRating[];
  locale: Locale;
}) {
  const text = copy[locale];
  const [ratings, setRatings] = useState(initialRatings);

  async function moderate(id: string, action: "approve" | "reject" | "flag") {
    const endpoint =
      action === "approve"
        ? `/api/admin/ratings/${id}/approve`
        : action === "reject"
          ? `/api/admin/ratings/${id}/reject`
          : "/api/admin/ratings";
    const response = await fetch(endpoint, {
      method: action === "flag" ? "PATCH" : "PUT",
      headers: { "Content-Type": "application/json" },
      body:
        action === "flag"
          ? JSON.stringify({ ids: [id], action: "flag" })
          : JSON.stringify({ reason: "Moderated from admin queue" }),
    });

    if (response.ok) {
      setRatings((current) => current.filter((rating) => rating.id !== id));
    }
  }

  const columns: DataTableColumn<AdminRating>[] = [
    {
      key: "property",
      header: text.property,
      cell: (rating) => (
        <span className="font-bold">
          {locale === "ar" || !rating.property.titleEn
            ? rating.property.titleAr
            : rating.property.titleEn}
        </span>
      ),
    },
    {
      key: "reviewer",
      header: text.reviewer,
      cell: (rating) => rating.reviewer.name,
    },
    {
      key: "rating",
      header: text.rating,
      cell: (rating) => (
        <div className="flex items-center gap-2">
          <RatingWidget readOnly size="sm" value={rating.overallScore} />
          <span className="font-bold">{rating.overallScore}/5</span>
        </div>
      ),
    },
    {
      key: "review",
      header: text.review,
      cell: (rating) => (
        <div className="max-w-xs">
          <p className="font-bold">{rating.reviewTitle ?? "-"}</p>
          <p className="line-clamp-2 text-muted-foreground">
            {rating.reviewBody ?? ""}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: text.status,
      cell: (rating) => (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
          {rating.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: text.actions,
      cell: (rating) => (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => moderate(rating.id, "approve")} size="sm">
            <CheckCircle2 className="size-4" />
            {text.approve}
          </Button>
          <Button
            onClick={() => moderate(rating.id, "reject")}
            size="sm"
            type="button"
            variant="secondary"
          >
            <XCircle className="size-4" />
            {text.reject}
          </Button>
          <Button
            onClick={() => moderate(rating.id, "flag")}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Flag className="size-4" />
            {text.flag}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={ratings}
      emptyState={text.empty}
      getRowKey={(rating) => rating.id}
    />
  );
}
