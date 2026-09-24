import {
  Building2,
  Globe,
  MessageCircle,
  Camera,
  Briefcase,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link, type Locale } from "@/i18n/routing";
import { Separator } from "@/components/ui/separator";

const popularAreas = [
  { slug: "new-cairo", nameAr: "القاهرة الجديدة", nameEn: "New Cairo" },
  { slug: "sheikh-zayed", nameAr: "الشيخ زايد", nameEn: "Sheikh Zayed" },
  { slug: "6th-october", nameAr: "6 أكتوبر", nameEn: "6th October" },
  {
    slug: "new-administrative-capital",
    nameAr: "العاصمة الإدارية",
    nameEn: "New Capital",
  },
  { slug: "heliopolis", nameAr: "مصر الجديدة", nameEn: "Heliopolis" },
  { slug: "maadi", nameAr: "المعادي", nameEn: "Maadi" },
];

export async function Footer({ locale }: { locale: Locale }) {
  const site = await getTranslations("site");
  const nav = await getTranslations("nav");

  return (
    <footer className="bg-foreground text-white/80">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Brand */}
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5 text-lg font-bold text-white">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-white">
              <Building2 className="size-[18px]" />
            </span>
            {site("name")}
          </div>
          <p className="mt-4 text-body text-white/60">{site("tagline")}</p>
          <div className="mt-5 flex gap-2.5">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/8 transition-colors-fast grid size-9 place-items-center rounded-lg text-white/60 hover:bg-white/15 hover:text-white"
              aria-label="Facebook"
            >
              <Globe className="size-4" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/8 transition-colors-fast grid size-9 place-items-center rounded-lg text-white/60 hover:bg-white/15 hover:text-white"
              aria-label="Twitter"
            >
              <MessageCircle className="size-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/8 transition-colors-fast grid size-9 place-items-center rounded-lg text-white/60 hover:bg-white/15 hover:text-white"
              aria-label="Instagram"
            >
              <Camera className="size-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/8 transition-colors-fast grid size-9 place-items-center rounded-lg text-white/60 hover:bg-white/15 hover:text-white"
              aria-label="LinkedIn"
            >
              <Briefcase className="size-4" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="mb-4 text-small font-semibold uppercase tracking-widest text-white/40">
            {locale === "ar" ? "روابط سريعة" : "Quick Links"}
          </h3>
          <nav className="grid gap-2">
            <Link
              className="transition-colors-fast text-body text-white/60 hover:text-white"
              href="/"
            >
              {nav("home")}
            </Link>
            <Link
              className="transition-colors-fast text-body text-white/60 hover:text-white"
              href="/properties"
            >
              {nav("properties")}
            </Link>
            <Link
              className="transition-colors-fast text-body text-white/60 hover:text-white"
              href="/properties?listingType=SALE"
            >
              {locale === "ar" ? "عقارات للبيع" : "Properties for Sale"}
            </Link>
            <Link
              className="transition-colors-fast text-body text-white/60 hover:text-white"
              href="/properties?listingType=RENT"
            >
              {locale === "ar" ? "عقارات للإيجار" : "Properties for Rent"}
            </Link>
            <Link
              className="transition-colors-fast text-body text-white/60 hover:text-white"
              href="/search"
            >
              {nav("search")}
            </Link>
            <Link
              className="transition-colors-fast text-body text-white/60 hover:text-white"
              href="/agents"
            >
              {locale === "ar" ? "الوسطاء" : "Agents"}
            </Link>
            <Link
              className="transition-colors-fast text-body text-white/60 hover:text-white"
              href="/compounds"
            >
              {locale === "ar" ? "الكمبوندات" : "Compounds"}
            </Link>
            <Link
              className="transition-colors-fast text-body text-white/60 hover:text-white"
              href="/developers"
            >
              {locale === "ar" ? "المطورون" : "Developers"}
            </Link>
            <Link
              className="transition-colors-fast text-body text-white/60 hover:text-white"
              href="/mortgage"
            >
              {locale === "ar" ? "حاسبة التمويل" : "Mortgage Calculator"}
            </Link>
            <Link
              className="transition-colors-fast text-body text-white/60 hover:text-white"
              href="/about"
            >
              {nav("about")}
            </Link>
          </nav>
        </div>

        {/* Popular Areas */}
        <div>
          <h3 className="mb-4 text-small font-semibold uppercase tracking-widest text-white/40">
            {locale === "ar" ? "المناطق الشائعة" : "Popular Areas"}
          </h3>
          <nav className="grid gap-2">
            {popularAreas.map((area) => (
              <Link
                key={area.slug}
                className="transition-colors-fast text-body text-white/60 hover:text-white"
                href={`/properties?citySlug=${area.slug}`}
              >
                {locale === "ar" ? area.nameAr : area.nameEn}
              </Link>
            ))}
          </nav>
        </div>

        {/* Contact */}
        <div>
          <h3 className="mb-4 text-small font-semibold uppercase tracking-widest text-white/40">
            {locale === "ar" ? "تواصل معنا" : "Contact"}
          </h3>
          <div className="grid gap-2.5">
            <p className="text-body text-white/60">info@joud.sa</p>
            <p className="text-body text-white/60">+20 100 000 0000</p>
            <p className="text-body text-white/60">
              {locale === "ar" ? "القاهرة، مصر" : "Cairo, Egypt"}
            </p>
            <p className="mt-1 text-small text-white/40">
              {locale === "ar" ? "9 صباحاً - 6 مساءً" : "9 AM - 6 PM"}
            </p>
          </div>
        </div>
      </div>

      <Separator className="bg-white/10" />

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-3 text-caption text-white/40 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {site("name")}. {site("copyright")}
          </p>
          <div className="flex gap-4">
            <Link
              className="transition-colors-fast hover:text-white/70"
              href="/about"
            >
              {locale === "ar" ? "الشروط" : "Terms"}
            </Link>
            <Link
              className="transition-colors-fast hover:text-white/70"
              href="/about"
            >
              {locale === "ar" ? "الخصوصية" : "Privacy"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
