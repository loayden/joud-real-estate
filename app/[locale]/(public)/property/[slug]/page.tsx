import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, MapPin, Star } from "lucide-react";

import { FavoriteButton } from "@/components/property/FavoriteButton";
import { MortgageCalculator } from "@/components/property/MortgageCalculator";
import { NeighbourhoodScore } from "@/components/property/NeighbourhoodScore";
import { PriceAlertButton } from "@/components/property/PriceAlertButton";
import { PriceHistoryChart } from "@/components/property/PriceHistoryChart";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyContactPanel } from "@/components/property/PropertyContactPanel";
import { PropertyEstimate } from "@/components/property/PropertyEstimate";
import { PropertyImageGallery } from "@/components/property/PropertyImageGallery";
import { PropertySpecs } from "@/components/property/PropertySpecs";
import { PropertyViewTracker } from "@/components/property/PropertyViewTracker";
import { ReportButton } from "@/components/property/ReportButton";
import { ReviewsList } from "@/components/property/ReviewsList";
import { SellerScoreBadge } from "@/components/property/SellerScoreBadge";
import { ShareButton } from "@/components/property/ShareButton";
import { VirtualTourEmbed } from "@/components/property/VirtualTourEmbed";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getFavoritePropertyIds } from "@/lib/favorites";
import {
  getCachedPublicPropertyBySlug,
  getCachedSimilarProperties,
} from "@/lib/public-properties";
import { absoluteUrl, alternateLanguages, getSeoAppUrl } from "@/lib/seo";

export const revalidate = 3600;

const copy = {
  ar: {
    sale: "للبيع",
    rent: "للإيجار",
    featured: "عقار مميز",
    negotiable: "السعر قابل للتفاوض",
    description: "وصف العقار",
    specs: "تفاصيل العقار",
    amenities: "المرافق والمميزات",
    similar: "عقارات مشابهة",
    location: "الموقع",
    published: "منشور",
    noAmenities: "لم يتم تحديد مرافق إضافية.",
    priceBox: "سعر العقار",
    viewLive: "صفحة عقار مباشرة",
    trust: "الثقة والسمعة",
    owner: "مالك العقار",
    reviews: "تقييم",
    propertyType: "نوع العقار",
    listingTypeLabel: "نوع الإعلان",
    streetWidth: "عرض الشارع",
  },
  en: {
    sale: "For sale",
    rent: "For rent",
    featured: "Featured property",
    negotiable: "Price negotiable",
    description: "Property description",
    specs: "Property details",
    amenities: "Amenities",
    similar: "Similar properties",
    location: "Location",
    published: "Published",
    noAmenities: "No additional amenities were selected.",
    priceBox: "Property price",
    viewLive: "Live property page",
    trust: "Trust and reputation",
    owner: "Property owner",
    reviews: "reviews",
    propertyType: "Property type",
    listingTypeLabel: "Listing type",
    streetWidth: "Street width",
  },
} as const;

function localizeName(
  value: { nameAr: string; nameEn: string } | null | undefined,
  locale: Locale,
) {
  if (!value) return "";
  return locale === "ar" ? value.nameAr : value.nameEn;
}

function localizePropertyTitle(
  property: { titleAr: string; titleEn: string | null },
  locale: Locale,
) {
  return locale === "ar" || !property.titleEn
    ? property.titleAr
    : property.titleEn;
}

function localizePropertyDescription(
  property: { descriptionAr: string; descriptionEn: string | null },
  locale: Locale,
) {
  return locale === "ar" || !property.descriptionEn
    ? property.descriptionAr
    : property.descriptionEn;
}

