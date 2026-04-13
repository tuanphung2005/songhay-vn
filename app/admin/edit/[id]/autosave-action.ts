"use server"

import { prisma } from "@/lib/prisma"
import { requireCmsUser } from "@/lib/auth"
import { canEditByStatus } from "@/lib/permissions"

export async function autosaveDraftAction(postId: string, data: { title: string; excerpt: string; content: string }) {
  const currentUser = await requireCmsUser()
  const currentPost = await prisma.post.findUnique({ where: { id: postId } })
  
  if (!currentPost) return { error: "not_found" }
  if (!canEditByStatus(currentUser.role, currentPost.editorialStatus)) return { error: "forbidden" }

  await prisma.post.update({
    where: { id: postId },
    data: {
      title: data.title || currentPost.title,
      excerpt: data.excerpt || currentPost.excerpt,
      content: data.content || currentPost.content,
      editorialStatus: "DRAFT",
      isDraft: true,
      isPublished: false,
      lastEditorId: currentUser.id,
      updatedAt: new Date()
    }
  })
  
  return { success: true, timestamp: new Date().toISOString() }
}
