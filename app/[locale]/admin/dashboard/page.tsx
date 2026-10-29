import { redirect } from "next/navigation";

import type { Locale } from "@/i18n/routing";

export default async function AdminDashboardRedirect({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await paramsPromise) as { locale: Locale };
  redirect(`/${locale}/admin`);
}
