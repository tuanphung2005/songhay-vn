import type { MetadataRoute } from "next"

import { prisma } from "@/lib/prisma"
import { getSiteUrl } from "@/lib/seo"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const staticPages = [
    {
      url: `${siteUrl}/mien-tru-trach-nhiem`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
  ]

  const [categories, posts] = await Promise.all([
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.post.findMany({
      where: { isPublished: true, isDeleted: false },
      select: {
        slug: true,
        updatedAt: true,
        category: { select: { slug: true } },
      },
    }),
  ])

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    ...staticPages.map((item) => ({
      url: item.url,
      lastModified: new Date(),
      changeFrequency: item.changeFrequency,
      priority: item.priority,
    })),
    ...categories.map((category) => ({
      url: `${siteUrl}/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...posts.map((post) => ({
      url: `${siteUrl}/${post.category.slug}/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]
}
