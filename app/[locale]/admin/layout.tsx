import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import type { Locale } from "@/i18n/routing";
import { requireRole } from "@/lib/auth-utils";

const copy = {
  ar: {
    title: "لوحة الإدارة",
    description: "إدارة العقارات والمستخدمين والمحتوى",
  },
  en: {
    title: "Admin console",
    description: "Manage listings, users, and platform content",
  },
} as const;

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  return {
    title: copy[locale].title,
    robots: { index: false, follow: false },
  };
}

export default async function AdminLayout({
  children,
  params: { locale },
}: Readonly<{
  children: React.ReactNode;
  params: { locale: Locale };
}>) {
  const text = copy[locale];
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]).catch(() => null);

  if (!session) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/admin`);
  }

  return (
    <section className="bg-muted/30">
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {text.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {text.description}
              </p>
            </div>
          </div>
          <div className="rounded-md border border-border bg-card px-3 py-2 text-sm">
            <span className="font-bold text-foreground">
              {session.user.email}
            </span>
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="font-semibold text-primary">
              {session.user.role}
            </span>
          </div>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-col lg:flex-row">
        <AdminSidebar locale={locale} role={session.user.role} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </section>
  );
}
