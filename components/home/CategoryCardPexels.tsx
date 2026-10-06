"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Building2, Home, KeyRound, Search } from "lucide-react";

import { Link } from "@/i18n/routing";

type PexelsImage = {
  id: number | string;
  alt: string;
  src: string;
};

const icons = {
  home: Home,
  building: Building2,
  key: KeyRound,
  search: Search,
} as const;

export function CategoryCardPexels({
  href,
  slug,
  name,
  count,
  countLabel,
  iconKey,
  image: initialImage,
}: {
  href: string;
  slug: string;
  name: string;
  count: number;
  countLabel: string;
  iconKey: keyof typeof icons;
  image?: PexelsImage | null;
}) {
  const [image, setImage] = useState<PexelsImage | null>(initialImage ?? null);
  const Icon = icons[iconKey];

  useEffect(() => {
    if (initialImage !== undefined) return;

    let cancelled = false;

    async function loadImage() {
      const response = await fetch(`/api/pexels/category/${slug}`);
      const payload = (await response.json()) as {
        success: boolean;
        data?: { images: PexelsImage[] };
      };

      if (!cancelled) {
        setImage(payload.data?.images[0] ?? null);
      }
    }

    loadImage();

    return () => {
      cancelled = true;
    };
  }, [initialImage, slug]);

  return (
    <Link
      className="transition-lift group relative block min-h-48 overflow-hidden rounded-2xl border border-border bg-card text-white hover:-translate-y-1 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      href={href}
    >
      {image ? (
        <Image
          alt={image.alt}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          src={image.src}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 to-primary-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-950/35 to-primary-950/5" />
      <div className="relative flex h-full min-h-48 flex-col justify-between gap-6 p-5">
        <span className="glass-dark grid size-11 w-fit place-items-center rounded-xl">
          <Icon className="size-5" />
        </span>
        <div>
          <span className="tnum rounded-full bg-black/40 px-3 py-1 text-xs font-bold">
            {count} {countLabel}
          </span>
          <div className="mt-3 text-xl font-bold leading-snug">{name}</div>
        </div>
      </div>
    </Link>
  );
}
