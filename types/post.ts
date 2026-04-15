import { Prisma } from "@prisma/client"

export type PostListItem = Prisma.PostGetPayload<{
  include: {
    category: true
    _count: { select: { comments: { where: { isApproved: true } } } }
  }
}>

export type PostFull = Prisma.PostGetPayload<{
  include: {
    category: true
    comments: {
      where: { isApproved: true }
    }
  }
}>

export type PostCompact = {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  excerpt: string
  publishedAt: Date
  category: {
    name: string
    slug: string
  }
  _count: {
    comments: number
  }
}

export type PostWithCategory = Prisma.PostGetPayload<{
  include: {
    category: true
  }
}>
