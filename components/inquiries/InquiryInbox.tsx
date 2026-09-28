"use client";

import type { InquiryStatus } from "@prisma/client";
import {
  ExternalLink,
  ImageIcon,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState, useTransition } from "react";

import { InquiryStatusBadge } from "@/components/inquiries/InquiryStatusBadge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link, type Locale, useRouter } from "@/i18n/routing";
import type { InquiryListItem } from "@/lib/inquiries";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

const copy = {
  ar: {
    received: "الواردة",
    sent: "المرسلة",
    open: "فتح",
    close: "إغلاق",
    markRead: "تعليم كمقروء",
    markReplied: "تم الرد",
    markClosed: "إغلاق",
    replyEmail: "رد بالبريد",
    replyWhatsapp: "رد عبر واتساب",
    viewProperty: "عرض العقار",
    from: "من",
    to: "إلى",
    noReceived: "لا توجد استفسارات واردة مطابقة.",
    noSent: "لا توجد استفسارات مرسلة.",
    noContact: "لا توجد بيانات تواصل إضافية.",
    genericError: "تعذر تحديث حالة الاستفسار. حاول مرة أخرى.",
    loading: "جار التحميل",
  },
  en: {
    received: "Received",
    sent: "Sent",
    open: "Open",
    close: "Close",
    markRead: "Mark read",
    markReplied: "Mark replied",
    markClosed: "Close",
    replyEmail: "Reply by email",
    replyWhatsapp: "Reply on WhatsApp",
    viewProperty: "View property",
    from: "From",
    to: "To",
    noReceived: "No matching received inquiries.",
    noSent: "No sent inquiries.",
    noContact: "No additional contact details.",
    genericError: "Could not update inquiry status. Try again.",
    loading: "Loading",
  },
} as const;

type Tab = "received" | "sent";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

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

function normalizeWhatsapp(value: string | null) {
  if (!value) return null;

  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0020")) return digits.slice(2);
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  if (digits.length <= 10) return `20${digits}`;
  return digits;
}

