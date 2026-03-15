import { cache } from "react"

import { prisma } from "@/lib/prisma"

export const getHomepageData = cache(async () => {
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

export const getPostsByCategory = cache(async (categorySlug: string) => {
  return prisma.post.findMany({
    where: {
      isPublished: true,
      isDeleted: false,
      category: { slug: categorySlug },
    },
    include: { category: true },
    orderBy: { publishedAt: "desc" },
    take: 20,
  })
})

export const getCategoryBySlug = cache(async (categorySlug: string) => {
  return prisma.category.findUnique({
    where: { slug: categorySlug },
  })
})

export const getPostByCategoryAndSlug = cache(async (categorySlug: string, slug: string) => {
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

export const getRelatedPosts = cache(async (postId: string, categoryId: string) => {
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

export const getTrendingPosts = cache(async () => {
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
