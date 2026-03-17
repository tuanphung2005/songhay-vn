import type { Prisma } from "@prisma/client"

import { memoizeWithTtl } from "@/lib/data-cache"
import { prisma } from "@/lib/prisma"

export type AdminTab = "overview" | "write" | "categories" | "comments" | "posts" | "trash"

const POSTS_PAGE_SIZE = 12
const ADMIN_CACHE_TTL_SECONDS = 20

function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1])
  const validPages = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b)

  const withGaps: Array<number | "ellipsis"> = []
  for (let index = 0; index < validPages.length; index += 1) {
    const page = validPages[index]
    const previous = validPages[index - 1]

    if (typeof previous === "number" && page - previous > 1) {
      withGaps.push("ellipsis")
    }

    withGaps.push(page)
  }

  return withGaps
}

function startOfDay(value: Date) {
  const result = new Date(value)
  result.setHours(0, 0, 0, 0)
  return result
}

function toDayKey(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function toDayLabel(value: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(value)
}

export async function getAdminPageData({
  activeTab,
  postsQuery,
  requestedPostsPage,
}: {
  activeTab: AdminTab
  postsQuery: string
  requestedPostsPage: number
}) {
  const { postCount, categoryCount, pendingCommentCount, trashedPostCount, totalPostViews } = await memoizeWithTtl(
    "admin:snapshot",
    ADMIN_CACHE_TTL_SECONDS,
    async () => {
      const [postCount, categoryCount, pendingCommentCount, trashedPostCount, postViewAggregate] = await Promise.all([
        prisma.post.count({ where: { isDeleted: false } }),
        prisma.category.count(),
        prisma.comment.count({ where: { isApproved: false } }),
        prisma.post.count({ where: { isDeleted: true } }),
        prisma.post.aggregate({
          where: { isDeleted: false },
          _sum: { views: true },
        }),
      ])

      return {
        postCount,
        categoryCount,
        pendingCommentCount,
        trashedPostCount,
        totalPostViews: postViewAggregate._sum.views || 0,
      }
    }
  )

  const categoriesForManage =
    activeTab === "categories"
      ? await memoizeWithTtl("admin:categories:manage", ADMIN_CACHE_TTL_SECONDS, async () =>
        prisma.category.findMany({
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: { _count: { select: { posts: true } } },
        })
      )
      : []

  const categoriesForWrite =
    activeTab === "write"
      ? await memoizeWithTtl("admin:categories:write", ADMIN_CACHE_TTL_SECONDS, async () =>
        prisma.category.findMany({
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          select: { id: true, name: true },
        })
      )
      : []

  const postsWhere: Prisma.PostWhereInput = {
    isDeleted: false,
    ...(postsQuery.length > 0
      ? {
        OR: [
          { title: { contains: postsQuery, mode: "insensitive" } },
          { slug: { contains: postsQuery, mode: "insensitive" } },
          { excerpt: { contains: postsQuery, mode: "insensitive" } },
          { category: { name: { contains: postsQuery, mode: "insensitive" } } },
        ],
      }
      : {}),
  }

  const postsData =
    activeTab === "posts"
      ? await (async () => {
        const totalCount = await prisma.post.count({ where: postsWhere })
        const totalPages = Math.max(1, Math.ceil(totalCount / POSTS_PAGE_SIZE))
        const currentPage = Math.min(requestedPostsPage, totalPages)

        const posts = await prisma.post.findMany({
          where: postsWhere,
          select: {
            id: true,
            title: true,
            slug: true,
            views: true,
            isFeatured: true,
            isTrending: true,
            isPublished: true,
            seoTitle: true,
            seoDescription: true,
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (currentPage - 1) * POSTS_PAGE_SIZE,
          take: POSTS_PAGE_SIZE,
        })

        return {
          posts,
          totalCount,
          totalPages,
          currentPage,
        }
      })()
      : {
        posts: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: 1,
      }

  const postsPaginationItems = buildPaginationItems(postsData.currentPage, postsData.totalPages)

  const trashedPosts =
    activeTab === "trash"
      ? await memoizeWithTtl("admin:trash:posts", ADMIN_CACHE_TTL_SECONDS, async () =>
        prisma.post.findMany({
          where: { isDeleted: true },
          select: {
            id: true,
            title: true,
            slug: true,
            deletedAt: true,
            category: {
              select: {
                slug: true,
              },
            },
          },
          orderBy: [{ deletedAt: "desc" }, { updatedAt: "desc" }],
          take: 30,
        })
      )
      : []

  const pendingComments =
    activeTab === "comments"
      ? await memoizeWithTtl("admin:comments:pending", ADMIN_CACHE_TTL_SECONDS, async () =>
        prisma.comment.findMany({
          where: { isApproved: false },
          select: {
            id: true,
            authorName: true,
            content: true,
            post: {
              select: {
                slug: true,
                category: {
                  select: {
                    slug: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      )
      : []

  const overviewAnalytics =
    activeTab === "overview"
      ? await memoizeWithTtl("admin:overview:analytics", ADMIN_CACHE_TTL_SECONDS, async () => {
        const todayStart = startOfDay(new Date())
        const tomorrowStart = new Date(todayStart)
        tomorrowStart.setDate(tomorrowStart.getDate() + 1)

        const chartStart = new Date(todayStart)
        chartStart.setDate(chartStart.getDate() - 6)

        const [recentPosts, recentComments] = await Promise.all([
          prisma.post.findMany({
            where: {
              isDeleted: false,
              isPublished: true,
              publishedAt: { gte: chartStart },
            },
            select: {
              id: true,
              title: true,
              views: true,
              publishedAt: true,
              category: { select: { slug: true } },
              slug: true,
            },
          }),
          prisma.comment.findMany({
            where: {
              createdAt: { gte: chartStart },
            },
            select: {
              id: true,
              createdAt: true,
              isApproved: true,
            },
          }),
        ])

        const dailyMap = new Map<string, { date: Date; views: number; comments: number; posts: number }>()

        for (let index = 0; index < 7; index += 1) {
          const currentDate = new Date(chartStart)
          currentDate.setDate(chartStart.getDate() + index)
          dailyMap.set(toDayKey(currentDate), {
            date: currentDate,
            views: 0,
            comments: 0,
            posts: 0,
          })
        }

        for (const post of recentPosts) {
          const key = toDayKey(post.publishedAt)
          const bucket = dailyMap.get(key)
          if (!bucket) {
            continue
          }
          bucket.posts += 1
          bucket.views += post.views
        }

        for (const comment of recentComments) {
          const key = toDayKey(comment.createdAt)
          const bucket = dailyMap.get(key)
          if (!bucket) {
            continue
          }
          bucket.comments += 1
        }

        const todayTopPosts = recentPosts
          .filter((post) => post.publishedAt >= todayStart && post.publishedAt < tomorrowStart)
          .sort((a, b) => b.views - a.views)
          .slice(0, 5)

        const todayViews = todayTopPosts.reduce((sum, post) => sum + post.views, 0)
        const todayComments = recentComments.filter((item) => item.createdAt >= todayStart && item.createdAt < tomorrowStart).length
        const todayApprovedComments = recentComments.filter((item) => item.isApproved && item.createdAt >= todayStart && item.createdAt < tomorrowStart).length

        const daily = [...dailyMap.values()].map((item) => ({
          ...item,
          label: toDayLabel(item.date),
        }))

        return {
          daily,
          todayViews,
          todayComments,
          todayApprovedComments,
          todayTopPosts,
        }
      })
      : {
        daily: [] as Array<{ label: string; views: number; comments: number; posts: number }>,
        todayViews: 0,
        todayComments: 0,
        todayApprovedComments: 0,
        todayTopPosts: [] as Array<{ id: string; title: string; slug: string; views: number; category: { slug: string } }>,
      }

  return {
    postCount,
    categoryCount,
    pendingCommentCount,
    trashedPostCount,
    totalPostViews,
    categoriesForManage,
    categoriesForWrite,
    postsData,
    postsPaginationItems,
    trashedPosts,
    pendingComments,
    overviewAnalytics,
  }
}
