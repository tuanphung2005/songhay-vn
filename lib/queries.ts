import { cache } from "react"

import { memoizeWithTtl } from "./data-cache"
import { prisma } from "@/lib/prisma"

const CACHE_WINDOW_SECONDS = 300

export const getHomepageData = cache(async () => {
  return memoizeWithTtl("homepage-data", CACHE_WINDOW_SECONDS, async () => {
    const [featuredPosts, mostRead, latest] = await Promise.all([
      prisma.post.findMany({
        where: { isPublished: true, isDeleted: false },
        include: { category: true },
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
        take: 4,
      }),
      prisma.post.findMany({
        where: { isPublished: true, isDeleted: false },
        include: { category: true },
        orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
        take: 5,
      }),
      prisma.post.findMany({
        where: { isPublished: true, isDeleted: false },
        include: { category: true },
        orderBy: { publishedAt: "desc" },
        take: 30,
      }),
    ])

    return { featuredPosts, mostRead, latest }
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

export const getRelatedPosts = cache(async (postId: string, categoryId: string) => {
  return memoizeWithTtl(`related-posts:${postId}:${categoryId}`, CACHE_WINDOW_SECONDS, async () => {
    return prisma.post.findMany({
      where: {
        isPublished: true,
        isDeleted: false,
        categoryId,
        id: { not: postId },
      },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      take: 4,
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
      take: 6,
    })
  })
})

export const getNavCategories = cache(async () => {
  return memoizeWithTtl("nav-categories", CACHE_WINDOW_SECONDS, async () => {
    const allCats = await prisma.category.findMany({
      select: { id: true, name: true, slug: true, parentId: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    })

    const roots = allCats.filter(c => !c.parentId)
    return roots.map(root => ({
      ...root,
      children: allCats.filter(c => c.parentId === root.id)
    }))
  })
})
