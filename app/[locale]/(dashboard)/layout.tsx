import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { requireSession } from "@/lib/auth-utils";
import type { Locale } from "@/i18n/routing";
import { getUnreadInquiryCount } from "@/lib/inquiries";

export function generateMetadata(): Metadata {
  return {
    robots: { index: false, follow: false },
  };
}

export default async function DashboardLayout({
  children,
  params: { locale },
}: Readonly<{
  children: React.ReactNode;
  params: { locale: Locale };
}>) {
  const session = await requireSession().catch(() => null);

  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/dashboard`);
  }

  const unreadInquiryCount = await getUnreadInquiryCount(session.user.id);

  return (
    <div className="bg-background lg:flex">
      <DashboardSidebar unreadInquiryCount={unreadInquiryCount} />
      <section className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </section>
    </div>
  );
}
