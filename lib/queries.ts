import { cache } from "react"
import { unstable_cache } from "next/cache"
import type { Prisma } from "@/generated/prisma/client"

import { NAV_CATEGORIES } from "./categories"
import { prisma } from "@/lib/prisma"

import type { PostWithCategoryAndComments } from "@/types/post"
import type { SearchResultItem } from "@/types/search"
import type { CategoryWithChildren } from "@/types/category"

export type { PostWithCategoryAndComments, SearchResultItem, CategoryWithChildren }


const CACHE_WINDOW_SECONDS = 300
const SEARCH_PAGE_SIZE_DEFAULT = 12
const SEARCH_PAGE_SIZE_MAX = 24
const SEARCH_SUGGEST_LIMIT_MAX = 10

function normalizeSearchQuery(query: string) {
  return query.trim().replace(/\s+/g, " ")
}

function createPublishedSearchWhere(normalizedQuery: string): Prisma.PostWhereInput {
  return {
    isPublished: true,
    isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }],
    isDraft: false,
    OR: [
      { title: { contains: normalizedQuery, mode: "insensitive" } },
      { excerpt: { contains: normalizedQuery, mode: "insensitive" } },
      { content: { contains: normalizedQuery, mode: "insensitive" } },
      { category: { name: { contains: normalizedQuery, mode: "insensitive" } } },
    ],
  }
}

export const getHomepageData = cache(async () => {
  return unstable_cache(
    async () => {
      const [mostRead, latest, recommended, mostWatched] = await Promise.all([
        prisma.post.findMany({
          where: { isPublished: true, isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }] },
          include: {
            category: true,
            _count: { select: { comments: { where: { isApproved: true } } } },
          },
          orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
          take: 5,
        }),
        prisma.post.findMany({
          where: { isPublished: true, isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }] },
          include: {
            category: true,
            _count: { select: { comments: { where: { isApproved: true } } } },
          },
          orderBy: { publishedAt: "desc" },
          take: 30,
        }),
        getRecommendedPosts(undefined, undefined, 12),
        getMostWatchedVideos(8),
      ])

      const heroSlots = latest.slice(0, 7)
      return { heroSlots, mostRead, latest, recommended, mostWatched }
    },
    ["homepage-data-v3"],
    { revalidate: 60, tags: ["homepage", "posts"] }
  )()
})

export const getPostsByCategory = cache(async (categorySlug: string) => {
  return unstable_cache(
    async () => {
      return prisma.post.findMany({
        where: {
          isPublished: true,
          isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }],
          OR: [
            { category: { slug: categorySlug } },
            { category: { parent: { slug: categorySlug } } },
          ],
        },
        include: {
          category: true,
          _count: {
            select: { comments: { where: { isApproved: true } } },
          },
        },
        orderBy: { publishedAt: "desc" },
        take: 20,
      })
    },
    [`posts-by-category:${categorySlug}`],
    { revalidate: 300, tags: ["posts", "categories"] }
  )()
})

export const searchPublishedPosts = cache(async (query: string, limit = 24) => {
  const normalizedQuery = normalizeSearchQuery(query)
  const safeLimit = Math.min(Math.max(limit, 1), 48)

  if (!normalizedQuery) {
    return []
  }

  return unstable_cache(
    async () => {
      return prisma.post.findMany({
        where: {
          isPublished: true,
          isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }],
          isDraft: false,
          OR: [
            { title: { contains: normalizedQuery, mode: "insensitive" } },
            { excerpt: { contains: normalizedQuery, mode: "insensitive" } },
            { category: { name: { contains: normalizedQuery, mode: "insensitive" } } },
          ],
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
          _count: {
            select: { comments: { where: { isApproved: true } } },
          },
        },
        orderBy: { publishedAt: "desc" },
        take: safeLimit,
      })
    },
    [`search-published-posts:${normalizedQuery.toLocaleLowerCase("vi-VN")}:${safeLimit}`],
    { revalidate: 300, tags: ["posts"] }
  )()
})

