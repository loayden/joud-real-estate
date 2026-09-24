"use client";

import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  src?: string | null;
  alt?: string;
  fallback?: string;
}

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
} as const;

function Avatar({
  className,
  size = "md",
  src,
  alt,
  fallback,
  ...props
}: AvatarProps) {
  const sizes = {
    sm: "size-8 text-caption",
    md: "size-10 text-small",
    lg: "size-12 text-body",
    xl: "size-16 text-h4",
  };

  const [imgError, setImgError] = React.useState(false);
  const px = sizeMap[size];

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground",
        sizes[size],
        className,
      )}
      {...props}
    >
      {src && !imgError ? (
        <Image
          src={src}
          alt={alt || ""}
          fill
          sizes={`${px}px`}
          className="object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="select-none font-medium">{fallback || "?"}</span>
      )}
    </div>
  );
}

export { Avatar };
