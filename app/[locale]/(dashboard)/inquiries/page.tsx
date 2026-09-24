import type { InquiryStatus } from "@prisma/client";
import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";

import { InquiryInbox } from "@/components/inquiries/InquiryInbox";
import { Button } from "@/components/ui/button";
import { Link, type Locale } from "@/i18n/routing";
import { requireSession } from "@/lib/auth-utils";
import {
  getReceivedInquiries,
  getSentInquiries,
  parseInquiryStatus,
} from "@/lib/inquiries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: {
    pageTitle: "الاستفسارات | جود العقارية",
    title: "الاستفسارات",
    description:
      "تابع الاستفسارات الواردة على عقاراتك، وراجع الاستفسارات التي أرسلتها.",
    all: "الكل",
    new: "جديد",
    read: "مقروء",
    replied: "تم الرد",
    closed: "مغلق",
    receivedCount: "وارد",
    sentCount: "مرسل",
    sent: "المرسلة",
  },
  en: {
    pageTitle: "Inquiries | Joud Real Estate",
    title: "Inquiries",
    description:
      "Track inquiries received on your listings and review inquiries you sent.",
    all: "All",
    new: "New",
    read: "Read",
    replied: "Replied",
    closed: "Closed",
    receivedCount: "received",
    sentCount: "sent",
    sent: "Sent",
  },
} as const;

const statusTabs: Array<{
  label: keyof typeof copy.ar;
  status?: InquiryStatus;
}> = [
  { label: "all" },
  { label: "new", status: "NEW" },
  { label: "read", status: "READ" },
  { label: "replied", status: "REPLIED" },
  { label: "closed", status: "CLOSED" },
];

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  return {
    title: copy[locale].pageTitle,
  };
}

function buildHref(status?: InquiryStatus) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const query = params.toString();
  return `/inquiries${query ? `?${query}` : ""}`;
}

export default async function InquiriesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams?: { status?: string; tab?: string };
}) {
  const session = await requireSession();
  const text = copy[locale];
  const status = parseInquiryStatus(searchParams?.status);
  const initialTab = searchParams?.tab === "sent" ? "sent" : "received";
  const [received, sent] = await Promise.all([
    getReceivedInquiries({ userId: session.user.id, status }),
    getSentInquiries(session.user.id),
  ]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="grid gap-2">
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-normal">
            <MessageSquare className="size-7 text-primary" />
            {text.title}
          </h1>
          <p className="max-w-3xl text-muted-foreground">{text.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-sm font-bold text-muted-foreground">
            {received.length} {text.receivedCount}
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-sm font-bold text-muted-foreground">
            {sent.length} {text.sentCount}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => {
          const active = tab.status === status || (!tab.status && !status);

          return (
            <Link
              className={cn(
                "inline-flex h-9 items-center rounded-md border px-3 text-sm font-bold transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted",
              )}
              href={buildHref(tab.status)}
              key={tab.label}
            >
              {text[tab.label]}
            </Link>
          );
        })}
        <Button
          asChild
          variant={initialTab === "sent" ? "default" : "secondary"}
        >
          <Link href="/inquiries?tab=sent">{text.sent}</Link>
        </Button>
      </div>

      <InquiryInbox
        initialTab={initialTab}
        locale={locale}
        received={received}
        sent={sent}
      />
    </div>
  );
}
