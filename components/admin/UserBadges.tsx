import type { UserRole, UserStatus } from "@prisma/client";

import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const roleCopy: Record<UserRole, { ar: string; en: string }> = {
  USER: { ar: "مستخدم", en: "User" },
  AGENT: { ar: "وسيط", en: "Agent" },
  ADMIN: { ar: "مدير", en: "Admin" },
  SUPER_ADMIN: { ar: "مدير أعلى", en: "Super admin" },
};

const roleClasses: Record<UserRole, string> = {
  USER: "border-slate-200 bg-slate-50 text-slate-700",
  AGENT: "border-sky-200 bg-sky-50 text-sky-800",
  ADMIN: "border-amber-200 bg-amber-50 text-amber-800",
  SUPER_ADMIN: "border-primary/20 bg-primary-50 text-primary",
};

const statusCopy: Record<UserStatus, { ar: string; en: string }> = {
  ACTIVE: { ar: "نشط", en: "Active" },
  INACTIVE: { ar: "غير نشط", en: "Inactive" },
  BANNED: { ar: "محظور", en: "Banned" },
  PENDING_VERIFICATION: {
    ar: "بانتظار التفعيل",
    en: "Pending verification",
  },
};

const statusClasses: Record<UserStatus, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-800",
  INACTIVE: "border-slate-200 bg-slate-50 text-slate-700",
  BANNED: "border-red-200 bg-red-50 text-red-800",
  PENDING_VERIFICATION: "border-amber-200 bg-amber-50 text-amber-800",
};

export function UserRoleBadge({
  role,
  locale,
  className,
}: {
  role: UserRole;
  locale: Locale;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-bold",
        roleClasses[role],
        className,
      )}
    >
      {roleCopy[role][locale]}
    </span>
  );
}

export function UserStatusBadge({
  status,
  locale,
  className,
}: {
  status: UserStatus;
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
