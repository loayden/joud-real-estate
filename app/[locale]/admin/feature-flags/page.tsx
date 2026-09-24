import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FeatureFlagsManager } from "@/components/admin/FeatureFlagsManager";
import type { Locale } from "@/i18n/routing";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

const copy = {
  ar: {
    title: "أعلام الميزات",
    category: "إعدادات_SYSTEM",
    description:
      "تحكم آمن في الميزات المستقبلية مثل الخريطة، البحث الذكي، وإشعارات الويب دون نشر كود جديد.",
  },
  en: {
    title: "Feature Flags",
    category: "System settings",
    description:
      "Safely control future capabilities such as map view, AI search, and web push without shipping new code.",
  },
} as const;

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  return { title: copy[locale].title };
}

export default async function AdminFeatureFlagsPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const text = copy[locale];
  const session = await requireRole(["SUPER_ADMIN"]).catch(() => null);

  if (!session) {
    redirect(`/${locale}/admin`);
  }

  const flags = await prisma.featureFlag.findMany({
    orderBy: { key: "asc" },
  });

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-bold text-gold-700">{text.category}</p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">
          {text.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
          {text.description}
        </p>
      </div>
      <FeatureFlagsManager initialFlags={flags} locale={locale} />
    </div>
  );
}
