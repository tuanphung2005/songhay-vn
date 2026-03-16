import { NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

const schema = z.object({
  postId: z.string().min(1),
  authorName: z.string().trim().min(2).max(80).optional(),
  content: z.string().min(3).max(800),
})

export async function POST(request: unknown) {
  const incomingRequest = request as Request

  const body = await incomingRequest.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  }

  const post = await prisma.post.findUnique({ where: { id: parsed.data.postId }, select: { id: true } })
  if (!post) {
    return NextResponse.json({ error: "post_not_found" }, { status: 404 })
  }

  const authorName = parsed.data.authorName?.trim() || "Bạn đọc"

  await prisma.comment.create({
    data: {
      postId: parsed.data.postId,
      authorId: null,
      authorName,
      content: parsed.data.content,
      isApproved: false,
    },
  })

  return NextResponse.json({ success: true })
}
