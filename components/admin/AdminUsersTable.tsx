import { ImageIcon, Mail, Phone } from "lucide-react";
import Image from "next/image";

import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { UserRoleBadge, UserStatusBadge } from "@/components/admin/UserBadges";
import { Link, type Locale } from "@/i18n/routing";
import type { AdminUserListItem } from "@/lib/admin-users";
import type { UserRole } from "@prisma/client";

const copy = {
  ar: {
    user: "المستخدم",
    contact: "التواصل",
    role: "الدور",
    status: "الحالة",
    listings: "الإعلانات",
    sessions: "الجلسات",
    joined: "تاريخ الانضمام",
    lastLogin: "آخر دخول",
    actions: "الإجراءات",
    never: "لم يسجل الدخول",
    empty: "لا يوجد مستخدمون مطابقون للفلاتر الحالية.",
  },
  en: {
    user: "User",
    contact: "Contact",
    role: "Role",
    status: "Status",
    listings: "Listings",
    sessions: "Sessions",
    joined: "Joined",
    lastLogin: "Last login",
    actions: "Actions",
    never: "Never logged in",
    empty: "No users match the current filters.",
  },
} as const;

function personName(user: AdminUserListItem) {
  return (
    [user.profile.firstName, user.profile.lastName].filter(Boolean).join(" ") ||
    user.email
  );
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) return copy[locale].never;

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function AdminUsersTable({
  users,
  locale,
  currentUserId,
  currentAdminRole,
}: {
  users: AdminUserListItem[];
  locale: Locale;
  currentUserId: string;
  currentAdminRole: UserRole;
}) {
  const text = copy[locale];

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[1060px] text-sm">
        <thead className="bg-muted/60 text-xs font-bold text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-start">{text.user}</th>
            <th className="px-4 py-3 text-start">{text.contact}</th>
            <th className="px-4 py-3 text-start">{text.role}</th>
            <th className="px-4 py-3 text-start">{text.status}</th>
            <th className="px-4 py-3 text-start">{text.listings}</th>
            <th className="px-4 py-3 text-start">{text.sessions}</th>
            <th className="px-4 py-3 text-start">{text.joined}</th>
            <th className="px-4 py-3 text-start">{text.lastLogin}</th>
            <th className="px-4 py-3 text-end">{text.actions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {users.length > 0 ? (
            users.map((user) => {
              const name = personName(user);

              return (
                <tr className="align-top" key={user.id}>
                  <td className="px-4 py-4">
                    <Link
                      className="grid min-w-60 grid-cols-[44px_1fr] items-center gap-3"
                      href={`/admin/users/${user.id}`}
                    >
                      <span className="relative grid size-11 place-items-center overflow-hidden rounded-full bg-muted text-muted-foreground">
                        {user.profile.avatarUrl ? (
                          <Image
                            alt={name}
                            className="object-cover"
                            fill
                            sizes="44px"
                            src={user.profile.avatarUrl}
                          />
                        ) : (
                          <ImageIcon className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-foreground">
                          {name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {user.id}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-foreground">
                      <Mail className="size-4 text-primary" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.phone ? (
                      <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                        <Phone className="size-4 text-primary" />
                        <span>{user.phone}</span>
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <UserRoleBadge locale={locale} role={user.role} />
                  </td>
                  <td className="px-4 py-4">
                    <UserStatusBadge locale={locale} status={user.status} />
                  </td>
                  <td className="px-4 py-4 font-bold">
                    {user.counts.properties}
                  </td>
                  <td className="px-4 py-4 font-bold">
                    {user.counts.sessions}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {formatDate(user.createdAt, locale)}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {formatDate(user.lastLoginAt, locale)}
                  </td>
                  <td className="px-4 py-4 text-end">
                    <AdminUserActions
                      compact
                      currentAdminRole={currentAdminRole}
                      currentUserId={currentUserId}
                      locale={locale}
                      role={user.role}
                      status={user.status}
                      userId={user.id}
                    />
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                className="px-4 py-12 text-center text-muted-foreground"
                colSpan={9}
              >
                {text.empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
