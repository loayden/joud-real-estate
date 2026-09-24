import { Map } from "lucide-react";
import type { Metadata } from "next";

import { AdminRegionsManager } from "@/components/admin/AdminRegionsManager";
import { Card, CardContent } from "@/components/ui/card";
import { type Locale } from "@/i18n/routing";
import { getAdminGeography } from "@/lib/admin-cms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: {
    pageTitle: "إدارة المناطق والمدن | جود العقارية",
    title: "إدارة المناطق والمدن",
    description:
      "تحكم في المناطق النشطة، المدن، والأحياء المستخدمة في نماذج العقارات وفلاتر البحث العامة.",
    regions: "منطقة",
    cities: "مدينة",
    neighborhoods: "حي",
  },
  en: {
    pageTitle: "Regions & Cities | Joud Real Estate",
    title: "Regions & Cities",
    description:
      "Manage active regions, cities, and neighborhoods used by property forms and public search filters.",
    regions: "regions",
    cities: "cities",
    neighborhoods: "neighborhoods",
  },
} as const;

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  return {
    title: copy[locale].pageTitle,
  };
}

export default async function AdminRegionsPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const text = copy[locale];
  const regions = await getAdminGeography();
  const cityCount = regions.reduce(
    (total, region) => total + region.cities.length,
    0,
  );
  const neighborhoodCount = regions.reduce(
    (total, region) =>
      total +
      region.cities.reduce(
        (cityTotal, city) => cityTotal + city.neighborhoods.length,
        0,
      ),
    0,
  );

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h2 className="flex items-center gap-3 text-3xl font-bold tracking-normal text-foreground">
          <Map className="size-7 text-primary" />
          {text.title}
        </h2>
        <p className="max-w-3xl text-muted-foreground">{text.description}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{text.regions}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {regions.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{text.cities}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {cityCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              {text.neighborhoods}
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {neighborhoodCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <AdminRegionsManager initialRegions={regions} locale={locale} />
    </div>
  );
}
