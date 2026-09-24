"use client";

import type { UserRole, UserStatus } from "@prisma/client";
import { Ban, RotateCcw, Shield } from "lucide-react";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { Locale } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    ban: "حظر",
    unban: "إلغاء الحظر",
    role: "الدور",
    updateRole: "تغيير الدور",
    reasonPrompt: "سبب الحظر (اختياري)",
    banConfirm: "هل تريد حظر هذا المستخدم؟",
    unbanConfirm: "هل تريد إعادة تفعيل هذا المستخدم؟",
    roleConfirm: "هل تريد تغيير دور هذا المستخدم؟",
    protectedUser: "هذا الحساب محمي من هذا الإجراء.",
    user: "مستخدم",
    agent: "وسيط",
    admin: "مدير",
    error: "تعذر تنفيذ الإجراء. حاول مرة أخرى.",
  },
  en: {
    ban: "Ban",
    unban: "Unban",
    role: "Role",
    updateRole: "Change role",
    reasonPrompt: "Ban reason (optional)",
    banConfirm: "Ban this user?",
    unbanConfirm: "Reactivate this user?",
    roleConfirm: "Change this user's role?",
    protectedUser: "This account is protected from this action.",
    user: "User",
    agent: "Agent",
    admin: "Admin",
    error: "Could not complete the action. Try again.",
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

function canMutate({
  targetUserId,
  currentUserId,
  targetRole,
  currentAdminRole,
}: {
  targetUserId: string;
  currentUserId: string;
  targetRole: UserRole;
  currentAdminRole: UserRole;
}) {
  if (targetUserId === currentUserId) return false;
  if (targetRole === "SUPER_ADMIN") return false;
  if (targetRole === "ADMIN" && currentAdminRole !== "SUPER_ADMIN") {
    return false;
  }

  return true;
}

export function AdminUserActions({
  userId,
  status,
  role,
  currentUserId,
  currentAdminRole,
  locale,
  compact = false,
}: {
  userId: string;
  status: UserStatus;
  role: UserRole;
  currentUserId: string;
  currentAdminRole: UserRole;
  locale: Locale;
  compact?: boolean;
}) {
  const text = copy[locale];
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    role === "SUPER_ADMIN" ? "ADMIN" : role,
  );
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const allowedToMutate = canMutate({
    targetUserId: userId,
    currentUserId,
    targetRole: role,
    currentAdminRole,
  });
  const canChangeRole =
    currentAdminRole === "SUPER_ADMIN" &&
    userId !== currentUserId &&
    role !== "SUPER_ADMIN";

  async function runAction({
    endpoint,
    body,
    confirmMessage,
    actionName,
  }: {
    endpoint: string;
    body?: Record<string, unknown>;
    confirmMessage?: string;
    actionName: string;
  }) {
    if (!allowedToMutate && actionName !== "role") {
      setError(text.protectedUser);
      return;
    }

    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setPendingAction(actionName);
    setError(null);

    try {
      await parseResponse(
        await fetch(endpoint, {
          body: body ? JSON.stringify(body) : undefined,
          headers: body ? { "Content-Type": "application/json" } : undefined,
          method: "PUT",
        }),
      );
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : text.error);
    } finally {
      setPendingAction(null);
    }
  }

  async function ban() {
    const reason = window.prompt(text.reasonPrompt) ?? undefined;

    await runAction({
      endpoint: `/api/admin/users/${userId}/ban`,
      body: reason ? { reason } : undefined,
      confirmMessage: text.banConfirm,
      actionName: "ban",
    });
  }

  async function unban() {
    await runAction({
      endpoint: `/api/admin/users/${userId}/unban`,
      confirmMessage: text.unbanConfirm,
      actionName: "unban",
    });
  }

  async function updateRole() {
    if (!canChangeRole) {
      setError(text.protectedUser);
      return;
    }

    await runAction({
      endpoint: `/api/admin/users/${userId}/role`,
      body: { role: selectedRole },
      confirmMessage: text.roleConfirm,
      actionName: "role",
    });
  }

  const disabled = pendingAction !== null;

  return (
    <div className={cn("grid gap-3", compact && "justify-items-end")}>
      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <div className={cn("flex flex-wrap gap-2", compact && "justify-end")}>
        {status === "BANNED" ? (
          <Button
            disabled={disabled || !allowedToMutate}
            onClick={unban}
            size={compact ? "sm" : "default"}
            type="button"
            variant="secondary"
          >
            <RotateCcw className="size-4" />
            {text.unban}
          </Button>
        ) : (
          <Button
            className="border-red-200 text-red-700 hover:bg-red-50"
            disabled={disabled || !allowedToMutate}
            onClick={ban}
            size={compact ? "sm" : "default"}
            type="button"
            variant="secondary"
          >
            <Ban className="size-4" />
            {text.ban}
          </Button>
        )}
      </div>

      {canChangeRole ? (
        <div
          className={cn(
            "grid gap-2",
            compact ? "min-w-56 grid-cols-[1fr_auto]" : "grid-cols-[1fr_auto]",
          )}
        >
          <Select
            aria-label={text.role}
            disabled={disabled}
            onChange={(event) =>
              setSelectedRole(event.target.value as UserRole)
            }
            value={selectedRole}
          >
            <option value="USER">{text.user}</option>
            <option value="AGENT">{text.agent}</option>
            <option value="ADMIN">{text.admin}</option>
          </Select>
          <Button
            disabled={disabled || selectedRole === role}
            onClick={updateRole}
            type="button"
            variant="secondary"
          >
            <Shield className="size-4" />
            {compact ? null : text.updateRole}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
