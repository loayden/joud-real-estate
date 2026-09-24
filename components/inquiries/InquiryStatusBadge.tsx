import type { InquiryStatus } from "@prisma/client";

import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const statusCopy: Record<InquiryStatus, { ar: string; en: string }> = {
  NEW: { ar: "جديد", en: "New" },
  READ: { ar: "مقروء", en: "Read" },
  REPLIED: { ar: "تم الرد", en: "Replied" },
  CLOSED: { ar: "مغلق", en: "Closed" },
};

const statusClasses: Record<InquiryStatus, string> = {
  NEW: "border-red-200 bg-red-50 text-red-800",
  READ: "border-sky-200 bg-sky-50 text-sky-800",
  REPLIED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CLOSED: "border-slate-200 bg-slate-50 text-slate-700",
};

export function InquiryStatusBadge({
  status,
  locale,
  className,
}: {
  status: InquiryStatus;
  locale: Locale;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-bold",
        statusClasses[status],
        className,
      )}
    >
      {statusCopy[status][locale]}
    </span>
  );
}
