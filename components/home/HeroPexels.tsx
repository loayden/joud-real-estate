"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type PexelsImage = {
  id: number | string;
  alt: string;
  src: string;
};

export function HeroPexels({
  fallback = "/images/joud-hero.jpg",
  photos = [],
}: {
  fallback?: string;
  photos?: PexelsImage[];
}) {
  const [images, setImages] = useState<PexelsImage[]>(photos);
  const [index, setIndex] = useState(0);
  const image = images[index] ?? { id: "fallback", alt: "", src: fallback };

  useEffect(() => {
    if (photos.length > 0) return;

    let cancelled = false;

    async function loadImages() {
      const response = await fetch("/api/pexels/hero");
      const payload = (await response.json()) as {
        success: boolean;
        data?: { images: PexelsImage[] };
      };

      if (!cancelled && payload.success) {
        setImages(payload.data?.images ?? []);
      }
    }

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [photos.length]);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, 6500);

    return () => window.clearInterval(interval);
  }, [images.length]);

  return (
    <Image
      alt={image.alt}
      className="object-cover transition-opacity duration-700"
      fill
      priority
      sizes="100vw"
      src={image.src}
    />
  );
}
