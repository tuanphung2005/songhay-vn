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

  // Note: We deliberately do NOT revalidate the cache here.
  // Revalidating on every view defeats the purpose of ISR and causes massive cache writes.
  // The view count will naturally update when the page is revalidated via Time-based ISR or edits.

  return NextResponse.json({ ok: true })
}
