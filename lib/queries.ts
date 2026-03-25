import { cache } from "react"

import { memoizeWithTtl } from "./data-cache"
import { prisma } from "@/lib/prisma"

const CACHE_WINDOW_SECONDS = 300

export const getHomepageData = cache(async () => {
  return memoizeWithTtl("homepage-data-v2", CACHE_WINDOW_SECONDS, async () => {
    const [mostRead, latest, recommended, mostWatched, trendingPosts] = await Promise.all([
      // Most read sidebar
      prisma.post.findMany({
        where: { isPublished: true, isDeleted: false },
        include: { category: true },
        orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
        take: 5,
      }),
      // Latest for category blocks
      prisma.post.findMany({
        where: { isPublished: true, isDeleted: false },
        include: { category: true },
        orderBy: { publishedAt: "desc" },
        take: 30,
      }),
      getRecommendedPosts(undefined, undefined, 12),
      getMostWatchedVideos(8),
      getTrendingPosts(),
    ])

    // Build hero section: pick the 4 most-recent published posts, 1 per category
    const categoryMap = new Map<string, (typeof latest)[0]>()
    for (const post of latest) {
      if (!categoryMap.has(post.category.slug)) {
        categoryMap.set(post.category.slug, post)
      }
      if (categoryMap.size === 4) break
    }
    const heroSlots = Array.from(categoryMap.values())

    return { heroSlots, mostRead, latest, recommended, mostWatched, trendingPosts }
  })
})

export const getPostsByCategory = cache(async (categorySlug: string) => {
  return memoizeWithTtl(`posts-by-category:${categorySlug}`, CACHE_WINDOW_SECONDS, async () => {
    return prisma.post.findMany({
      where: {
        isPublished: true,
        isDeleted: false,
        OR: [
          { category: { slug: categorySlug } },
          { category: { parent: { slug: categorySlug } } },
        ],
      },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      take: 20,
    })
  })
})

export const getCategoryBySlug = cache(async (categorySlug: string) => {
  return memoizeWithTtl(`category-by-slug:${categorySlug}`, CACHE_WINDOW_SECONDS, async () => {
    return prisma.category.findUnique({
      where: { slug: categorySlug },
    })
  })
})

export const getPostByCategoryAndSlug = cache(async (categorySlug: string, slug: string) => {
  return memoizeWithTtl(`post-by-category-and-slug:${categorySlug}:${slug}`, CACHE_WINDOW_SECONDS, async () => {
    return prisma.post.findFirst({
      where: {
        slug,
        isPublished: true,
        isDeleted: false,
        category: { slug: categorySlug },
      },
      include: {
        category: true,
        comments: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
        },
      },
    })
  })
})

export const getRelatedPosts = cache(async (postId: string, categoryId: string, limit = 8) => {
  return memoizeWithTtl(`related-posts:${postId}:${categoryId}:${limit}`, CACHE_WINDOW_SECONDS, async () => {
    return prisma.post.findMany({
      where: {
        isPublished: true,
        isDeleted: false,
        categoryId,
        id: { not: postId },
      },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
    })
  })
})

export const getTrendingPosts = cache(async () => {
  return memoizeWithTtl("trending-posts", CACHE_WINDOW_SECONDS, async () => {
    return prisma.post.findMany({
      where: {
        isPublished: true,
        isDeleted: false,
        OR: [{ isTrending: true }, { views: { gt: 100 } }],
      },
      include: { category: true },
      orderBy: [{ isTrending: "desc" }, { views: "desc" }, { publishedAt: "desc" }],
      take: 12,
    })
  })
})

export const getMostWatchedVideos = cache(async (limit = 4) => {
  return memoizeWithTtl(`most-watched-videos:${limit}`, CACHE_WINDOW_SECONDS, async () => {
    return prisma.post.findMany({
      where: {
        isPublished: true,
        isDeleted: false,
        videoEmbedUrl: { not: null },
      },
      include: { category: true },
      orderBy: { views: "desc" },
      take: limit,
    })
  })
})

export const getRecommendedPosts = cache(
  async (postId?: string, categoryId?: string, limit = 4) => {
    const cacheKey = `recommended-posts:${postId || "home"}:${categoryId || "all"}:${limit}`
    return memoizeWithTtl(cacheKey, CACHE_WINDOW_SECONDS, async () => {
      const where: any = {
        isPublished: true,
        isDeleted: false,
      }

      if (postId) {
        where.id = { not: postId }
      }

      const orConditions: any[] = [{ isFeatured: true }, { isTrending: true }]
      if (categoryId) {
        orConditions.push({ categoryId })
      }
      where.OR = orConditions

      return prisma.post.findMany({
        where,
        include: { category: true },
        orderBy: [{ isFeatured: "desc" }, { isTrending: "desc" }, { publishedAt: "desc" }],
        take: limit,
      })
    })
  }
)


export const getNavCategories = cache(async () => {
  return memoizeWithTtl("nav-categories", CACHE_WINDOW_SECONDS, async () => {
    const allCats = await prisma.category.findMany({
      select: { id: true, name: true, slug: true, parentId: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    })

    const roots = allCats.filter((c) => !c.parentId)
    return roots.map((root) => ({
      ...root,
      children: allCats.filter((c) => c.parentId === root.id),
    }))
  })
})

export const getLatestByCategory = cache(async (perCategory = 4, categoriesLimit = 6) => {
  return memoizeWithTtl(`latest-by-category:${perCategory}:${categoriesLimit}`, CACHE_WINDOW_SECONDS, async () => {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: categoriesLimit,
    })

    const sections = await Promise.all(
      categories.map(async (category) => {
        const posts = await prisma.post.findMany({
          where: {
            isPublished: true,
            isDeleted: false,
            isDraft: false,
            categoryId: category.id,
          },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            thumbnailUrl: true,
            publishedAt: true,
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
          orderBy: { publishedAt: "desc" },
          take: perCategory,
        })

        return {
          category,
          posts,
        }
      })
    )

    return {
      items: sections.filter((section) => section.posts.length > 0),
    }
  })
})
