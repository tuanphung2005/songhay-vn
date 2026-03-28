import { memoizeWithTtl } from "@/lib/data-cache"
import { prisma } from "@/lib/prisma"
import { startOfDay, toDayKey, toDayLabel } from "@/app/admin/data-helpers"
import type { AdminTab } from "@/app/admin/data-types"

const ADMIN_CACHE_TTL_SECONDS = 20

export async function getMediaLibraryData(activeTab: AdminTab) {
  if (activeTab !== "media-library" && activeTab !== "write") {
    return []
  }

  return prisma.mediaAsset.findMany({
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
          email: true,
        },
      },
    },
    orderBy: [{ uploadedAt: "desc" }],
    take: 200,
  })
}

export async function getPendingComments(activeTab: AdminTab) {
  if (activeTab !== "comments") {
    return []
  }

  return memoizeWithTtl("admin:comments:pending", ADMIN_CACHE_TTL_SECONDS, async () =>
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
}

export async function getOverviewAnalytics(activeTab: AdminTab) {
  if (activeTab !== "overview") {
    return {
      daily: [] as Array<{ label: string; views: number; comments: number; posts: number }>,
      todayViews: 0,
      todayComments: 0,
      todayApprovedComments: 0,
      todayTopPosts: [] as Array<{ id: string; title: string; slug: string; views: number; category: { slug: string } }>,
    }
  }

  return memoizeWithTtl("admin:overview:analytics", ADMIN_CACHE_TTL_SECONDS, async () => {
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
}
