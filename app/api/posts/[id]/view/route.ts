import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

import { prisma } from "@/lib/prisma"
import { createRateLimitResponse, getIP, rateLimit } from "@/lib/rate-limit"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getIP(request)
  const { success, reset } = rateLimit(ip, { limit: 30, windowMs: 60 * 1000 })

  if (!success) {
    return createRateLimitResponse(reset)
  }

  const { id } = await params

  const updatedPost = await prisma.post.update({
    where: { id },
    data: { views: { increment: 1 } },
    select: { slug: true, category: { select: { slug: true } } }
  })

  // Revalidate tags and path to make the view count update visible
  revalidateTag("posts")
  if (updatedPost.category?.slug) {
    revalidatePath(`/${updatedPost.category.slug}/${updatedPost.slug}`)
  }

  return NextResponse.json({ ok: true })
}
