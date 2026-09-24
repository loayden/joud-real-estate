import { Layers3 } from "lucide-react";
import type { Metadata } from "next";

import { AdminClassificationsManager } from "@/components/admin/AdminClassificationsManager";
import { Card, CardContent } from "@/components/ui/card";
import { type Locale } from "@/i18n/routing";
import { getAdminClassifications } from "@/lib/admin-cms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: {
    pageTitle: "إدارة الفئات والتصنيفات | جود العقارية",
    title: "إدارة الفئات والتصنيفات",
    description:
      "حدّث فئات العقارات، أنواعها، والمرافق التي تظهر في نماذج الإدخال وفلاتر البحث.",
    categories: "فئة",
    types: "نوع",
    amenities: "مرفق",
  },
  en: {
    pageTitle: "Categories & Classifications | Joud Real Estate",
    title: "Categories & Classifications",
    description:
      "Maintain property categories, types, and amenities shown in listing forms and search filters.",
    categories: "categories",
    types: "types",
    amenities: "amenities",
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

export default async function AdminCategoriesPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const text = copy[locale];
  const data = await getAdminClassifications();
  const typeCount = data.categories.reduce(
    (total, category) => total + category.types.length,
    0,
  );

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h2 className="flex items-center gap-3 text-3xl font-bold tracking-normal text-foreground">
          <Layers3 className="size-7 text-primary" />
          {text.title}
        </h2>
        <p className="max-w-3xl text-muted-foreground">{text.description}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{text.categories}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {data.categories.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{text.types}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {typeCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{text.amenities}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {data.amenities.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <AdminClassificationsManager initialData={data} locale={locale} />
    </div>
  );
}
