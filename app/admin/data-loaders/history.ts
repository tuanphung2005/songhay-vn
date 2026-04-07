import { prisma } from "@/lib/prisma"
import type { AdminTab } from "@/app/admin/data-types"

export async function getHistoryData(activeTab: AdminTab) {
  if (activeTab !== "history") return []

  const history = await prisma.postHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      post: {
        select: {
          id: true,
          title: true,
          slug: true,
          category: {
            select: { slug: true },
          },
        },
      },
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return history
}