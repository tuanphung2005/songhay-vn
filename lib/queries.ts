import { cache } from "react"
import type { Prisma } from "@prisma/client"

import { memoizeWithTtl } from "./data-cache"
import { prisma } from "@/lib/prisma"

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
    isDeleted: false,
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
  return memoizeWithTtl("homepage-data-v2", CACHE_WINDOW_SECONDS, async () => {
    const [mostRead, latest, recommended, mostWatched] = await Promise.all([
      // Most read sidebar
      prisma.post.findMany({
        where: { isPublished: true, isDeleted: false },
        include: {
          category: true,
          _count: {
            select: { comments: { where: { isApproved: true } } },
          },
        },
        orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
        take: 5,
      }),
      // Latest for category blocks
      prisma.post.findMany({
        where: { isPublished: true, isDeleted: false },
        include: {
          category: true,
          _count: {
            select: { comments: { where: { isApproved: true } } },
          },
        },
        orderBy: { publishedAt: "desc" },
        take: 30,
      }),
      getRecommendedPosts(undefined, undefined, 12),
      getMostWatchedVideos(8),
    ])

    // Build hero section: pick the 7 most-recent published posts
    const heroSlots = latest.slice(0, 7)

    return { heroSlots, mostRead, latest, recommended, mostWatched }
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
      include: {
        category: true,
        _count: {
          select: { comments: { where: { isApproved: true } } },
        },
      },
      orderBy: { publishedAt: "desc" },
      take: 20,
    })
  })
})

export const searchPublishedPosts = cache(async (query: string, limit = 24) => {
  const normalizedQuery = normalizeSearchQuery(query)
  const safeLimit = Math.min(Math.max(limit, 1), 48)

  if (!normalizedQuery) {
    return []
  }

  return memoizeWithTtl(
    `search-published-posts:${normalizedQuery.toLocaleLowerCase("vi-VN")}:${safeLimit}`,
    CACHE_WINDOW_SECONDS,
    async () => {
      return prisma.post.findMany({
        where: {
          isPublished: true,
          isDeleted: false,
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
    }
  )
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

    return memoizeWithTtl(
      `search-published-results:${normalizedQuery.toLocaleLowerCase("vi-VN")}:${safePage}:${safePageSize}`,
      CACHE_WINDOW_SECONDS,
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
      }
    )
  }
)

export const searchPublishedPostSuggestions = cache(async (query: string, limit = 6) => {
  const normalizedQuery = normalizeSearchQuery(query)
  const safeLimit = Math.min(Math.max(limit, 1), SEARCH_SUGGEST_LIMIT_MAX)

  if (normalizedQuery.length < 2) {
    return []
  }

  return memoizeWithTtl(
    `search-published-suggestions:${normalizedQuery.toLocaleLowerCase("vi-VN")}:${safeLimit}`,
    CACHE_WINDOW_SECONDS,
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
    }
  )
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
      include: {
        category: true,
        _count: {
          select: { comments: { where: { isApproved: true } } },
        },
      },
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
      include: {
        category: true,
        _count: {
          select: { comments: { where: { isApproved: true } } },
        },
      },
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
      const where: Prisma.PostWhereInput = {
        isPublished: true,
        isDeleted: false,
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
            _count: {
              select: { comments: { where: { isApproved: true } } },
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
