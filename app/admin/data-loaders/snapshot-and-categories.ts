import { memoizeWithTtl } from "@/lib/data-cache"
import { prisma } from "@/lib/prisma"
import { sortCategoriesByTree } from "@/app/admin/data-helpers"
import type { AdminTab } from "@/app/admin/data-types"

const ADMIN_CACHE_TTL_SECONDS = 20

export async function getAdminSnapshot() {
  return memoizeWithTtl("admin:snapshot", ADMIN_CACHE_TTL_SECONDS, async () => {
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
  })
}

export async function getCategoriesForManage(activeTab: AdminTab) {
  if (activeTab !== "categories") {
    return []
  }

  return memoizeWithTtl("admin:categories:manage", ADMIN_CACHE_TTL_SECONDS, async () => {
    const raw = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        parent: {
          select: { name: true, slug: true },
        },
        _count: { select: { posts: true } },
      },
    })
    return sortCategoriesByTree(raw)
  })
}

export async function getCategoriesForWrite(activeTab: AdminTab) {
  if (activeTab !== "write") {
    return []
  }

  return memoizeWithTtl("admin:categories:write", ADMIN_CACHE_TTL_SECONDS, async () => {
    const raw = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, parentId: true, parent: { select: { name: true } } },
    })
    return sortCategoriesByTree(raw)
  })
}
