"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type ToastKind = "success" | "error" | "info";

export type ToastPayload = {
  id: number;
  kind: ToastKind;
  message: string;
};

let toastId = 0;

export function toast(kind: ToastKind, message: string) {
  toastId += 1;
  window.dispatchEvent(
    new CustomEvent<ToastPayload>("joud:toast", {
      detail: { id: toastId, kind, message },
    }),
  );
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const;

export function Toaster() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  useEffect(() => {
    function onToast(event: Event) {
      const payload = (event as CustomEvent<ToastPayload>).detail;
      setToasts((current) => [...current.slice(-2), payload]);
      window.setTimeout(() => {
        setToasts((current) =>
          current.filter((item) => item.id !== payload.id),
        );
      }, 4200);
    }

    window.addEventListener("joud:toast", onToast);
    return () => window.removeEventListener("joud:toast", onToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] mx-auto flex w-full max-w-md flex-col items-stretch gap-2 px-4 lg:bottom-6"
      role="status"
    >
      {toasts.map((item) => {
        const Icon = icons[item.kind];
        return (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex animate-pop-in items-center gap-3 rounded-xl border bg-background/95 py-3 pe-3 ps-4 shadow-lift backdrop-blur-md",
              item.kind === "success" && "border-success/25",
              item.kind === "error" && "border-destructive/25",
              item.kind === "info" && "border-border",
            )}
          >
            <Icon
              className={cn(
                "size-5 shrink-0",
                item.kind === "success" && "text-success",
                item.kind === "error" && "text-destructive",
                item.kind === "info" && "text-primary",
              )}
            />
            <p className="min-w-0 flex-1 truncate text-small font-medium text-foreground">
              {item.message}
            </p>
            <button
              aria-label="Dismiss"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() =>
                setToasts((current) =>
                  current.filter((entry) => entry.id !== item.id),
                )
              }
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
