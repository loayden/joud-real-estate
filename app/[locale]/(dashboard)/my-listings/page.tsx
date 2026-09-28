import type { Metadata } from "next";
import { Edit, Eye, Heart, MessageCircle, Plus } from "lucide-react";
import { redirect } from "next/navigation";

import { DeletePropertyButton } from "@/components/property/DeletePropertyButton";
import { PropertyStatusBadge } from "@/components/property/PropertyStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, type Locale } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const copy = {
  ar: {
    title: "إعلاناتي",
    description: "إدارة المسودات والإعلانات المرسلة للمراجعة والمنشورة.",
    add: "إضافة عقار",
    emptyTitle: "لا توجد إعلانات بعد",
    emptyDescription: "ابدأ بإضافة أول عقار ليظهر هنا كمسودة قابلة للتعديل.",
    property: "العقار",
    status: "الحالة",
    price: "السعر",
    city: "المدينة",
    updated: "آخر تحديث",
    actions: "الإجراءات",
    edit: "تعديل",
    stats: "الأداء",
    views: "مشاهدة",
    inquiries: "استفسار",
    favorites: "مفضلة",
    scrollHint: "اسحب للمتابعة ←",
    fallback: "جود",
  },
  en: {
    title: "My Listings",
    description:
      "Manage drafts, moderation submissions, and published listings.",
    add: "Add property",
    emptyTitle: "No listings yet",
    emptyDescription:
      "Create your first property and it will appear here as an editable draft.",
    property: "Property",
    status: "Status",
    price: "Price",
    city: "City",
    updated: "Updated",
    actions: "Actions",
    edit: "Edit",
    stats: "Performance",
    views: "views",
    inquiries: "inquiries",
    favorites: "favorites",
    scrollHint: "Scroll →",
    fallback: "Joud",
  },
} as const;

function formatCurrency(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    currency: "EGP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
  }).format(date);
}

// User-specific page: must never be prerendered at build time.
export const dynamic = "force-dynamic";

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  return {
    title: copy[locale].title,
  };
}

export default async function MyListingsPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/my-listings`);
  }

  const properties = await prisma.property.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      category: { select: { nameAr: true, nameEn: true } },
      city: { select: { nameAr: true, nameEn: true } },
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { thumbnailUrl: true, url: true },
      },
    },
  });
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
            {text.add}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{text.title}</CardTitle>
          <CardDescription>{text.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <div className="grid min-h-56 place-items-center rounded-md border border-dashed border-border bg-muted/30 p-6 text-center">
              <div className="grid max-w-md gap-3">
                <h2 className="text-xl font-bold">{text.emptyTitle}</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {text.emptyDescription}
                </p>
                <Button asChild className="mx-auto">
                  <Link href="/my-listings/new">{text.add}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="mb-2 text-xs text-muted-foreground sm:hidden">
                {text.scrollHint}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="px-3 py-3 text-start font-bold">
                        {text.property}
                      </th>
                      <th className="px-3 py-3 text-start font-bold">
                        {text.status}
                      </th>
                      <th className="px-3 py-3 text-start font-bold">
                        {text.price}
                      </th>
                      <th className="px-3 py-3 text-start font-bold">
                        {text.city}
                      </th>
                      <th className="px-3 py-3 text-start font-bold">
                        {text.updated}
                      </th>
                      <th className="px-3 py-3 text-start font-bold">
                        {text.stats}
                      </th>
                      <th className="px-3 py-3 text-start font-bold">
                        {text.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((property) => {
                      const thumbnail =
                        property.images[0]?.thumbnailUrl ??
                        property.images[0]?.url ??
                        null;
                      const canDelete =
                        property.status === "DRAFT" ||
                        property.status === "REJECTED";

                      return (
                        <tr
                          className="border-b border-border last:border-b-0"
                          key={property.id}
                        >
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-3">
                              <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md bg-muted text-xs font-bold text-muted-foreground">
                                {thumbnail ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    alt={
                                      locale === "ar" || !property.titleEn
                                        ? property.titleAr
                                        : property.titleEn
                                    }
                                    className="size-full object-cover"
                                    src={thumbnail}
                                  />
                                ) : (
                                  text.fallback
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate font-bold">
                                  {locale === "ar" || !property.titleEn
                                    ? property.titleAr
                                    : property.titleEn}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {locale === "ar"
                                    ? property.category.nameAr
                                    : property.category.nameEn}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <PropertyStatusBadge
                              locale={locale}
                              status={property.status}
                            />
                          </td>
                          <td className="px-3 py-4 font-semibold">
                            {formatCurrency(property.price.toNumber(), locale)}
                          </td>
                          <td className="px-3 py-4">
                            {locale === "ar"
                              ? property.city.nameAr
                              : property.city.nameEn}
                          </td>
                          <td className="px-3 py-4">
                            {formatDate(property.updatedAt, locale)}
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span
                                className="inline-flex items-center gap-1"
                                title={text.views}
                              >
                                <Eye className="size-3.5" aria-hidden="true" />
                                {property.viewCount.toLocaleString(
                                  locale === "ar" ? "ar-EG" : "en-US",
                                )}
                              </span>
                              <span
                                className="inline-flex items-center gap-1"
                                title={text.inquiries}
                              >
                                <MessageCircle
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                                {property.inquiryCount.toLocaleString(
                                  locale === "ar" ? "ar-EG" : "en-US",
                                )}
                              </span>
                              <span
                                className="inline-flex items-center gap-1"
                                title={text.favorites}
                              >
                                <Heart
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                                {property.favoriteCount.toLocaleString(
                                  locale === "ar" ? "ar-EG" : "en-US",
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex flex-wrap gap-2">
                              <Button asChild size="sm" variant="secondary">
                                <Link href={`/my-listings/${property.id}/edit`}>
                                  <Edit className="size-4" />
                                  {text.edit}
                                </Link>
                              </Button>
                              {canDelete ? (
                                <DeletePropertyButton
                                  locale={locale}
                                  propertyId={property.id}
                                />
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
