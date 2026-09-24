import { redirect } from "next/navigation";

import type { Locale } from "@/i18n/routing";

export default function AdminDashboardRedirect({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  redirect(`/${locale}/admin`);
}
