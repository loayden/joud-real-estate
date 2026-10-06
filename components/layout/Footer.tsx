import { Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link, type Locale } from "@/i18n/routing";
import { Separator } from "@/components/ui/separator";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}

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
              className="transition-all-fast grid size-10 place-items-center rounded-xl bg-white/10 text-white/60 hover:-translate-y-0.5 hover:bg-white/20 hover:text-white"
              aria-label="Facebook"
            >
              <FacebookIcon className="size-4" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all-fast grid size-10 place-items-center rounded-xl bg-white/10 text-white/60 hover:-translate-y-0.5 hover:bg-white/20 hover:text-white"
              aria-label="X"
            >
              <XIcon className="size-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all-fast grid size-10 place-items-center rounded-xl bg-white/10 text-white/60 hover:-translate-y-0.5 hover:bg-white/20 hover:text-white"
              aria-label="Instagram"
            >
              <InstagramIcon className="size-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all-fast grid size-10 place-items-center rounded-xl bg-white/10 text-white/60 hover:-translate-y-0.5 hover:bg-white/20 hover:text-white"
              aria-label="LinkedIn"
            >
              <LinkedInIcon className="size-4" />
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
