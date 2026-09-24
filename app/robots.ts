import type { MetadataRoute } from "next";

import { getSeoAppUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSeoAppUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/ar/admin/",
          "/en/admin/",
          "/ar/dashboard/",
          "/en/dashboard/",
          "/ar/my-listings/",
          "/en/my-listings/",
          "/ar/profile/",
          "/en/profile/",
          "/ar/settings/",
          "/en/settings/",
          "/ar/inquiries/",
          "/en/inquiries/",
          "/ar/favorites/",
          "/en/favorites/",
          "/ar/saved-searches/",
          "/en/saved-searches/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
