"use client";

import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import { apiFetch } from "@/lib/api-client";

type AdminReport = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  property: { titleAr: string; titleEn: string | null; slug: string };
  reporter: {
    email: string;
    profile: { firstName: string | null; lastName: string | null } | null;
  };
};

const copy = {
  ar: {
    property: "العقار",
    reporter: "المبلّغ",
    reason: "السبب",
    details: "التفاصيل",
    status: "الحالة",
    actions: "الإجراءات",
    empty: "لا توجد بلاغات مفتوحة.",
    review: "مراجعة",
    resolve: "حل",
    dismiss: "رفض البلاغ",
  },
  en: {
    property: "Property",
    reporter: "Reporter",
    reason: "Reason",
    details: "Details",
    status: "Status",
    actions: "Actions",
    empty: "No open reports.",
    review: "Review",
    resolve: "Resolve",
    dismiss: "Dismiss",
  },
} as const;

function reporterName(report: AdminReport) {
  const profile = report.reporter.profile;
  const name = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ");
  return name || report.reporter.email;
}

export function ReportsManagementTable({
  initialReports,
  locale,
}: {
  initialReports: AdminReport[];
  locale: Locale;
}) {
  const text = copy[locale];
  const [reports, setReports] = useState(initialReports);

  async function updateStatus(
    id: string,
    status: "REVIEWING" | "RESOLVED" | "DISMISSED",
  ) {
    const response = await apiFetch(`/api/admin/reports/${id}/resolve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      setReports((current) =>
        status === "REVIEWING"
          ? current.map((report) =>
              report.id === id ? { ...report, status } : report,
            )
          : current.filter((report) => report.id !== id),
      );
    }
  }

  const columns: DataTableColumn<AdminReport>[] = [
    {
      key: "property",
      header: text.property,
      cell: (report) => (
        <span className="font-bold">
          {locale === "ar" || !report.property.titleEn
            ? report.property.titleAr
            : report.property.titleEn}
        </span>
      ),
    },
    {
      key: "reporter",
      header: text.reporter,
      cell: (report) => reporterName(report),
    },
    { key: "reason", header: text.reason, cell: (report) => report.reason },
    {
      key: "details",
      header: text.details,
      cell: (report) => (
        <p className="line-clamp-2 max-w-xs text-muted-foreground">
          {report.details ?? "-"}
        </p>
      ),
    },
    {
      key: "status",
      header: text.status,
      cell: (report) => (
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">
          {report.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: text.actions,
      cell: (report) => (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => updateStatus(report.id, "REVIEWING")}
            size="sm"
            type="button"
            variant="secondary"
          >
            <Eye className="size-4" />
            {text.review}
          </Button>
          <Button
            onClick={() => updateStatus(report.id, "RESOLVED")}
            size="sm"
            type="button"
          >
            <CheckCircle2 className="size-4" />
            {text.resolve}
          </Button>
          <Button
            onClick={() => updateStatus(report.id, "DISMISSED")}
            size="sm"
            type="button"
            variant="ghost"
          >
            <XCircle className="size-4" />
            {text.dismiss}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={reports}
      emptyState={text.empty}
      getRowKey={(report) => report.id}
    />
  );
}
