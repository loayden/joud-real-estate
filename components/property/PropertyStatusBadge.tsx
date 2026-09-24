import type { PropertyStatus } from "@prisma/client";

import { cn } from "@/lib/utils";

const statusCopy: Record<PropertyStatus, { ar: string; en: string }> = {
  DRAFT: { ar: "مسودة", en: "Draft" },
  PENDING: { ar: "قيد المراجعة", en: "Pending" },
  APPROVED: { ar: "منشور", en: "Approved" },
  REJECTED: { ar: "مرفوض", en: "Rejected" },
  EXPIRED: { ar: "منتهي", en: "Expired" },
  SOLD: { ar: "مباع", en: "Sold" },
  RENTED: { ar: "مؤجر", en: "Rented" },
  ARCHIVED: { ar: "مؤرشف", en: "Archived" },
};

const statusClasses: Record<PropertyStatus, string> = {
  DRAFT: "border-slate-200 bg-slate-50 text-slate-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-800",
  EXPIRED: "border-orange-200 bg-orange-50 text-orange-800",
  SOLD: "border-sky-200 bg-sky-50 text-sky-800",
  RENTED: "border-sky-200 bg-sky-50 text-sky-800",
  ARCHIVED: "border-zinc-200 bg-zinc-50 text-zinc-700",
};

export function PropertyStatusBadge({
  status,
  locale = "ar",
  className,
}: {
  status: PropertyStatus;
  locale?: "ar" | "en";
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
