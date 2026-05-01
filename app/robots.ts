import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/login", "/api/", "/_next/"],
      },
    ],
    host: siteUrl,
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
