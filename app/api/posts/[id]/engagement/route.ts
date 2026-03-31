import { NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

const schema = z.object({
  dwellSeconds: z.number().int().min(1).max(3600),
})

export async function POST(
  request: unknown,
  { params }: { params: Promise<{ id: string }> }
) {
  const incomingRequest = request as Request
  const { id } = await params

  const body = await incomingRequest.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  }

  const post = await prisma.post.findUnique({ where: { id }, select: { id: true } })
  if (!post) {
    return NextResponse.json({ error: "post_not_found" }, { status: 404 })
  }

  await prisma.postEngagementEvent.create({
    data: {
      postId: id,
      dwellSeconds: parsed.data.dwellSeconds,
    },
  })

  return NextResponse.json({ ok: true })
}
