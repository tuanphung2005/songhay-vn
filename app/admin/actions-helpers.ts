import { redirect } from "next/navigation"

import { type EditorialStatus, type UserRole } from "@prisma/client"

import { can, canPublishNow, canSubmitPendingPublish } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slug"

export function ensurePermission(condition: boolean, redirectTo: string) {
  if (!condition) {
    redirect(redirectTo)
  }
}

export function resolveEditorialFromSubmitAction({
  submitAction,
  role,
}: {
  submitAction: string
  role: UserRole
}): {
  editorialStatus: EditorialStatus
  isDraft: boolean
  isPublished: boolean
} {
  if (submitAction === "save-draft") {
    return {
      editorialStatus: "DRAFT",
      isDraft: true,
      isPublished: false,
    }
  }

  if (submitAction === "submit-publish" && canSubmitPendingPublish(role)) {
    return {
      editorialStatus: "PENDING_PUBLISH",
      isDraft: false,
      isPublished: false,
    }
  }

  if (submitAction === "publish" && canPublishNow(role)) {
    return {
      editorialStatus: "PUBLISHED",
      isDraft: false,
      isPublished: true,
    }
  }

  if (submitAction === "submit-review" && can(role, "submit-pending-review")) {
    return {
      editorialStatus: "PENDING_REVIEW",
      isDraft: false,
      isPublished: false,
    }
  }

  return {
    editorialStatus: "DRAFT",
    isDraft: true,
    isPublished: false,
  }
}

export function getPlainTextFromHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export async function uniqueCategorySlug(baseName: string, currentId?: string) {
  const base = slugify(baseName)
  let candidate = base
  let index = 1

  while (true) {
    const found = await prisma.category.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!found || found.id === currentId) {
      return candidate
    }
    candidate = `${base}-${index}`
    index += 1
  }
}

export async function uniquePostSlug(baseTitle: string) {
  const base = slugify(baseTitle)
  let candidate = base
  let index = 1

  while (true) {
    const found = await prisma.post.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!found) {
      return candidate
    }
    index += 1
    candidate = `${base}-${index}`
  }
}

export async function logPostHistory({
  postId,
  actorId,
  actionType,
  fromStatus,
  toStatus,
  snapshotTitle,
  snapshotExcerpt,
  snapshotContent,
}: {
  postId: string
  actorId: string
  actionType: string
  fromStatus?: EditorialStatus | null
  toStatus?: EditorialStatus | null
  snapshotTitle?: string | null
  snapshotExcerpt?: string | null
  snapshotContent?: string | null
}) {
  await prisma.postHistory.create({
    data: {
      postId,
      actorId,
      actionType,
      fromStatus,
      toStatus,
      snapshotTitle,
      snapshotExcerpt,
      snapshotContent,
    },
  })
}

import { revalidateTag, revalidatePath } from "next/cache"

export async function revalidatePost(slug?: string, categorySlug?: string) {
  // @ts-ignore - Next.js 15+ requires "max" but typings might be outdated
  if (slug) revalidateTag(`post:${slug}`, "max")
  if (categorySlug) {
    // @ts-ignore
    revalidateTag(`category:${categorySlug}`, "max")
    revalidatePath(`/${categorySlug}`)
    if (slug) revalidatePath(`/${categorySlug}/${slug}`)
  }
  // @ts-ignore
  revalidateTag("homepage", "max")
  // @ts-ignore
  revalidateTag("latest-by-category", "max")
  // @ts-ignore
  revalidateTag("trending-posts", "max")
  // @ts-ignore
  revalidateTag("search-results", "max")
  // @ts-ignore
  revalidateTag("recommended-posts", "max")
  // @ts-ignore
  revalidateTag("most-watched-videos", "max")
  revalidatePath("/")
}
