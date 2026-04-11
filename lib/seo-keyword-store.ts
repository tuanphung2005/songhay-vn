import { prisma } from "@/lib/prisma"
import { normalizeKeyword, parseSeoKeywordInput } from "@/lib/seo-keywords"

import type { ResolvedSeoKeywordSelection } from "@/types/seo"

export type { ResolvedSeoKeywordSelection }

function dedupeKeywords(keywords: string[]) {
  const map = new Map<string, string>()
  for (const item of keywords) {
    const normalized = normalizeKeyword(item)
    if (!normalized || map.has(normalized)) {
      continue
    }
    map.set(normalized, item)
  }
  return [...map.values()]
}

export async function resolveSeoKeywordSelection(formData: FormData): Promise<ResolvedSeoKeywordSelection> {
  const selectedIds = formData
    .getAll("seoKeywordIds")
    .map((value) => String(value).trim())
    .filter(Boolean)

  const manualKeywords = parseSeoKeywordInput(String(formData.get("seoKeywords") || ""))
  const upserted = await Promise.all(
    manualKeywords.map((keyword) =>
      prisma.seoKeyword.upsert({
        where: { normalizedKeyword: normalizeKeyword(keyword) },
        create: {
          keyword,
          normalizedKeyword: normalizeKeyword(keyword),
        },
        update: {
          keyword,
        },
        select: { id: true },
      })
    )
  )

  const uniqueIds = [...new Set([...selectedIds, ...upserted.map((item) => item.id)])]

  if (uniqueIds.length === 0) {
    return {
      keywordIds: [],
      seoKeywordsText: null,
    }
  }

  const selectedKeywords = await prisma.seoKeyword.findMany({
    where: { id: { in: uniqueIds } },
    orderBy: { keyword: "asc" },
    select: { id: true, keyword: true },
  })

  const keywordLabels = dedupeKeywords(selectedKeywords.map((item) => item.keyword))

  return {
    keywordIds: selectedKeywords.map((item) => item.id),
    seoKeywordsText: keywordLabels.join(", ") || null,
  }
}

export async function resolveSeoKeywordSelectionForPreview(formData: FormData): Promise<ResolvedSeoKeywordSelection> {
  const selectedIds = formData
    .getAll("seoKeywordIds")
    .map((value) => String(value).trim())
    .filter(Boolean)

  const uniqueSelectedIds = [...new Set(selectedIds)]
  const manualKeywords = parseSeoKeywordInput(String(formData.get("seoKeywords") || ""))

  if (uniqueSelectedIds.length === 0) {
    return {
      keywordIds: [],
      seoKeywordsText: manualKeywords.join(", ") || null,
    }
  }

  const selectedKeywords = await prisma.seoKeyword.findMany({
    where: { id: { in: uniqueSelectedIds } },
    orderBy: { keyword: "asc" },
    select: { id: true, keyword: true },
  })

  const keywordLabels = dedupeKeywords([...selectedKeywords.map((item) => item.keyword), ...manualKeywords])

  return {
    keywordIds: selectedKeywords.map((item) => item.id),
    seoKeywordsText: keywordLabels.join(", ") || null,
  }
}

export async function syncPostSeoKeywords(postId: string, keywordIds: string[]) {
  if (keywordIds.length === 0) {
    await prisma.postSeoKeyword.deleteMany({ where: { postId } })
    return
  }

  await prisma.$transaction([
    prisma.postSeoKeyword.deleteMany({
      where: {
        postId,
        seoKeywordId: { notIn: keywordIds },
      },
    }),
    prisma.postSeoKeyword.createMany({
      data: keywordIds.map((seoKeywordId) => ({ postId, seoKeywordId })),
      skipDuplicates: true,
    }),
  ])
}

export async function ensureSeoKeywordStoreSeeded() {
  const existingKeywordCount = await prisma.seoKeyword.count()
  if (existingKeywordCount > 0) {
    return
  }

  const postsWithLegacyKeywords = await prisma.post.findMany({
    where: {
      seoKeywords: {
        not: null,
      },
    },
    select: {
      id: true,
      seoKeywords: true,
    },
    take: 2000,
  })

  for (const post of postsWithLegacyKeywords) {
    const keywords = parseSeoKeywordInput(post.seoKeywords || "")
    if (keywords.length === 0) {
      continue
    }

    const upsertedKeywords = await Promise.all(
      keywords.map((keyword) =>
        prisma.seoKeyword.upsert({
          where: { normalizedKeyword: normalizeKeyword(keyword) },
          create: {
            keyword,
            normalizedKeyword: normalizeKeyword(keyword),
          },
          update: {
            keyword,
          },
          select: { id: true },
        })
      )
    )

    await prisma.postSeoKeyword.createMany({
      data: upsertedKeywords.map((item) => ({
        postId: post.id,
        seoKeywordId: item.id,
      })),
      skipDuplicates: true,
    })
  }
}
