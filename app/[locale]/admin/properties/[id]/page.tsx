import {
  CalendarDays,
  Eye,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminPropertyActions } from "@/components/admin/AdminPropertyActions";
import { PropertyImageGallery } from "@/components/property/PropertyImageGallery";
import { PropertySpecs } from "@/components/property/PropertySpecs";
import { PropertyStatusBadge } from "@/components/property/PropertyStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, type Locale } from "@/i18n/routing";
import { getAdminPropertyForReview } from "@/lib/admin-properties";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: {
    title: "مراجعة العقار",
    moderation: "إجراءات المراجعة",
    owner: "المالك",
    details: "تفاصيل العقار",
    description: "الوصف",
    amenities: "المرافق",
    audit: "سجل الإجراءات",
    noAudit: "لا توجد إجراءات مسجلة على هذا العقار بعد.",
    rejectionReason: "سبب الرفض الحالي",
    viewPublic: "عرض الصفحة العامة",
    edit: "تعديل العقار",
    createdAt: "أنشئ في",
    updatedAt: "آخر تحديث",
    views: "المشاهدات",
    inquiries: "الاستفسارات",
    noAmenities: "لا توجد مرافق محددة.",
    featured: "مميز",
    separator: "، ",
  },
  en: {
    title: "Property Review",
    moderation: "Review Actions",
    owner: "Owner",
    details: "Property Details",
    description: "Description",
    amenities: "Amenities",
    audit: "Activity Log",
    noAudit: "No actions have been recorded for this property yet.",
    rejectionReason: "Current rejection reason",
    viewPublic: "View public page",
    edit: "Edit property",
    createdAt: "Created",
    updatedAt: "Updated",
    views: "Views",
    inquiries: "Inquiries",
    noAmenities: "No amenities selected.",
    featured: "Featured",
    separator: ", ",
  },
} as const;

function localizeName(
  value: { nameAr: string; nameEn: string } | null | undefined,
  locale: Locale,
) {
  if (!value) return "-";
  return locale === "ar" ? value.nameAr : value.nameEn;
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) return "-";

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function personName(person: {
  email?: string;
  firstName: string | null;
  lastName: string | null;
}) {
  return (
    [person.firstName, person.lastName].filter(Boolean).join(" ") ||
    person.email ||
    "-"
  );
}

export async function generateMetadata({
  params: { id, locale },
}: {
  params: { id: string; locale: Locale };
}): Promise<Metadata> {
  const review = await getAdminPropertyForReview(id);

  return {
    title: review
      ? `${review.property.titleAr} | ${copy[locale].title}`
      : copy[locale].title,
  };
}

export default async function AdminPropertyReviewPage({
  params: { id, locale },
}: {
  params: { id: string; locale: Locale };
}) {
  const text = copy[locale];
  const review = await getAdminPropertyForReview(id);

  if (!review) {
    notFound();
  }

  const { property, auditLogs } = review;
  const title =
    locale === "ar" || !property.titleEn ? property.titleAr : property.titleEn;
  const description =
    locale === "ar" || !property.descriptionEn
      ? property.descriptionAr
      : property.descriptionEn;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <PropertyStatusBadge locale={locale} status={property.status} />
            {property.isFeatured ? (
              <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-bold text-gold-foreground">
                {text.featured}
              </span>
            ) : null}
          </div>
          <h2 className="max-w-4xl text-3xl font-bold tracking-normal text-foreground">
            {title}
          </h2>
          <div className="flex flex-wrap gap-3 text-sm font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-4 text-gold-700" />
              {localizeName(property.city, locale)}
              {text.separator}
              {localizeName(property.region, locale)}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-4 text-primary" />
              {text.createdAt}: {formatDate(property.createdAt, locale)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {property.status === "APPROVED" ? (
            <Button asChild variant="secondary">
              <Link href={`/property/${property.slug}`}>
                <Eye className="size-4" />
                {text.viewPublic}
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="secondary">
            <Link href={`/admin/properties/${property.id}/edit`}>
              {text.edit}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <PropertyImageGallery images={property.images} title={title} />

          <Card>
            <CardHeader>
              <CardTitle>{text.details}</CardTitle>
            </CardHeader>
            <CardContent>
              <PropertySpecs property={property} locale={locale} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{text.description}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line leading-8 text-muted-foreground">
                {description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{text.amenities}</CardTitle>
            </CardHeader>
            <CardContent>
              {property.amenities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map(({ amenity }) => (
                    <span
                      className="rounded-md border border-border bg-muted px-3 py-2 text-sm font-bold"
                      key={amenity.id}
                    >
                      {localizeName(amenity, locale)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {text.noAmenities}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{text.audit}</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length > 0 ? (
                <div className="divide-y divide-border">
                  {auditLogs.map((log) => (
                    <div className="grid gap-1 py-4" key={log.id}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="font-bold text-foreground">
                          {log.action}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.createdAt, locale)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {personName({
                          email: log.actor?.email,
                          firstName: log.actor?.firstName ?? null,
                          lastName: log.actor?.lastName ?? null,
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{text.noAudit}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{text.moderation}</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminPropertyActions
                isFeatured={property.isFeatured}
                locale={locale}
                propertyId={property.id}
                status={property.status}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{text.owner}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <User className="size-4 text-primary" />
                {personName(property.owner)}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4 text-primary" />
                {property.owner.email}
              </div>
              {property.owner.phone ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4 text-primary" />
                  {property.owner.phone}
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-2 pt-3">
                <div className="rounded-md bg-muted p-3">
                  <div className="text-xs text-muted-foreground">
                    {text.views}
                  </div>
                  <div className="text-xl font-bold">{property.viewCount}</div>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <div className="text-xs text-muted-foreground">
                    {text.inquiries}
                  </div>
                  <div className="text-xl font-bold">
                    {property.inquiryCount}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {property.rejectionReason ? (
            <Card>
              <CardHeader>
                <CardTitle>{text.rejectionReason}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {property.rejectionReason}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="grid gap-3 pt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                {text.updatedAt}: {formatDate(property.updatedAt, locale)}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
