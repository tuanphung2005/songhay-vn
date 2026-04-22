import "server-only"

import { prisma } from "@/lib/prisma"

export type MediaUsageContext = "thumbnail" | "content" | "og-image"

export type MediaUsageItem = {
  postId: string
  title: string
  slug: string
  categorySlug: string | null
  isDeleted: boolean
  isLiveVisible: boolean
  contexts: MediaUsageContext[]
}

export type MediaUsageSummary = {
  count: number
  items: MediaUsageItem[]
}

const EMPTY_MEDIA_USAGE: MediaUsageSummary = {
  count: 0,
  items: [],
}

type MediaAssetWithUrl = {
  url: string
}

function dedupeMediaUrls(urls: string[]) {
  return [...new Set(urls.map((url) => url.trim()).filter(Boolean))]
}

function cloneEmptyUsage(): MediaUsageSummary {
  return {
    count: 0,
    items: [],
  }
}

async function findPostsUsingMedia(urls: string[]) {
  if (urls.length === 0) {
    return []
  }

  return prisma.post.findMany({
    where: {
      OR: [
        {
          thumbnailUrl: {
            in: urls,
          },
        },
        {
          ogImage: {
            in: urls,
          },
        },
        ...urls.map((url) => ({
          content: {
            contains: url,
          },
        })),
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      isDeleted: true,
      isPublished: true,
      scheduledPublishAt: true,
      thumbnailUrl: true,
      ogImage: true,
      content: true,
      category: {
        select: {
          slug: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  })
}

export async function getMediaUsageMap(urls: string[]) {
  const uniqueUrls = dedupeMediaUrls(urls)
  const usageMap = new Map<string, MediaUsageSummary>()

  for (const url of uniqueUrls) {
    usageMap.set(url, cloneEmptyUsage())
  }

  if (uniqueUrls.length === 0) {
    return usageMap
  }

  const posts = await findPostsUsingMedia(uniqueUrls)
  const now = new Date()

  for (const post of posts) {
    for (const url of uniqueUrls) {
      const contexts: MediaUsageContext[] = []

      if (post.thumbnailUrl === url) {
        contexts.push("thumbnail")
      }

      if (post.ogImage === url) {
        contexts.push("og-image")
      }

      if (post.content.includes(url)) {
        contexts.push("content")
      }

      if (contexts.length === 0) {
        continue
      }

      const existing = usageMap.get(url)
      if (!existing) {
        continue
      }

      existing.items.push({
        postId: post.id,
        title: post.title,
        slug: post.slug,
        categorySlug: post.category?.slug || null,
        isDeleted: post.isDeleted,
        isLiveVisible:
          post.isPublished &&
          !post.isDeleted &&
          (!post.scheduledPublishAt || post.scheduledPublishAt <= now),
        contexts,
      })
      existing.count += 1
    }
  }

  return usageMap
}

export async function attachMediaUsage<T extends MediaAssetWithUrl>(assets: T[]) {
  const usageMap = await getMediaUsageMap(assets.map((asset) => asset.url))

  return assets.map((asset) => ({
    ...asset,
    usage: usageMap.get(asset.url) || cloneEmptyUsage(),
  }))
}

export async function getMediaUsageByUrl(url: string) {
  const usageMap = await getMediaUsageMap([url])
  return usageMap.get(url) || EMPTY_MEDIA_USAGE
}
