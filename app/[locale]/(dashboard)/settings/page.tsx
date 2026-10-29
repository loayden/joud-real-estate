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

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = (await paramsPromise) as { locale: Locale };
  return { title: copy[locale].title };
}

export default async function SettingsPage({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await paramsPromise) as { locale: Locale };
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
