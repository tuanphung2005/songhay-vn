import type { AdminTab } from "@/app/admin/data-types"
import { memoizeWithTtl } from "@/lib/data-cache"
import { prisma } from "@/lib/prisma"
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors"
import { ensureSeoKeywordStoreSeeded } from "@/lib/seo-keyword-store"

const ADMIN_CACHE_TTL_SECONDS = 20

export async function getModerationSettingsData(activeTab: AdminTab) {
  if (activeTab !== "settings-moderation") {
    return {
      forbiddenKeywords: [] as Array<{ id: string; term: string; createdAt: Date }>,
      seoKeywords: [] as Array<{
        id: string
        keyword: string
        normalizedKeyword: string
        postCount: number
        updatedAt: Date
      }>,
    }
  }

  return memoizeWithTtl("admin:settings:moderation", ADMIN_CACHE_TTL_SECONDS, async () => {
    try {
      await ensureSeoKeywordStoreSeeded()
    } catch (error) {
      if (!isPrismaSchemaMismatchError(error)) {
        throw error
      }
    }

    const forbiddenKeywordsPromise = prisma.forbiddenKeyword
      .findMany({
        orderBy: { term: "asc" },
        select: {
          id: true,
          term: true,
          createdAt: true,
        },
      })
      .catch((error) => {
        if (isPrismaSchemaMismatchError(error)) {
          return []
        }

        throw error
      })

    const seoKeywordsPromise = prisma.seoKeyword
      .findMany({
        orderBy: [{ updatedAt: "desc" }, { keyword: "asc" }],
        take: 300,
        select: {
          id: true,
          keyword: true,
          normalizedKeyword: true,
          updatedAt: true,
          _count: {
            select: {
              postLinks: true,
            },
          },
        },
      })
      .catch((error) => {
        if (isPrismaSchemaMismatchError(error)) {
          return []
        }

        throw error
      })

    const [forbiddenKeywords, seoKeywords] = await Promise.all([forbiddenKeywordsPromise, seoKeywordsPromise])

    return {
      forbiddenKeywords,
      seoKeywords: seoKeywords.map((item) => ({
        id: item.id,
        keyword: item.keyword,
        normalizedKeyword: item.normalizedKeyword,
        postCount: item._count.postLinks,
        updatedAt: item.updatedAt,
      })),
    }
  })
}
