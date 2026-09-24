"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import type { PropertyListItem } from "@/lib/property-listing";
import type { Locale } from "@/i18n/routing";

const PropertyMap = dynamic(
  () => import("@/components/property/PropertyMap").then((m) => m.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[500px] place-items-center rounded-lg border border-border bg-muted text-sm text-muted-foreground">
        Loading...
      </div>
    ),
  },
);

export function MapView({
  properties,
  locale,
}: {
  properties: PropertyListItem[];
  locale: Locale;
}) {
  const [selectedId, setSelectedId] = useState<string | undefined>();

  return (
    <div className="h-[500px] overflow-hidden rounded-lg border border-border lg:h-[600px]">
      <PropertyMap
        locale={locale}
        onSelect={(p) => setSelectedId(p.id)}
        properties={properties}
        selectedId={selectedId}
      />
    </div>
  );
}
