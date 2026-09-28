import type { Metadata } from "next";
import { Building2, Eye, FileClock, FileText, Plus } from "lucide-react";
import { redirect } from "next/navigation";

import { StatsCard } from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";
import { Link, type Locale } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const copy = {
  ar: {
    title: "لوحة التحكم",
    description: "نظرة سريعة على نشاط عقاراتك وحالة الإعلانات.",
    active: "الإعلانات النشطة",
    pending: "بانتظار المراجعة",
    drafts: "المسودات",
    views: "إجمالي المشاهدات",
    activeDescription: "العقارات المعتمدة والمنشورة.",
    pendingDescription: "إعلانات تحتاج موافقة الإدارة.",
    draftsDescription: "إعلانات غير مرسلة للمراجعة.",
    viewsDescription: "مجموع مشاهدات كل عقاراتك.",
    addListing: "إضافة عقار",
  },
  en: {
    title: "Dashboard",
    description: "A quick view of your listing activity and statuses.",
    active: "Active Listings",
    pending: "Pending Review",
    drafts: "Drafts",
    views: "Total Views",
    activeDescription: "Approved and published properties.",
    pendingDescription: "Listings awaiting admin approval.",
    draftsDescription: "Listings not submitted for review.",
    viewsDescription: "Combined views across your listings.",
    addListing: "Add Listing",
  },
} as const;

// User-specific page: must never be prerendered at build time.
export const dynamic = "force-dynamic";

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  return { title: copy[locale].title };
}

export default async function DashboardPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/dashboard`);
  }

  const [activeListings, pendingListings, draftListings, views] =
    await Promise.all([
      prisma.property.count({
        where: { userId: session.user.id, status: "APPROVED" },
      }),
      prisma.property.count({
        where: { userId: session.user.id, status: "PENDING" },
      }),
      prisma.property.count({
        where: { userId: session.user.id, status: "DRAFT" },
      }),
      prisma.property.aggregate({
        where: { userId: session.user.id },
        _sum: { viewCount: true },
      }),
    ]);
  const text = copy[locale];

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">{text.title}</h1>
          <p className="mt-2 text-muted-foreground">{text.description}</p>
        </div>
        <Button asChild>
          <Link href="/my-listings/new">
            <Plus className="size-4" />
            {text.addListing}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          color="green"
          description={text.activeDescription}
          icon={Building2}
          title={text.active}
          value={activeListings}
        />
        <StatsCard
          color="yellow"
          description={text.pendingDescription}
          icon={FileClock}
          title={text.pending}
          value={pendingListings}
        />
        <StatsCard
          color="gray"
          description={text.draftsDescription}
          icon={FileText}
          title={text.drafts}
          value={draftListings}
        />
        <StatsCard
          color="blue"
          description={text.viewsDescription}
          icon={Eye}
          title={text.views}
          value={views._sum.viewCount ?? 0}
        />
      </div>
    </div>
  );
}
