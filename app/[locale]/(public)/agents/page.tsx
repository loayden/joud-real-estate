import { Users, Star, MapPin, Building2 } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Link, type Locale } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, alternateLanguages, localizedUrl } from "@/lib/seo";

const copy = {
  ar: {
    title: "الوسطاء العقاريون",
    description: "تعرّف على أفضل الوسطاء العقاريين المعتمدين في مصر",
    viewProfile: "عرض الملف",
    listings: "إعلان",
    verified: "موثق",
    noAgents: "لا يوجد وسطاء معتمدون حالياً.",
    backToHome: "الرئيسية",
  },
  en: {
    title: "Real Estate Agents",
    description: "Discover the top verified real estate agents in Egypt",
    viewProfile: "View Profile",
    listings: "listings",
    verified: "Verified",
    noAgents: "No verified agents yet.",
    backToHome: "Home",
  },
} as const;

export const revalidate = 300;

async function getAgents() {
  const agents = await prisma.user.findMany({
    where: {
      role: "AGENT",
      status: "ACTIVE",
    },
    select: {
      id: true,
      sellerScore: true,
      sellerRatingCount: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
          bio: true,
          city: {
            select: { nameAr: true, nameEn: true, slug: true },
          },
        },
      },
      _count: {
        select: {
          properties: { where: { status: "APPROVED" } },
        },
      },
    },
    orderBy: [{ sellerScore: "desc" }, { sellerRatingCount: "desc" }],
    take: 24,
  });

  return agents.filter((a) => a.profile);
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const isArabic = locale === "ar";
  const title = isArabic ? "الوسطاء العقاريون" : "Real Estate Agents";
  const description = isArabic
    ? "تعرّف على أفضل الوسطاء العقاريين المعتمدين في مصر"
    : "Discover the top verified real estate agents in Egypt";
  const url = localizedUrl(locale, "/agents");

  return {
    title,
    description,
    alternates: { canonical: url, languages: alternateLanguages("/agents") },
    openGraph: {
      title,
      description,
      images: [
        {
          url: absoluteUrl("/images/joud-hero.jpg"),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: isArabic ? "ar_EG" : "en_US",
      type: "website",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/images/joud-hero.jpg")],
    },
    robots: { follow: true, index: true },
  };
}

function formatScore(score: number | null, locale: Locale) {
  if (!score) return "—";
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    maximumFractionDigits: 1,
  }).format(score);
}

export default async function AgentsPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const text = copy[locale];
  const agents = await getAgents();

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-muted/35">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-primary-50 text-primary">
              <Users className="size-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-normal md:text-4xl">
                {text.title}
              </h1>
              <p className="text-muted-foreground">{text.description}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
        {agents.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {agents.map((agent) => {
              const name = `${agent.profile!.firstName} ${agent.profile!.lastName}`;
              const cityName = agent.profile!.city
                ? locale === "ar"
                  ? agent.profile!.city.nameAr
                  : agent.profile!.city.nameEn
                : null;

              return (
                <div
                  key={agent.id}
                  className="group rounded-lg border border-border bg-card p-5 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-12 place-items-center rounded-full bg-primary-50 text-lg font-bold text-primary">
                      {agent.profile!.avatarUrl ? (
                        <Image
                          alt={name}
                          className="size-12 rounded-full object-cover"
                          height={48}
                          src={agent.profile!.avatarUrl}
                          width={48}
                        />
                      ) : (
                        name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{name}</p>
                      {cityName && (
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="size-3" />
                          {cityName}
                        </p>
                      )}
                    </div>
                  </div>

                  {agent.profile!.bio && (
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {agent.profile!.bio}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="size-4 text-gold-700" />
                      <span className="font-bold">
                        {formatScore(agent.sellerScore, locale)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Building2 className="size-4" />
                      <span>
                        {agent._count.properties} {text.listings}
                      </span>
                    </div>
                    {agent.sellerScore && agent.sellerScore >= 4 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                        ✓ {text.verified}
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <Button asChild className="w-full" variant="secondary">
                      <Link href={`/properties?userId=${agent.id}`}>
                        {text.viewProfile}
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid min-h-60 place-items-center rounded-lg border border-dashed border-border bg-background p-8 text-center">
            <div className="grid max-w-md justify-items-center gap-3">
              <Users className="size-11 text-muted-foreground" />
              <h2 className="text-xl font-bold">{text.noAgents}</h2>
              <Button asChild variant="secondary">
                <Link href="/">{text.backToHome}</Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
