import {
  Building2,
  ImageIcon,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { UserRoleBadge, UserStatusBadge } from "@/components/admin/UserBadges";
import { PropertyStatusBadge } from "@/components/property/PropertyStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, type Locale } from "@/i18n/routing";
import { getAdminUserDetail } from "@/lib/admin-users";
import { requireRole } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: {
    title: "ملف المستخدم",
    account: "الحساب",
    controls: "إجراءات الحساب",
    listings: "آخر الإعلانات",
    sentInquiries: "الاستفسارات المرسلة",
    receivedInquiries: "الاستفسارات الواردة",
    audit: "سجل النشاط",
    noListings: "لا توجد إعلانات لهذا المستخدم.",
    noSent: "لا توجد استفسارات مرسلة.",
    noReceived: "لا توجد استفسارات واردة.",
    noAudit: "لا توجد أحداث مسجلة.",
    email: "البريد الإلكتروني",
    phone: "الجوال",
    joined: "تاريخ الانضمام",
    lastLogin: "آخر دخول",
    sessions: "الجلسات",
    properties: "الإعلانات",
    inquiries: "الاستفسارات",
    view: "عرض",
    never: "لم يسجل الدخول",
    allUsers: "كل المستخدمين",
  },
  en: {
    title: "User Profile",
    account: "Account",
    controls: "Account controls",
    listings: "Recent listings",
    sentInquiries: "Sent inquiries",
    receivedInquiries: "Received inquiries",
    audit: "Activity log",
    noListings: "This user has no listings.",
    noSent: "No sent inquiries.",
    noReceived: "No received inquiries.",
    noAudit: "No activity has been recorded.",
    email: "Email",
    phone: "Phone",
    joined: "Joined",
    lastLogin: "Last login",
    sessions: "Sessions",
    properties: "Listings",
    inquiries: "Inquiries",
    view: "View",
    never: "Never logged in",
    allUsers: "All users",
  },
} as const;

function personName(user: {
  email: string;
  profile: { firstName: string | null; lastName: string | null };
}) {
  return (
    [user.profile.firstName, user.profile.lastName].filter(Boolean).join(" ") ||
    user.email
  );
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) return copy[locale].never;

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPrice(value: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function localizeName(
  value: { nameAr: string; nameEn: string },
  locale: Locale,
) {
  return locale === "ar" ? value.nameAr : value.nameEn;
}

export async function generateMetadata({
  params: { id, locale },
}: {
  params: { id: string; locale: Locale };
}): Promise<Metadata> {
  const user = await getAdminUserDetail(id);

  return {
    title: user
      ? `${personName(user)} | ${copy[locale].title}`
      : copy[locale].title,
  };
}

export default async function AdminUserDetailPage({
  params: { id, locale },
}: {
  params: { id: string; locale: Locale };
}) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const text = copy[locale];
  const user = await getAdminUserDetail(id);

  if (!user) {
    notFound();
  }

  const name = personName(user);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <UserRoleBadge locale={locale} role={user.role} />
            <UserStatusBadge locale={locale} status={user.status} />
          </div>
          <h2 className="text-3xl font-bold tracking-normal text-foreground">
            {name}
          </h2>
          <div className="flex flex-wrap gap-3 text-sm font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Mail className="size-4 text-primary" />
              {user.email}
            </span>
            {user.phone ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-4 text-primary" />
                {user.phone}
              </span>
            ) : null}
          </div>
        </div>
        <Button asChild variant="secondary">
          <Link href="/admin/users">{text.allUsers}</Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <main className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <Building2 className="size-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {text.properties}
                  </p>
                  <p className="text-2xl font-bold">{user.counts.properties}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <MessageSquare className="size-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {text.inquiries}
                  </p>
                  <p className="text-2xl font-bold">
                    {user.counts.sentInquiries + user.receivedInquiries.length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <ShieldCheck className="size-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {text.sessions}
                  </p>
                  <p className="text-2xl font-bold">{user.counts.sessions}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{text.listings}</CardTitle>
            </CardHeader>
            <CardContent>
              {user.properties.length > 0 ? (
                <div className="divide-y divide-border">
                  {user.properties.map((property) => {
                    const title =
                      locale === "ar" || !property.titleEn
                        ? property.titleAr
                        : property.titleEn;

                    return (
                      <div
                        className="grid gap-3 py-4 md:grid-cols-[72px_1fr_auto] md:items-center"
                        key={property.id}
                      >
                        <span className="relative grid size-[72px] place-items-center overflow-hidden rounded-md bg-muted text-muted-foreground">
                          {property.primaryImageUrl ? (
                            <Image
                              alt={title}
                              className="object-cover"
                              fill
                              sizes="72px"
                              src={property.primaryImageUrl}
                            />
                          ) : (
                            <ImageIcon className="size-5" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-foreground">
                            {title}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span>{localizeName(property.city, locale)}</span>
                            <span>·</span>
                            <span>
                              {formatPrice(
                                property.price,
                                property.currency,
                                locale,
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:justify-end">
                          <PropertyStatusBadge
                            locale={locale}
                            status={property.status}
                          />
                          <Button asChild size="sm" variant="secondary">
                            <Link href={`/admin/properties/${property.id}`}>
                              {text.view}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {text.noListings}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{text.sentInquiries}</CardTitle>
              </CardHeader>
              <CardContent>
                {user.sentInquiries.length > 0 ? (
                  <div className="divide-y divide-border">
                    {user.sentInquiries.map((inquiry) => (
                      <div className="grid gap-2 py-4" key={inquiry.id}>
                        <div className="font-bold text-foreground">
                          {inquiry.property.titleAr}
                        </div>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {inquiry.message}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(inquiry.createdAt, locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{text.noSent}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{text.receivedInquiries}</CardTitle>
              </CardHeader>
              <CardContent>
                {user.receivedInquiries.length > 0 ? (
                  <div className="divide-y divide-border">
                    {user.receivedInquiries.map((inquiry) => (
                      <div className="grid gap-2 py-4" key={inquiry.id}>
                        <div className="font-bold text-foreground">
                          {inquiry.property.titleAr}
                        </div>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {inquiry.message}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(inquiry.createdAt, locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {text.noReceived}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{text.audit}</CardTitle>
            </CardHeader>
            <CardContent>
              {user.auditLogs.length > 0 ? (
                <div className="divide-y divide-border">
                  {user.auditLogs.map((log) => (
                    <div className="grid gap-1 py-4" key={log.id}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="font-bold text-foreground">
                          {log.action}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.createdAt, locale)}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {log.actor
                          ? [log.actor.firstName, log.actor.lastName]
                              .filter(Boolean)
                              .join(" ") || log.actor.email
                          : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{text.noAudit}</p>
              )}
            </CardContent>
          </Card>
        </main>

        <aside className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{text.controls}</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminUserActions
                currentAdminRole={session.user.role}
                currentUserId={session.user.id}
                locale={locale}
                role={user.role}
                status={user.status}
                userId={user.id}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{text.account}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <div className="grid gap-1">
                <span className="text-muted-foreground">{text.email}</span>
                <span className="font-bold">{user.email}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground">{text.phone}</span>
                <span className="font-bold">{user.phone ?? "-"}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground">{text.joined}</span>
                <span className="font-bold">
                  {formatDate(user.createdAt, locale)}
                </span>
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground">{text.lastLogin}</span>
                <span className="font-bold">
                  {formatDate(user.lastLoginAt, locale)}
                </span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
