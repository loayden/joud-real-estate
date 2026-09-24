import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SettingsForm } from "@/components/profile/SettingsForm";
import type { Locale } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getSafeUserProfile } from "@/lib/user-profile";

const copy = {
  ar: { title: "الإعدادات" },
  en: { title: "Settings" },
} as const;

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  return { title: copy[locale].title };
}

export default async function SettingsPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/settings`);
  }

  const profile = await getSafeUserProfile(session.user.id);

  if (!profile) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/settings`);
  }

  return <SettingsForm locale={locale} profile={profile} />;
}
