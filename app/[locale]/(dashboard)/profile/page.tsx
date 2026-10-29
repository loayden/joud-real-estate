import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/ProfileForm";
import type { Locale } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getSafeUserProfile } from "@/lib/user-profile";

const copy = {
  ar: { title: "الملف الشخصي" },
  en: { title: "Profile" },
} as const;

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = (await paramsPromise) as { locale: Locale };
  return { title: copy[locale].title };
}

export default async function ProfilePage({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await paramsPromise) as { locale: Locale };
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/profile`);
  }

  const profile = await getSafeUserProfile(session.user.id);

  if (!profile) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/profile`);
  }

  return <ProfileForm locale={locale} profile={profile} />;
}
