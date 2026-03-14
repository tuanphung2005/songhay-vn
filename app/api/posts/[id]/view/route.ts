import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export async function POST(
  _request: unknown,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  await prisma.post.update({
    where: { id },
    data: { views: { increment: 1 } },
  })

  return NextResponse.json({ ok: true })
}
