import type { MetadataRoute } from "next"

import { prisma } from "@/lib/prisma"
import { getSiteUrl, toAbsoluteUrl, DEFAULT_OG_IMAGE_PATH } from "@/lib/seo"

const MAX_POSTS_PER_SITEMAP = 10000

export async function generateSitemaps() {
  const postCount = await prisma.post.count({
    where: { isPublished: true, isDeleted: false, OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] },
  })
  
  if (postCount === 0) return [{ id: 0 }]
  
  const numSitemaps = Math.ceil(postCount / MAX_POSTS_PER_SITEMAP)
  return Array.from({ length: numSitemaps }, (_, i) => ({ id: i }))
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const staticPages = [
    {
      url: `${siteUrl}/mien-tru-trach-nhiem`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
  ]

  // Only include categories and static pages on the first sitemap chunk
  let categoriesData: any[] = []
  let includeStatic = id === 0

  if (includeStatic) {
    const rawCategories = await prisma.category.findMany({ 
      select: { 
        slug: true, 
        updatedAt: true,
        posts: {
          where: { isPublished: true, isDeleted: false },
          orderBy: { publishedAt: "desc" },
          take: 1,
          select: { publishedAt: true }
        }
      } 
    })

    categoriesData = rawCategories.map(cat => ({
      ...cat,
      lastmod: cat.posts.length > 0 ? cat.posts[0].publishedAt : cat.updatedAt
    }))
  }

  const posts = await prisma.post.findMany({
    where: { isPublished: true, isDeleted: false, OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] },
    select: {
      title: true,
      slug: true,
      updatedAt: true,
      publishedAt: true,
      thumbnailUrl: true,
      category: { select: { slug: true } },
    },
    orderBy: { publishedAt: "desc" },
    skip: id * MAX_POSTS_PER_SITEMAP,
    take: MAX_POSTS_PER_SITEMAP,
  })

  const sitemapData: MetadataRoute.Sitemap = []

  if (includeStatic) {
    sitemapData.push({
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    })

    staticPages.forEach((item) => {
      sitemapData.push({
        url: item.url,
        lastModified: new Date(),
        changeFrequency: item.changeFrequency,
        priority: item.priority,
      })
    })

    categoriesData.forEach((category) => {
      sitemapData.push({
        url: `${siteUrl}/${category.slug}`,
        lastModified: category.lastmod,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })
    })
  }

  posts.forEach((post) => {
    const images = post.thumbnailUrl ? [toAbsoluteUrl(post.thumbnailUrl)] : []
    
    // We add a custom property `news` which might not be strictly typed in MetadataRoute.Sitemap
    // but some third-party integrations or future Next.js versions might serialize it.
    // To strictly support Google News, a separate /news-sitemap.xml route is usually recommended,
    // but the Next.js sitemap type in 15+ allows `images` at least.
    const item: any = {
      url: `${siteUrl}/${post.category.slug}/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images,
      // experimental/custom properties
      news: {
        title: post.title,
        publicationName: "Songhay.vn",
        publicationLanguage: "vi",
        date: post.publishedAt,
      }
    }
    
    sitemapData.push(item)
  })

  return sitemapData
}
