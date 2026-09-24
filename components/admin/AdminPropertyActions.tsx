"use client";

import type { PropertyStatus } from "@prisma/client";
import { CheckCircle2, Pencil, Star, XCircle, Archive } from "lucide-react";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link, type Locale, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    approve: "اعتماد",
    reject: "رفض",
    feature: "تمييز",
    unfeature: "إلغاء التمييز",
    archive: "أرشفة",
    edit: "تعديل",
    rejectionReason: "سبب الرفض",
    rejectionPlaceholder: "اكتب سبباً واضحاً يساعد المالك على تعديل الإعلان.",
    reasonPrompt: "سبب الرفض (10 أحرف على الأقل)",
    reasonRequired: "سبب الرفض مطلوب ويجب ألا يقل عن 10 أحرف.",
    approveConfirm: "هل تريد اعتماد هذا العقار؟",
    archiveConfirm: "هل تريد أرشفة هذا العقار؟",
    error: "تعذر تنفيذ الإجراء. حاول مرة أخرى.",
  },
  en: {
    approve: "Approve",
    reject: "Reject",
    feature: "Feature",
    unfeature: "Unfeature",
    archive: "Archive",
    edit: "Edit",
    rejectionReason: "Rejection reason",
    rejectionPlaceholder:
      "Write a clear reason that helps the owner fix the listing.",
    reasonPrompt: "Rejection reason (at least 10 characters)",
    reasonRequired: "A rejection reason of at least 10 characters is required.",
    approveConfirm: "Approve this property?",
    archiveConfirm: "Archive this property?",
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

export function AdminPropertyActions({
  propertyId,
  status,
  isFeatured,
  locale,
  compact = false,
}: {
  propertyId: string;
  status: PropertyStatus;
  isFeatured: boolean;
  locale: Locale;
  compact?: boolean;
}) {
  const text = copy[locale];
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction({
    endpoint,
    method = "PUT",
    body,
    confirmMessage,
    actionName,
  }: {
    endpoint: string;
    method?: "PUT" | "DELETE";
    body?: Record<string, unknown>;
    confirmMessage?: string;
    actionName: string;
  }) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setPendingAction(actionName);
    setError(null);

    try {
      await parseResponse(
        await fetch(endpoint, {
          method,
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        }),
      );
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : text.error);
    } finally {
      setPendingAction(null);
    }
  }

  async function approve() {
    await runAction({
      endpoint: `/api/admin/properties/${propertyId}/approve`,
      confirmMessage: compact ? text.approveConfirm : undefined,
      actionName: "approve",
    });
  }

  async function reject() {
    const rejectionReason = compact ? window.prompt(text.reasonPrompt) : reason;

    if (!rejectionReason || rejectionReason.trim().length < 10) {
      setError(text.reasonRequired);
      return;
    }

    await runAction({
      endpoint: `/api/admin/properties/${propertyId}/reject`,
      body: { reason: rejectionReason.trim() },
      actionName: "reject",
    });
  }

  async function toggleFeature() {
    await runAction({
      endpoint: `/api/admin/properties/${propertyId}/feature`,
      body: { isFeatured: !isFeatured },
      actionName: "feature",
    });
  }

  async function archive() {
    await runAction({
      endpoint: `/api/admin/properties/${propertyId}`,
      method: "DELETE",
      confirmMessage: text.archiveConfirm,
      actionName: "archive",
    });
  }

  const buttonClass = compact ? "h-9 px-3 text-xs" : undefined;
  const disabled = pendingAction !== null;

  return (
    <div className={cn("grid gap-3", compact && "min-w-0")}>
      {!compact ? (
        <label className="grid gap-2 text-sm font-semibold">
          {text.rejectionReason}
          <Textarea
            maxLength={2000}
            onChange={(event) => setReason(event.target.value)}
            placeholder={text.rejectionPlaceholder}
            value={reason}
          />
        </label>
      ) : null}

      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <div className={cn("flex flex-wrap gap-2", compact && "justify-end")}>
        <Button
          className={buttonClass}
          disabled={disabled || status === "APPROVED"}
          onClick={approve}
          size={compact ? "sm" : "default"}
          type="button"
        >
          <CheckCircle2 className="size-4" />
          {text.approve}
        </Button>
        <Button
          className={cn(
            "border-red-200 text-red-700 hover:bg-red-50",
            buttonClass,
          )}
          disabled={disabled || status === "REJECTED"}
          onClick={reject}
          size={compact ? "sm" : "default"}
          type="button"
          variant="secondary"
        >
          <XCircle className="size-4" />
          {text.reject}
        </Button>
        <Button
          className={buttonClass}
          disabled={disabled}
          onClick={toggleFeature}
          size={compact ? "sm" : "default"}
          type="button"
          variant="secondary"
        >
          <Star
            className={cn("size-4", isFeatured && "fill-current text-gold-700")}
          />
          {isFeatured ? text.unfeature : text.feature}
        </Button>
        <Button
          asChild
          className={buttonClass}
          size={compact ? "sm" : "default"}
          variant="secondary"
        >
          <Link href={`/admin/properties/${propertyId}/edit`}>
            <Pencil className="size-4" />
            {text.edit}
          </Link>
        </Button>
        <Button
          className={buttonClass}
          disabled={disabled || status === "ARCHIVED"}
          onClick={archive}
          size={compact ? "sm" : "default"}
          type="button"
          variant="secondary"
        >
          <Archive className="size-4" />
          {text.archive}
        </Button>
      </div>
    </div>
  );
}
