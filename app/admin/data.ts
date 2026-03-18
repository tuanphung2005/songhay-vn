import type { Prisma } from "@prisma/client"

import { memoizeWithTtl } from "@/lib/data-cache"
import { prisma } from "@/lib/prisma"

export type AdminTab =
  | "overview"
  | "write"
  | "pending-posts"
  | "media-library"
  | "personal-archive"
  | "categories"
  | "comments"
  | "posts"
  | "trash"
  | "settings-password"

const POSTS_PAGE_SIZE = 12
const PERSONAL_ARCHIVE_PAGE_SIZE = 10
const TRASH_PAGE_SIZE = 10
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

function endOfDay(value: Date) {
  const result = new Date(value)
  result.setHours(23, 59, 59, 999)
  return result
}

function parseDateInput(value: string | null | undefined) {
  if (!value || value.trim().length === 0) {
    return null
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed
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
  postsFilters,
  personalArchiveFilters,
  trashFilters,
  currentUser,
}: {
  activeTab: AdminTab
  postsFilters: {
    query: string
    authorId: string
    approval: "all" | "approved" | "unapproved"
    fromDate: string
    toDate: string
    requestedPage: number
  }
  personalArchiveFilters: {
    query: string
    status: "all" | "draft" | "pending" | "published" | "rejected"
    fromDate: string
    toDate: string
    requestedPage: number
  }
  trashFilters: {
    query: string
    authorId: string
    fromDate: string
    toDate: string
    requestedPage: number
  }
  currentUser: {
    id: string
    role: "ADMIN" | "USER"
  }
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

  const postsFromDate = parseDateInput(postsFilters.fromDate)
  const postsToDate = parseDateInput(postsFilters.toDate)

  const postsWhere: Prisma.PostWhereInput = {
    isDeleted: false,
    isPublished: true,
    isDraft: false,
    ...(postsFilters.authorId.length > 0 ? { authorId: postsFilters.authorId } : {}),
    ...(postsFilters.approval === "approved" ? { approverId: { not: null } } : {}),
    ...(postsFilters.approval === "unapproved" ? { approverId: null } : {}),
    ...(postsFromDate || postsToDate
      ? {
        publishedAt: {
          ...(postsFromDate ? { gte: startOfDay(postsFromDate) } : {}),
          ...(postsToDate ? { lte: endOfDay(postsToDate) } : {}),
        },
      }
      : {}),
    ...(postsFilters.query.length > 0
      ? {
        OR: [
          { title: { contains: postsFilters.query, mode: "insensitive" } },
          { slug: { contains: postsFilters.query, mode: "insensitive" } },
          { excerpt: { contains: postsFilters.query, mode: "insensitive" } },
          { category: { name: { contains: postsFilters.query, mode: "insensitive" } } },
          { author: { name: { contains: postsFilters.query, mode: "insensitive" } } },
          { author: { email: { contains: postsFilters.query, mode: "insensitive" } } },
        ],
      }
      : {}),
  }

  const postsData =
    activeTab === "posts"
      ? await (async () => {
        const totalCount = await prisma.post.count({ where: postsWhere })
        const totalPages = Math.max(1, Math.ceil(totalCount / POSTS_PAGE_SIZE))
        const currentPage = Math.min(postsFilters.requestedPage, totalPages)

        const posts = await prisma.post.findMany({
          where: postsWhere,
          select: {
            id: true,
            title: true,
            slug: true,
            views: true,
            thumbnailUrl: true,
            publishedAt: true,
            isFeatured: true,
            isTrending: true,
            isPublished: true,
            isDraft: true,
            editorialStatus: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
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
          filterOptions: await prisma.user.findMany({
            where: {
              posts: {
                some: {
                  isDeleted: false,
                  isPublished: true,
                  isDraft: false,
                },
              },
            },
            select: {
              id: true,
              name: true,
              email: true,
            },
            orderBy: [{ name: "asc" }, { email: "asc" }],
          }),
        }
      })()
      : {
        posts: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: 1,
        filterOptions: [] as Array<{ id: string; name: string; email: string }>,
      }

  const pendingPostsData =
    activeTab === "pending-posts"
      ? await prisma.post.findMany({
        where: {
          isDeleted: false,
          editorialStatus: "PENDING_REVIEW",
          ...(currentUser.role === "ADMIN" ? {} : { authorId: currentUser.id }),
        },
        select: {
          id: true,
          title: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 40,
      })
      : []

  const personalPostsData =
    activeTab === "personal-archive"
      ? await (async () => {
        const personalFromDate = parseDateInput(personalArchiveFilters.fromDate)
        const personalToDate = parseDateInput(personalArchiveFilters.toDate)

        const personalWhere: Prisma.PostWhereInput = {
          isDeleted: false,
          authorId: currentUser.id,
          ...(personalArchiveFilters.status === "draft" ? { isDraft: true } : {}),
          ...(personalArchiveFilters.status === "pending" ? { editorialStatus: "PENDING_REVIEW" } : {}),
          ...(personalArchiveFilters.status === "published" ? { editorialStatus: "PUBLISHED" } : {}),
          ...(personalArchiveFilters.status === "rejected" ? { editorialStatus: "REJECTED" } : {}),
          ...(personalFromDate || personalToDate
            ? {
              updatedAt: {
                ...(personalFromDate ? { gte: startOfDay(personalFromDate) } : {}),
                ...(personalToDate ? { lte: endOfDay(personalToDate) } : {}),
              },
            }
            : {}),
          ...(personalArchiveFilters.query.length > 0
            ? {
              OR: [
                { title: { contains: personalArchiveFilters.query, mode: "insensitive" } },
                { slug: { contains: personalArchiveFilters.query, mode: "insensitive" } },
                { excerpt: { contains: personalArchiveFilters.query, mode: "insensitive" } },
                { category: { name: { contains: personalArchiveFilters.query, mode: "insensitive" } } },
              ],
            }
            : {}),
        }

        const totalCount = await prisma.post.count({ where: personalWhere })
        const totalPages = Math.max(1, Math.ceil(totalCount / PERSONAL_ARCHIVE_PAGE_SIZE))
        const currentPage = Math.min(personalArchiveFilters.requestedPage, totalPages)

        const rows = await prisma.post.findMany({
          where: personalWhere,
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true,
            editorialStatus: true,
            isPublished: true,
            isDraft: true,
            createdAt: true,
            publishedAt: true,
            approvedAt: true,
            updatedAt: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
          orderBy: [{ updatedAt: "desc" }],
          skip: (currentPage - 1) * PERSONAL_ARCHIVE_PAGE_SIZE,
          take: PERSONAL_ARCHIVE_PAGE_SIZE,
        })

        return {
          rows,
          totalCount,
          totalPages,
          currentPage,
          paginationItems: buildPaginationItems(currentPage, totalPages),
        }
      })()
      : {
        rows: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: 1,
        paginationItems: [] as Array<number | "ellipsis">,
      }

  const mediaLibraryData =
    activeTab === "media-library" || activeTab === "write"
      ? await prisma.mediaAsset.findMany({
        where: {
          OR: [{ uploaderId: currentUser.id }, { visibility: "SHARED", assetType: "VIDEO" }],
        },
        select: {
          id: true,
          assetType: true,
          visibility: true,
          url: true,
          displayName: true,
          filename: true,
          mimeType: true,
          sizeBytes: true,
          uploadedAt: true,
          uploader: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ uploadedAt: "desc" }],
        take: 200,
      })
      : []

  const postsPaginationItems = buildPaginationItems(postsData.currentPage, postsData.totalPages)

  const trashedPosts =
    activeTab === "trash"
      ? await (async () => {
        const trashFromDate = parseDateInput(trashFilters.fromDate)
        const trashToDate = parseDateInput(trashFilters.toDate)

        const trashWhere: Prisma.PostWhereInput = {
          isDeleted: true,
          ...(currentUser.role === "ADMIN" ? {} : { authorId: currentUser.id }),
          ...(currentUser.role === "ADMIN" && trashFilters.authorId.length > 0 ? { authorId: trashFilters.authorId } : {}),
          ...(trashFromDate || trashToDate
            ? {
              deletedAt: {
                ...(trashFromDate ? { gte: startOfDay(trashFromDate) } : {}),
                ...(trashToDate ? { lte: endOfDay(trashToDate) } : {}),
              },
            }
            : {}),
          ...(trashFilters.query.length > 0
            ? {
              OR: [
                { title: { contains: trashFilters.query, mode: "insensitive" } },
                { slug: { contains: trashFilters.query, mode: "insensitive" } },
                { category: { name: { contains: trashFilters.query, mode: "insensitive" } } },
                { author: { name: { contains: trashFilters.query, mode: "insensitive" } } },
                { author: { email: { contains: trashFilters.query, mode: "insensitive" } } },
              ],
            }
            : {}),
        }

        const totalCount = await prisma.post.count({ where: trashWhere })
        const totalPages = Math.max(1, Math.ceil(totalCount / TRASH_PAGE_SIZE))
        const currentPage = Math.min(trashFilters.requestedPage, totalPages)

        const rows = await prisma.post.findMany({
          where: trashWhere,
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true,
            createdAt: true,
            publishedAt: true,
            approvedAt: true,
            deletedAt: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            category: {
              select: {
                slug: true,
              },
            },
          },
          orderBy: [{ deletedAt: "desc" }, { updatedAt: "desc" }],
          skip: (currentPage - 1) * TRASH_PAGE_SIZE,
          take: TRASH_PAGE_SIZE,
        })

        const authorOptions =
          currentUser.role === "ADMIN"
            ? await prisma.user.findMany({
              where: {
                posts: {
                  some: {
                    isDeleted: true,
                  },
                },
              },
              select: {
                id: true,
                name: true,
                email: true,
              },
              orderBy: [{ name: "asc" }, { email: "asc" }],
            })
            : []

        return {
          rows,
          totalCount,
          totalPages,
          currentPage,
          paginationItems: buildPaginationItems(currentPage, totalPages),
          authorOptions,
        }
      })()
      : {
        rows: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: 1,
        paginationItems: [] as Array<number | "ellipsis">,
        authorOptions: [] as Array<{ id: string; name: string; email: string }>,
      }

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
    postsFilters,
    pendingPostsData,
    personalPostsData,
    personalArchiveFilters,
    mediaLibraryData,
    trashedPosts,
    trashFilters,
    pendingComments,
    overviewAnalytics,
  }
}
