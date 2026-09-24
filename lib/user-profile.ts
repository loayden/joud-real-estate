import { prisma } from "@/lib/prisma";

async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
          bio: true,
          whatsapp: true,
          preferredLocale: true,
          cityId: true,
          city: {
            select: {
              id: true,
              regionId: true,
              nameAr: true,
              nameEn: true,
              slug: true,
            },
          },
        },
      },
    },
  });
}

export async function getSafeUserProfile(userId: string) {
  const user = await getUserProfile(userId);

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    firstName: user.profile?.firstName ?? "",
    lastName: user.profile?.lastName ?? "",
    avatarUrl: user.profile?.avatarUrl ?? null,
    bio: user.profile?.bio ?? "",
    whatsapp: user.profile?.whatsapp ?? "",
    preferredLocale: user.profile?.preferredLocale ?? "ar",
    cityId: user.profile?.cityId ?? "",
    city: user.profile?.city
      ? {
          id: user.profile.city.id,
          regionId: user.profile.city.regionId,
          nameAr: user.profile.city.nameAr,
          nameEn: user.profile.city.nameEn,
          slug: user.profile.city.slug,
        }
      : null,
  };
}

export type SafeUserProfile = NonNullable<
  Awaited<ReturnType<typeof getSafeUserProfile>>
>;
