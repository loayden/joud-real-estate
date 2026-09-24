"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";

const text = {
  ar: {
    delete: "حذف",
    confirm: "هل تريد حذف هذا العقار؟ لا يمكن التراجع عن هذا الإجراء.",
    error: "تعذر حذف العقار.",
  },
  en: {
    delete: "Delete",
    confirm: "Delete this property? This action cannot be undone.",
    error: "Could not delete the property.",
  },
} as const;

export function DeletePropertyButton({
  propertyId,
  locale,
}: {
  propertyId: string;
  locale: "ar" | "en";
}) {
  const copy = text[locale];
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(copy.confirm)) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(copy.error);
      }

      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : copy.error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="grid gap-1">
      <Button
        disabled={isDeleting}
        onClick={handleDelete}
        size="sm"
        type="button"
        variant="secondary"
      >
        <Trash2 className="size-4" />
        {isDeleting ? "..." : copy.delete}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
