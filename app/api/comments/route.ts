import { NextResponse } from "next/server"
import { z } from "zod"

import { authCookieName, decodeSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  postId: z.string().min(1),
  content: z.string().min(3).max(800),
})

function readCookie(raw: string | null, name: string) {
  if (!raw) {
    return null
  }

  const chunks = raw.split(";")
  for (const chunk of chunks) {
    const [key, ...rest] = chunk.trim().split("=")
    if (key === name) {
      return decodeURIComponent(rest.join("="))
    }
  }

  return null
}

export async function POST(request: unknown) {
  const incomingRequest = request as Request
  const token = readCookie(incomingRequest.headers.get("cookie"), authCookieName)
  const session = decodeSession(token)

  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = await incomingRequest.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true },
  })

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const post = await prisma.post.findUnique({ where: { id: parsed.data.postId }, select: { id: true } })
  if (!post) {
    return NextResponse.json({ error: "post_not_found" }, { status: 404 })
  }

  await prisma.comment.create({
    data: {
      postId: parsed.data.postId,
      authorId: user.id,
      authorName: user.name,
      content: parsed.data.content,
      isApproved: false,
    },
  })

  return NextResponse.json({ success: true })
}
