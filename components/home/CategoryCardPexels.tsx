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
      className="group relative min-h-48 overflow-hidden rounded-lg border border-border bg-card p-5 text-white shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-soft"
      href={href}
    >
      {image ? (
        <Image
          alt={image.alt}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          fill
          sizes="(min-width: 1024px) 25vw, 100vw"
          src={image.src}
        />
      ) : (
        <div className="absolute inset-0 bg-primary" />
      )}
      <div className="from-primary-900/88 absolute inset-0 bg-gradient-to-t via-primary-900/40 to-primary-900/10" />
      <div className="relative flex h-full flex-col justify-between gap-6">
        <span className="grid size-11 place-items-center rounded-md bg-white/15 backdrop-blur">
          <Icon className="size-5" />
        </span>
        <div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
            {count} {countLabel}
          </span>
          <div className="mt-3 text-xl font-bold">{name}</div>
        </div>
      </div>
    </Link>
  );
}
