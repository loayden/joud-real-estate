import type { Metadata } from "next";

import { PropertyForm } from "@/components/property/PropertyForm";
import type { Locale } from "@/i18n/routing";

const copy = {
  ar: { title: "إضافة عقار" },
  en: { title: "Add Property" },
} as const;

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  return { title: copy[locale].title };
}

export default function NewPropertyPage() {
  return <PropertyForm />;
}
