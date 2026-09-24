"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function RatingWidget({
  value,
  onChange,
  readOnly = false,
  size = "md",
  label,
}: {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const iconSize =
    size === "lg" ? "size-7" : size === "sm" ? "size-4" : "size-5";

  return (
    <div aria-label={label} className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((score) => {
        const active = score <= Math.round(value);

        return (
          <button
            aria-label={`${score} / 5`}
            className={cn(
              "rounded-sm text-muted-foreground transition-colors",
              active && "text-gold-700",
              !readOnly &&
                "hover:text-gold-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
            disabled={readOnly}
            key={score}
            onClick={() => onChange?.(score)}
            type="button"
          >
            <Star
              className={cn(iconSize, active && "fill-current")}
              strokeWidth={2.4}
            />
          </button>
        );
      })}
    </div>
  );
}
