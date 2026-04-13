import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

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