export const getPublishedSearchResults = cache(
  async (query: string, page = 1, pageSize = SEARCH_PAGE_SIZE_DEFAULT) => {
    const normalizedQuery = normalizeSearchQuery(query)
    const safePage = Math.max(page, 1)
    const safePageSize = Math.min(Math.max(pageSize, 1), SEARCH_PAGE_SIZE_MAX)

    if (!normalizedQuery) {
      return {
        query: "",
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: safePageSize,
        totalPages: 0,
      }
    }

    return unstable_cache(
      async () => {
        const where = createPublishedSearchWhere(normalizedQuery)
        const totalCount = await prisma.post.count({ where })

        if (totalCount === 0) {
          return {
            query: normalizedQuery,
            items: [],
            totalCount: 0,
            page: 1,
            pageSize: safePageSize,
            totalPages: 0,
          }
        }

        const totalPages = Math.ceil(totalCount / safePageSize)
        const currentPage = Math.min(safePage, totalPages)

        const items = await prisma.post.findMany({
          where,
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
            _count: {
              select: { comments: { where: { isApproved: true } } },
            },
          },
          orderBy: { publishedAt: "desc" },
          skip: (currentPage - 1) * safePageSize,
          take: safePageSize,
        })

        return {
          query: normalizedQuery,
          items,
          totalCount,
          page: currentPage,
          pageSize: safePageSize,
          totalPages,
        }
      },
      [`search-published-results:${normalizedQuery.toLocaleLowerCase("vi-VN")}:${safePage}:${safePageSize}`],
      { revalidate: 300, tags: ["posts"] }
    )()
  }
)

export const searchPublishedPostSuggestions = cache(async (query: string, limit = 6) => {
  const normalizedQuery = normalizeSearchQuery(query)
  const safeLimit = Math.min(Math.max(limit, 1), SEARCH_SUGGEST_LIMIT_MAX)

  if (normalizedQuery.length < 2) {
    return []
  }

  return unstable_cache(
    async () => {
      return prisma.post.findMany({
        where: createPublishedSearchWhere(normalizedQuery),
        select: {
          id: true,
          title: true,
          slug: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { publishedAt: "desc" },
        take: safeLimit,
      })
    },
    [`search-published-suggestions:${normalizedQuery.toLocaleLowerCase("vi-VN")}:${safeLimit}`],
    { revalidate: 300, tags: ["posts"] }
  )()
})

export const getCategoryBySlug = cache(async (categorySlug: string) => {
  return unstable_cache(
    async () => {
      return prisma.category.findUnique({
        where: { slug: categorySlug },
      })
    },
    [`category-by-slug:${categorySlug}`],
    { revalidate: 300, tags: ["categories"] }
  )()
})

export const getPostByCategoryAndSlug = cache(async (categorySlug: string, slug: string) => {
  return unstable_cache(
    async () => {
      return prisma.post.findFirst({
        where: {
          slug,
          isPublished: true,
          isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }],
          category: { slug: categorySlug },
        },
        include: {
          category: true,
          author: { select: { name: true } },
          comments: {
            where: { isApproved: true },
            orderBy: { createdAt: "desc" },
          },
        },
      })
    },
    [`post-by-category-and-slug:${categorySlug}:${slug}`],
    { revalidate: 600, tags: ["posts"] }
  )()
})

export const getRelatedPosts = cache(async (postId: string, categoryId: string, limit = 8) => {
  return unstable_cache(
    async () => {
      return prisma.post.findMany({
        where: {
          categoryId,
          id: { not: postId },
          isPublished: true,
          isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }],
        },
        include: {
          category: true,
          _count: {
            select: { comments: { where: { isApproved: true } } },
          },
        },
        orderBy: { publishedAt: "desc" },
        take: limit,
      })
    },
    [`related-posts:${postId}:${categoryId}:${limit}`],
    { revalidate: 600, tags: ["posts"] }
  )()
})

export const getTrendingPosts = cache(async () => {
  return unstable_cache(
    async () => {
      return prisma.post.findMany({
        where: {
          isPublished: true,
          isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }],
          OR: [{ isTrending: true }, { views: { gt: 100 } }],
        },
        include: {
          category: true,
          _count: {
            select: { comments: { where: { isApproved: true } } },
          },
        },
        orderBy: [{ isTrending: "desc" }, { views: "desc" }, { publishedAt: "desc" }],
        take: 12,
      })
    },
    ["trending-posts"],
    { revalidate: 300, tags: ["posts"] }
  )()
})

