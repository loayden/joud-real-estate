import { getCached } from "@/lib/redis";

type PexelsPhoto = {
  id: number;
  alt: string | null;
  photographer: string;
  photographer_url: string;
  url: string;
  src: {
    landscape: string;
    large: string;
    large2x: string;
    medium: string;
    original: string;
  };
};

export type PexelsImage = {
  id: number | string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  pageUrl: string;
  src: string;
};

const fallbackImages: Record<string, PexelsImage[]> = {
  hero: [
    {
      id: "hero-1",
      alt: "Modern Egyptian residential architecture",
      photographer: "Pexels",
      photographerUrl: "https://www.pexels.com",
      pageUrl: "https://www.pexels.com/search/real%20estate/",
      src: "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1600",
    },
    {
      id: "hero-2",
      alt: "Premium villa exterior",
      photographer: "Pexels",
      photographerUrl: "https://www.pexels.com",
      pageUrl: "https://www.pexels.com/search/villa/",
      src: "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1600",
    },
  ],
  residential: [
    {
      id: "residential-1",
      alt: "Residential home",
      photographer: "Pexels",
      photographerUrl: "https://www.pexels.com",
      pageUrl: "https://www.pexels.com/search/house/",
      src: "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
  ],
  commercial: [
    {
      id: "commercial-1",
      alt: "Commercial office building",
      photographer: "Pexels",
      photographerUrl: "https://www.pexels.com",
      pageUrl: "https://www.pexels.com/search/office%20building/",
      src: "https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
  ],
  land: [
    {
      id: "land-1",
      alt: "Open land landscape",
      photographer: "Pexels",
      photographerUrl: "https://www.pexels.com",
      pageUrl: "https://www.pexels.com/search/land/",
      src: "https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
  ],
  industrial: [
    {
      id: "industrial-1",
      alt: "Industrial warehouse",
      photographer: "Pexels",
      photographerUrl: "https://www.pexels.com",
      pageUrl: "https://www.pexels.com/search/warehouse/",
      src: "https://images.pexels.com/photos/236705/pexels-photo-236705.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
  ],
  placeholder: [
    {
      id: "placeholder-1",
      alt: "Beautiful property placeholder",
      photographer: "Pexels",
      photographerUrl: "https://www.pexels.com",
      pageUrl: "https://www.pexels.com/search/real%20estate/",
      src: "https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
  ],
};

const categoryQueries: Record<string, string> = {
  residential: "modern villa exterior",
  commercial: "commercial real estate building",
  land: "desert land real estate",
  industrial: "warehouse industrial building",
};

function normalizePhoto(photo: PexelsPhoto): PexelsImage {
  return {
    id: photo.id,
    alt: photo.alt ?? "Real estate photography",
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    pageUrl: photo.url,
    src: photo.src.landscape ?? photo.src.large2x ?? photo.src.large,
  };
}

async function searchPexels(query: string, perPage: number) {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey || apiKey.includes("xxx")) {
    return null;
  }

  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(
      query,
    )}&orientation=landscape&per_page=${perPage}`,
    {
      headers: { Authorization: apiKey },
      next: { revalidate: 86400 },
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { photos?: PexelsPhoto[] };
  return payload.photos?.map(normalizePhoto) ?? null;
}

export async function getHeroPexelsImages() {
  return getCached(
    "pexels:hero:v1",
    async () =>
      (await searchPexels("Egyptian architecture real estate villa", 6)) ??
      fallbackImages.hero,
    86400,
  );
}

export async function getCategoryPexelsImages(slug: string) {
  return getCached(
    `pexels:category:${slug}:v1`,
    async () =>
      (await searchPexels(categoryQueries[slug] ?? `${slug} real estate`, 4)) ??
      fallbackImages[slug] ??
      fallbackImages.placeholder,
    86400,
  );
}

export async function getPlaceholderPexelsImages() {
  return getCached(
    "pexels:placeholder:v1",
    async () =>
      (await searchPexels("premium real estate exterior", 10)) ??
      fallbackImages.placeholder,
    86400,
  );
}

export async function getPlaceholderPexelsImage(seed?: string | null) {
  const images = await getPlaceholderPexelsImages();
  if (images.length === 0) return fallbackImages.placeholder[0];
  const seedValue = seed ?? "joud";
  const index =
    Array.from(seedValue).reduce(
      (total, char) => total + char.charCodeAt(0),
      0,
    ) % images.length;
  return images[index];
}