function buildWhatsappHref(phone: string | null, message: string) {
  const number = normalizeWhatsapp(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function InquiryRow({
  inquiry,
  locale,
  tab,
  expanded,
  pending,
  onToggle,
  onStatusChange,
}: {
  inquiry: InquiryListItem;
  locale: Locale;
  tab: Tab;
  expanded: boolean;
  pending: boolean;
  onToggle: () => void;
  onStatusChange: (status: InquiryStatus) => void;
}) {
  const text = copy[locale];
  const propertyTitle = localizeTitle(inquiry.property, locale);
  const contact = tab === "received" ? inquiry.contact : inquiry.owner;
  const whatsapp = "whatsapp" in contact ? contact.whatsapp : null;
  const replyEmail = contact.email
    ? `mailto:${contact.email}?subject=${encodeURIComponent(propertyTitle)}`
    : null;
  const replyWhatsapp = buildWhatsappHref(
    whatsapp ?? contact.phone,
    locale === "ar"
      ? `أهلاً، بخصوص استفسارك عن العقار: ${propertyTitle}`
      : `Hello, regarding your inquiry about: ${propertyTitle}`,
  );

  return (
    <article
      className={cn(
        "rounded-lg border bg-card shadow-subtle",
        inquiry.status === "NEW" && tab === "received"
          ? "border-red-200"
          : "border-border",
      )}
    >
      <button
        className="grid w-full gap-4 p-4 text-start md:grid-cols-[72px_1fr_auto]"
        onClick={onToggle}
        type="button"
      >
        <span className="relative grid size-[72px] place-items-center overflow-hidden rounded-md bg-muted text-muted-foreground">
          {inquiry.property.thumbnailUrl ? (
            <Image
              alt={propertyTitle}
              className="object-cover"
              fill
              sizes="72px"
              src={inquiry.property.thumbnailUrl}
            />
          ) : (
            <ImageIcon className="size-5" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-base font-bold text-foreground">
            {propertyTitle}
          </span>
          <span className="mt-1 block text-sm font-semibold text-muted-foreground">
            {tab === "received" ? text.from : text.to}: {contact.name}
          </span>
          <span className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {inquiry.message}
          </span>
        </span>
        <span className="flex flex-wrap items-center gap-2 md:justify-end">
          <InquiryStatusBadge locale={locale} status={inquiry.status} />
          <span className="text-xs font-semibold text-muted-foreground">
            {formatDate(inquiry.createdAt, locale)}
          </span>
        </span>
      </button>

      {expanded ? (
        <div className="grid gap-4 border-t border-border p-4">
          <p className="whitespace-pre-line rounded-md bg-muted/45 p-4 text-sm leading-7 text-foreground">
            {inquiry.message}
          </p>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {contact.email ? (
              <span className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                <Mail className="size-4 text-primary" />
                {contact.email}
              </span>
            ) : null}
            {contact.phone ? (
              <span className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                <Phone className="size-4 text-primary" />
                {contact.phone}
              </span>
            ) : null}
            {!contact.email && !contact.phone ? (
              <span>{text.noContact}</span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href={`/property/${inquiry.property.slug}`}>
                <ExternalLink className="size-4" />
                {text.viewProperty}
              </Link>
            </Button>

            {tab === "received" ? (
              <>
                {inquiry.status !== "READ" ? (
                  <Button
                    disabled={pending}
                    onClick={() => onStatusChange("READ")}
                    type="button"
                    variant="secondary"
                  >
                    {text.markRead}
                  </Button>
                ) : null}
                {inquiry.status !== "REPLIED" ? (
                  <Button
                    disabled={pending}
                    onClick={() => onStatusChange("REPLIED")}
                    type="button"
                  >
                    {text.markReplied}
                  </Button>
                ) : null}
              </>
            ) : null}

            {inquiry.status !== "CLOSED" ? (
              <Button
                disabled={pending}
                onClick={() => onStatusChange("CLOSED")}
                type="button"
                variant="secondary"
              >
                {text.markClosed}
              </Button>
            ) : null}

            {replyWhatsapp ? (
              <Button asChild variant="secondary">
                <a href={replyWhatsapp} rel="noreferrer" target="_blank">
                  <MessageCircle className="size-4" />
                  {text.replyWhatsapp}
                </a>
              </Button>
            ) : null}
            {replyEmail ? (
              <Button asChild variant="secondary">
                <a href={replyEmail}>
                  <Mail className="size-4" />
                  {text.replyEmail}
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function InquiryInbox({
  received,
  sent,
  locale,
  initialTab = "received",
}: {
  received: InquiryListItem[];
  sent: InquiryListItem[];
  locale: Locale;
  initialTab?: Tab;
}) {
  const text = copy[locale];
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [receivedItems, setReceivedItems] = useState(received);
  const [sentItems, setSentItems] = useState(sent);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();
  const activeItems = activeTab === "received" ? receivedItems : sentItems;

  const itemById = useMemo(
    () =>
      new Map(
        [...receivedItems, ...sentItems].map((inquiry) => [
          inquiry.id,
          inquiry,
        ]),
      ),
    [receivedItems, sentItems],
  );

  function replaceInquiry(updated: InquiryListItem) {
    setReceivedItems((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    setSentItems((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  async function updateStatus(id: string, status: InquiryStatus) {
    setPendingId(id);
    setError(null);

    try {
      const response = await apiFetch(`/api/inquiries/${id}/status`, {
        body: JSON.stringify({ status }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const payload = (await response
        .json()
        .catch(() => null)) as ApiResponse<InquiryListItem> | null;

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload && !payload.success ? payload.error : text.genericError,
        );
      }

      replaceInquiry(payload.data);
      startTransition(() => router.refresh());
    } catch (statusError) {
      setError(
        statusError instanceof Error ? statusError.message : text.genericError,
      );
    } finally {
      setPendingId(null);
    }
  }

  function toggleInquiry(id: string) {
    const nextExpandedId = expandedId === id ? null : id;
    setExpandedId(nextExpandedId);

    const inquiry = itemById.get(id);
    if (
      activeTab === "received" &&
      nextExpandedId === id &&
      inquiry?.status === "NEW"
    ) {
      void updateStatus(id, "READ");
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setActiveTab("received")}
          type="button"
          variant={activeTab === "received" ? "default" : "secondary"}
        >
          <MessageSquare className="size-4" />
          {text.received}
        </Button>
        <Button
          onClick={() => setActiveTab("sent")}
          type="button"
          variant={activeTab === "sent" ? "default" : "secondary"}
        >
          <Mail className="size-4" />
          {text.sent}
        </Button>
      </div>

      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {isRefreshing ? (
        <span className="sr-only" role="status">
          {text.loading}
        </span>
      ) : null}

      {activeItems.length > 0 ? (
        <div className="grid gap-4">
          {activeItems.map((inquiry) => (
            <InquiryRow
              expanded={expandedId === inquiry.id}
              inquiry={inquiry}
              key={inquiry.id}
              locale={locale}
              onStatusChange={(status) => updateStatus(inquiry.id, status)}
              onToggle={() => toggleInquiry(inquiry.id)}
              pending={pendingId === inquiry.id}
              tab={activeTab}
            />
          ))}
        </div>
      ) : (
        <div className="grid min-h-64 place-items-center rounded-lg border border-dashed border-border bg-background p-8 text-center">
          <div className="grid max-w-md justify-items-center gap-3">
            <MessageSquare className="size-11 text-muted-foreground" />
            <p className="text-lg font-bold">
              {activeTab === "received" ? text.noReceived : text.noSent}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
