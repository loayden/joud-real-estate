import * as React from "react";

import { cn } from "@/lib/utils";

const alertVariants = {
  default: "border-primary/20 bg-primary-50 text-primary-800",
  destructive: "border-destructive/20 bg-destructive/5 text-destructive",
  success: "border-success/20 bg-success/5 text-success",
  warning: "border-warning/20 bg-warning/5 text-warning",
} as const;

type AlertVariant = keyof typeof alertVariants;

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    className={cn(
      "rounded-lg border px-4 py-3 text-body",
      alertVariants[variant],
      className,
    )}
    ref={ref}
    role="alert"
    {...props}
  />
));
Alert.displayName = "Alert";

export { Alert };
