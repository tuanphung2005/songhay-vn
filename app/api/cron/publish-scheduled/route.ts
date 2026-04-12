import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { clearDataCache } from "@/lib/data-cache"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()

    const postsToPublish = await prisma.post.findMany({
      where: {
        editorialStatus: "PENDING_PUBLISH",
        scheduledPublishAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        category: {
          select: {
            slug: true,
          }
        },
        slug: true,
      }
    })

    if (postsToPublish.length === 0) {
      return NextResponse.json({ message: "No posts to publish" })
    }

    await prisma.post.updateMany({
      where: {
        id: { in: postsToPublish.map(p => p.id) },
      },
      data: {
        editorialStatus: "PUBLISHED",
        isPublished: true,
        isDraft: false,
        publishedAt: new Date(),
        scheduledPublishAt: null, // Clear it out once published
      },
    })

    // Revalidate paths for all published posts
    postsToPublish.forEach(post => {
      revalidatePath(`/${post.category.slug}`)
      revalidatePath(`/${post.category.slug}/${post.slug}`)
    })
    
    revalidatePath("/")
    clearDataCache()

    return NextResponse.json({ 
      message: `Published ${postsToPublish.length} posts successfully`,
      count: postsToPublish.length 
    })
  } catch (error) {
    console.error("Cron publish error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
