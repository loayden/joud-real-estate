import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";
import { VerifyEmailStatus } from "@/components/auth/VerifyEmailStatus";
import type { Locale } from "@/i18n/routing";

const copy = {
  ar: { title: "تفعيل البريد الإلكتروني" },
  en: { title: "Verify Email" },
} as const;

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = (await paramsPromise) as { locale: Locale };
  return {
    title: copy[locale].title,
    robots: { index: false, follow: false },
  };
}

export default async function VerifyEmailPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { locale } = (await paramsPromise) as { locale: Locale };
  const searchParams = await searchParamsPromise;
  const token =
    typeof searchParams.token === "string" ? searchParams.token : undefined;

  return (
    <AuthShell locale={locale}>
      <VerifyEmailStatus locale={locale} token={token} />
    </AuthShell>
  );
}