function formatCurrency(value: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

async function getProperty(slug: string) {
  return getCachedPublicPropertyBySlug(slug);
}

async function getSimilarProperties(property: {
  id: string;
  categoryId: string;
  cityId: string;
}) {
  return getCachedSimilarProperties({
    propertyId: property.id,
    categoryId: property.categoryId,
    cityId: property.cityId,
  });
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata> {
  const property = await getProperty(slug);

  if (!property) {
    return {
      title: locale === "ar" ? "العقار غير موجود" : "Property not found",
    };
  }

  const title = localizePropertyTitle(property, locale);
  const description = localizePropertyDescription(property, locale).slice(
    0,
    160,
  );
  const image =
    property.images[0]?.url ??
    property.images[0]?.thumbnailUrl ??
    "/images/property-placeholder.jpg";
  const path = `/property/${property.slug}`;
  const url = `${getSeoAppUrl()}/${locale}${path}`;

  return {
    title: `${title} - ${localizeName(property.city, locale)}`,
    description,
    alternates: {
      canonical: url,
      languages: alternateLanguages(path),
    },
    openGraph: {
      title,
      description,
      images: [
        { url: absoluteUrl(image), width: 1200, height: 630, alt: title },
      ],
      locale: locale === "ar" ? "ar_EG" : "en_US",
      siteName: locale === "ar" ? "جود العقارية" : "Joud Real Estate",
      type: "website",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(image)],
    },
  };
}

export default async function PropertyDetailPage({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}) {
  const property = await getProperty(slug);

  if (!property) {
    notFound();
  }

  const text = copy[locale];
  const title = localizePropertyTitle(property, locale);
  const description = localizePropertyDescription(property, locale);
  const price = formatCurrency(property.price, property.currency, locale);
  const propertyUrl = `${getSeoAppUrl()}/${locale}/property/${property.slug}`;
  const profile = property.user.profile;
  const ownerName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    text.owner;
  const images = property.images.map((image) => ({
    id: image.id,
    isPrimary: image.isPrimary,
    thumbnailUrl: image.thumbnailUrl,
    url: image.url,
  }));
  const amenities = property.amenities.map((item) => item.amenity);
  const [similar, session] = await Promise.all([
    getSimilarProperties(property),
    auth(),
  ]);
  const favoriteIds = await getFavoritePropertyIds(session?.user?.id, [
    property.id,
    ...similar.map((item) => item.id),
  ]);
  const location = [
    localizeName(property.neighborhood, locale),
    localizeName(property.city, locale),
    localizeName(property.region, locale),
  ]
    .filter(Boolean)
    .join(locale === "ar" ? "، " : ", ");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${propertyUrl}#listing`,
    mainEntityOfPage: propertyUrl,
    identifier: property.id,
    name: title,
    description,
    url: propertyUrl,
    datePosted: property.publishedAt ?? property.createdAt,
    dateModified: property.updatedAt,
    image: images.length
      ? images.map((image) => absoluteUrl(image.url))
      : [absoluteUrl("/images/property-placeholder.jpg")],
    category: localizeName(property.category, locale),
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      price: property.price.toString(),
      priceCurrency: property.currency,
      url: propertyUrl,
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "EG",
      addressLocality: localizeName(property.city, locale),
      addressRegion: localizeName(property.region, locale),
      streetAddress: property.address ?? undefined,
    },
    geo:
      property.latitude && property.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: property.latitude,
            longitude: property.longitude,
          }
        : undefined,
    numberOfBathroomsTotal: property.bathrooms ?? undefined,
    numberOfBedrooms: property.bedrooms ?? undefined,
    floorSize: {
      "@type": "QuantitativeValue",
      unitCode: "MTK",
      value: property.area,
    },
    additionalProperty: [
      property.type
        ? {
            "@type": "PropertyValue",
            name: text.propertyType,
            value: localizeName(property.type, locale),
          }
        : undefined,
      property.listingType
        ? {
            "@type": "PropertyValue",
            name: text.listingTypeLabel,
            value: property.listingType === "SALE" ? text.sale : text.rent,
          }
        : undefined,
      property.streetWidth
        ? {
            "@type": "PropertyValue",
            name: text.streetWidth,
            value: property.streetWidth,
            unitText: "m",
          }
        : undefined,
    ].filter(Boolean),
  };

  return (
    <>
      <PropertyViewTracker
        propertyId={property.id}
        property={{
          id: property.id,
          slug: property.slug,
          titleAr: property.titleAr,
          titleEn: property.titleEn,
          price: Number(property.price),
          currency: property.currency,
          listingType: property.listingType,
          primaryImageUrl: property.images[0]?.url ?? null,
          city: property.city,
          region: property.region,
          category: property.category,
          type: property.type,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area: property.area,
          status: property.status,
          isFeatured: property.isFeatured,
          publishedAt: property.publishedAt?.toISOString() ?? null,
          createdAt: property.createdAt.toISOString(),
          updatedAt: property.updatedAt.toISOString(),
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
      <article className="bg-background">
        {/* Header */}
        <section className="border-b border-border">
          <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-primary px-2.5 py-1 text-caption font-semibold text-primary-foreground">
                {property.listingType === "SALE" ? text.sale : text.rent}
              </span>
              {property.isFeatured ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-gold/10 px-2.5 py-1 text-caption font-semibold text-gold">
                  <Star className="size-3" />
                  {text.featured}
                </span>
              ) : null}
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="min-w-0">
                <h1 className="max-w-4xl text-h1 text-foreground">{title}</h1>
                <p className="mt-2 flex items-center gap-1.5 text-body text-muted-foreground">
                  <MapPin className="size-4 shrink-0 text-muted-foreground/50" />
                  <span>{location}</span>
                </p>
              </div>
              <div className="text-h2 font-bold text-foreground">{price}</div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
          <div className="grid gap-10">
            <PropertyImageGallery images={images} title={title} />
            <VirtualTourEmbed
              locale={locale}
              tour360ImageUrls={property.tour360ImageUrls}
              virtualTourUrl={property.virtualTourUrl}
            />

            {/* Specs */}
            <section className="grid gap-4">
              <h2 className="text-h3 text-foreground">{text.specs}</h2>
              <PropertySpecs locale={locale} property={property} />
            </section>

            {/* Description */}
            <section className="grid gap-4">
              <h2 className="text-h3 text-foreground">{text.description}</h2>
              <div className="max-w-3xl whitespace-pre-line text-body leading-relaxed text-muted-foreground">
                {description}
              </div>
            </section>

            {/* Amenities */}
            <section className="grid gap-4">
              <h2 className="text-h3 text-foreground">{text.amenities}</h2>
              {amenities.length > 0 ? (
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {amenities.map((amenity) => (
                    <div
                      className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-4 py-3 text-body"
                      key={amenity.id}
                    >
                      <CheckCircle2 className="size-4 shrink-0 text-success" />
                      {localizeName(amenity, locale)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body text-muted-foreground">
                  {text.noAmenities}
                </p>
              )}
            </section>

            <div className="grid gap-5 xl:grid-cols-2">
              <NeighbourhoodScore locale={locale} slug={property.slug} />
              <PropertyEstimate locale={locale} propertyId={property.id} />
            </div>

            <PriceHistoryChart locale={locale} propertyId={property.id} />

            <MortgageCalculator defaultPrice={property.price} locale={locale} />

            <ReviewsList
              canRespond={session?.user?.id === property.user.id}
              locale={locale}
              propertyId={property.id}
            />

            {similar.length > 0 ? (
              <section className="grid gap-5">
                <h2 className="text-h3 text-foreground">{text.similar}</h2>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {similar.map((item) => (
                    <PropertyCard
                      key={item.id}
                      locale={locale}
                      property={item}
                      initialFavorited={favoriteIds.includes(item.id)}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* Sidebar */}
          <aside className="grid h-fit gap-4 lg:sticky lg:top-24">
            <Card>
              <CardContent className="grid gap-4 p-5">
                <div>
                  <p className="text-small font-medium text-muted-foreground">
                    {text.priceBox}
                  </p>
                  <p className="mt-1 text-h2 font-bold text-foreground">
                    {price}
                  </p>
                  {property.avgRating ? (
                    <div className="mt-2 flex items-center gap-1.5 text-small text-muted-foreground">
                      <Star className="size-3.5 fill-current text-gold-700" />
                      {property.avgRating.toFixed(1)} · {property.ratingCount}{" "}
                      {text.reviews}
                    </div>
                  ) : null}
                  {property.priceNegotiable ? (
                    <p className="mt-2 text-small font-medium text-gold-700">
                      {text.negotiable}
                    </p>
                  ) : null}
                </div>
                <ShareButton locale={locale} title={title} url={propertyUrl} />
                <FavoriteButton
                  initialFavorited={favoriteIds.includes(property.id)}
                  locale={locale}
                  propertyId={property.id}
                  withLabel
                />
                <PriceAlertButton locale={locale} propertyId={property.id} />
                <ReportButton locale={locale} propertyId={property.id} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="grid gap-3 p-5">
                <p className="text-small font-medium text-muted-foreground">
                  {text.trust}
                </p>
                <SellerScoreBadge
                  count={property.user.sellerRatingCount}
                  locale={locale}
                  score={property.user.sellerScore}
                />
              </CardContent>
            </Card>
            <PropertyContactPanel
              locale={locale}
              owner={{
                avatarUrl: profile?.avatarUrl ?? null,
                name: ownerName,
                phone: property.user.phone,
                whatsapp: profile?.whatsapp ?? null,
              }}
              propertyId={property.id}
              propertyTitle={title}
              propertyUrl={propertyUrl}
            />
          </aside>
        </div>
      </article>
    </>
  );
}
