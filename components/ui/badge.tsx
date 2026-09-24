import * as React from "react";

import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "success"
    | "warning"
    | "destructive"
    | "gold";
  size?: "sm" | "md" | "lg";
}

function Badge({
  className,
  variant = "default",
  size = "md",
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-muted text-muted-foreground",
    outline: "border border-border text-foreground bg-transparent",
    success: "bg-success text-success-foreground",
    warning: "bg-warning text-warning-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    gold: "bg-gold text-gold-foreground",
  };

  const sizes = {
    sm: "h-5 px-1.5 text-[10px]",
    md: "h-6 px-2 text-caption",
    lg: "h-7 px-2.5 text-small",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md font-medium",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
