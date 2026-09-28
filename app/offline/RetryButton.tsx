"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function RetryButton({ label }: { label: string }) {
  return (
    <Button
      onClick={() => window.location.reload()}
      type="button"
      variant="secondary"
    >
      <RotateCcw className="h-4 w-4" />
      {label}
    </Button>
  );
}
