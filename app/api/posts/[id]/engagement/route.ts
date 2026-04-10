import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { createRateLimitResponse, getIP, rateLimit } from "@/lib/rate-limit"

const schema = z.object({
  dwellSeconds: z.number().int().min(1).max(3600),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getIP(request)
  const { success, reset } = rateLimit(ip, { limit: 10, windowMs: 60 * 1000 })

  if (!success) {
    return createRateLimitResponse(reset)
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
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
