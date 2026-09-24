"use client";

import {
  Download,
  ExternalLink,
  ImageIcon,
  Mail,
  MessageSquare,
  Phone,
} from "lucide-react";
import Image from "next/image";

import { InquiryStatusBadge } from "@/components/inquiries/InquiryStatusBadge";
import { Button } from "@/components/ui/button";
import { Link, type Locale } from "@/i18n/routing";
import type { InquiryListItem } from "@/lib/inquiries";

const copy = {
  ar: {
    property: "العقار",
    sender: "المرسل",
    owner: "المالك",
    message: "الرسالة",
    status: "الحالة",
    date: "التاريخ",
    actions: "الإجراءات",
    view: "عرض",
    exportCsv: "تصدير CSV",
    empty: "لا توجد استفسارات مطابقة.",
    registered: "مستخدم مسجل",
    guest: "زائر",
  },
  en: {
    property: "Property",
    sender: "Sender",
    owner: "Owner",
    message: "Message",
    status: "Status",
    date: "Date",
    actions: "Actions",
    view: "View",
    exportCsv: "Export CSV",
    empty: "No matching inquiries.",
    registered: "Registered user",
    guest: "Guest",
  },
} as const;

function localizeTitle(
  property: { titleAr: string; titleEn: string | null },
  locale: Locale,
) {
  return locale === "ar" || !property.titleEn
    ? property.titleAr
    : property.titleEn;
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function csvEscape(value: string | number | null | undefined) {
  const normalized = String(value ?? "");
  return `"${normalized.replaceAll('"', '""')}"`;
}

export function AdminInquiriesTable({
  inquiries,
  locale,
}: {
  inquiries: InquiryListItem[];
  locale: Locale;
}) {
  const text = copy[locale];

  function exportCsv() {
    const header = [
      "id",
      "property_title",
      "sender_name",
      "sender_email",
      "owner_name",
      "owner_email",
      "status",
      "created_at",
      "message",
    ];
    const rows = inquiries.map((inquiry) => [
      inquiry.id,
      localizeTitle(inquiry.property, locale),
      inquiry.contact.name,
      inquiry.contact.email,
      inquiry.owner.name,
      inquiry.owner.email,
      inquiry.status,
      inquiry.createdAt,
      inquiry.message,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `inquiries_${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button
          disabled={inquiries.length === 0}
          onClick={exportCsv}
          type="button"
          variant="secondary"
        >
          <Download className="size-4" />
          {text.exportCsv}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="bg-muted/60 text-xs font-bold text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start">{text.property}</th>
              <th className="px-4 py-3 text-start">{text.sender}</th>
              <th className="px-4 py-3 text-start">{text.owner}</th>
              <th className="px-4 py-3 text-start">{text.message}</th>
              <th className="px-4 py-3 text-start">{text.status}</th>
              <th className="px-4 py-3 text-start">{text.date}</th>
              <th className="px-4 py-3 text-end">{text.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {inquiries.length > 0 ? (
              inquiries.map((inquiry) => {
                const propertyTitle = localizeTitle(inquiry.property, locale);

                return (
                  <tr className="align-top" key={inquiry.id}>
                    <td className="px-4 py-4">
                      <Link
                        className="grid min-w-64 grid-cols-[52px_1fr] items-center gap-3"
                        href={`/property/${inquiry.property.slug}`}
                      >
                        <span className="relative grid size-[52px] place-items-center overflow-hidden rounded-md bg-muted text-muted-foreground">
                          {inquiry.property.thumbnailUrl ? (
                            <Image
                              alt={propertyTitle}
                              className="object-cover"
                              fill
                              sizes="52px"
                              src={inquiry.property.thumbnailUrl}
                            />
                          ) : (
                            <ImageIcon className="size-4" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-bold">
                            {propertyTitle}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {inquiry.property.id}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold">{inquiry.contact.name}</div>
                      <div className="mt-1 text-xs font-semibold text-muted-foreground">
                        {inquiry.contact.isRegisteredUser
                          ? text.registered
                          : text.guest}
                      </div>
                      {inquiry.contact.email ? (
                        <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                          <Mail className="size-4 text-primary" />
                          <span className="truncate">
                            {inquiry.contact.email}
                          </span>
                        </div>
                      ) : null}
                      {inquiry.contact.phone ? (
                        <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                          <Phone className="size-4 text-primary" />
                          <span>{inquiry.contact.phone}</span>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold">{inquiry.owner.name}</div>
                      <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                        <Mail className="size-4 text-primary" />
                        <span className="truncate">{inquiry.owner.email}</span>
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-4">
                      <div className="line-clamp-3 leading-6 text-muted-foreground">
                        {inquiry.message}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <InquiryStatusBadge
                        locale={locale}
                        status={inquiry.status}
                      />
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatDate(inquiry.createdAt, locale)}
                    </td>
                    <td className="px-4 py-4 text-end">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/property/${inquiry.property.slug}`}>
                          <ExternalLink className="size-4" />
                          {text.view}
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  className="px-4 py-12 text-center text-muted-foreground"
                  colSpan={7}
                >
                  <div className="flex justify-center gap-2">
                    <MessageSquare className="size-5" />
                    {text.empty}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