export const getMostWatchedVideos = cache(async (limit = 4) => {
  return unstable_cache(
    async () => {
      return prisma.post.findMany({
        where: {
          isPublished: true,
          isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }],
          videoEmbedUrl: { not: null },
        },
        include: {
          category: true,
          _count: {
            select: { comments: { where: { isApproved: true } } },
          },
        },
        orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
        take: limit,
      })
    },
    [`most-watched-videos:${limit}`],
    { revalidate: 3600, tags: ["posts"] }
  )()
})

export const getRecommendedPosts = cache(
  async (postId?: string, categoryId?: string, limit = 4) => {
    const cacheKey = `recommended-posts:${postId || "home"}:${categoryId || "all"}:${limit}`
    return unstable_cache(
      async () => {
        const where: Prisma.PostWhereInput = {
          isPublished: true,
          isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }],
        }

        if (postId) {
          where.id = { not: postId }
        }

        const orConditions: Prisma.PostWhereInput[] = [{ isFeatured: true }, { isTrending: true }]
        if (categoryId) {
          orConditions.push({ categoryId })
        }
        where.OR = orConditions

        return prisma.post.findMany({
          where,
          include: {
            category: true,
            _count: {
              select: { comments: { where: { isApproved: true } } },
            },
          },
          orderBy: [{ isFeatured: "desc" }, { isTrending: "desc" }, { publishedAt: "desc" }],
          take: limit,
        })
      },
      [cacheKey],
      { revalidate: 300, tags: ["posts"] }
    )()
  }
)



export const getNavCategories = cache(async (): Promise<CategoryWithChildren[]> => {
  return unstable_cache(
    async () => {
      try {
        const allCats = await prisma.category.findMany({
          select: { id: true, name: true, slug: true, parentId: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        })

        if (allCats.length === 0) {
          return NAV_CATEGORIES.map((cat, idx) => ({
            id: `static-${idx}`,
            name: cat.name,
            slug: cat.slug,
            parentId: null,
            children: (cat.children || []).map((child, cIdx) => ({
              id: `static-${idx}-${cIdx}`,
              name: child.name,
              slug: child.slug,
              parentId: `static-${idx}`,
            })),
          }))
        }

        const roots = allCats.filter((c) => !c.parentId)
        return roots.map((root) => ({
          ...root,
          children: allCats.filter((c) => c.parentId === root.id),
        }))
      } catch (error) {
        console.error("Failed to fetch nav categories from DB, falling back to static:", error)
        return NAV_CATEGORIES.map((cat, idx) => ({
          id: `static-${idx}`,
          name: cat.name,
          slug: cat.slug,
          parentId: null,
          children: (cat.children || []).map((child, cIdx) => ({
            id: `static-${idx}-${cIdx}`,
            name: child.name,
            slug: child.slug,
            parentId: `static-${idx}`,
          })),
        }))
      }
    },
    ["nav-categories"],
    { revalidate: 3600, tags: ["categories"] }
  )()
})

export const getLatestByCategory = cache(async (perCategory = 4, categoriesLimit = 6) => {
  return unstable_cache(
    async () => {
      const topCategories = await prisma.category.findMany({
        where: { parentId: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        take: categoriesLimit,
      })

      const categoriesWithPosts = await Promise.all(
        topCategories.map(async (cat) => {
          const posts = await prisma.post.findMany({
            where: {
              categoryId: cat.id,
              isPublished: true,
              isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }],
            },
            include: {
              category: true,
              _count: {
                select: { comments: { where: { isApproved: true } } },
              },
            },
            orderBy: { publishedAt: "desc" },
            take: perCategory,
          })
          return { ...cat, posts }
        })
      )

      return categoriesWithPosts.filter((cat) => cat.posts.length > 0)
    },
    [`latest-by-category:${perCategory}:${categoriesLimit}`],
    { revalidate: 300, tags: ["posts", "categories"] }
  )()
})

export async function getLatestPostsForSsg(limit = 50) {
  return prisma.post.findMany({
    where: { isPublished: true, isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }], isDraft: false },
    select: { slug: true, category: { select: { slug: true } } },
    orderBy: { publishedAt: "desc" },
    take: limit,
  })
}

export async function getAllCategorySlugs() {
  return prisma.category.findMany({
    select: { slug: true },
  })
}
