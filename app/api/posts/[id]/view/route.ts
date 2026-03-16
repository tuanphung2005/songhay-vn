import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

const VIEW_DEDUP_WINDOW_SECONDS = 60 * 60 * 6

function buildViewCookieKey(postId: string) {
  return `songhay_post_view_${postId}`
}

export async function POST(
  _request: unknown,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const viewCookieKey = buildViewCookieKey(id)
  const cookieStore = await cookies()
  const viewed = cookieStore.get(viewCookieKey)?.value === "1"

  if (viewed) {
    return NextResponse.json({ ok: true, deduped: true })
  }

  await prisma.post.update({
    where: { id },
    data: { views: { increment: 1 } },
  })

  cookieStore.set(viewCookieKey, "1", {
    maxAge: VIEW_DEDUP_WINDOW_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })

  return NextResponse.json({ ok: true, deduped: false })
}
