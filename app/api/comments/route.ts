import { NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

const commentSchema = z.object({
  postId: z.string().min(1),
  authorName: z.string().min(2).max(80),
  content: z.string().min(5).max(1000),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = commentSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu bình luận không hợp lệ." }, { status: 400 })
  }

  await prisma.comment.create({
    data: {
      postId: parsed.data.postId,
      authorName: parsed.data.authorName,
      content: parsed.data.content,
      isApproved: false,
    },
  })

  return NextResponse.json({ ok: true })
}
