import type { EditorialStatus, UserRole } from "@/generated/prisma/client"

import { can, canPublishNow, canSubmitPendingPublish } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slug"

export function getPlainTextFromHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export async function uniquePostSlug(baseTitle: string, currentId: string) {
  const base = slugify(baseTitle)
  let candidate = base
  let index = 1

  while (true) {
    const found = await prisma.post.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })

    if (!found || found.id === currentId) {
      return candidate
    }

    candidate = `${base}-${index}`
    index += 1
  }
}

export function sortCategoriesByTree<T extends { id: string; parentId: string | null }>(categories: T[]) {
  const roots = categories.filter((category) => !category.parentId)
  const sorted: T[] = []

  for (const root of roots) {
    sorted.push(root)
    sorted.push(...categories.filter((category) => category.parentId === root.id))
  }

  return sorted
}

export function resolveEditorialFromSubmitAction({
  submitAction,
  role,
}: {
  submitAction: string
  role: UserRole
}): { editorialStatus: EditorialStatus; isPublished: boolean; isDraft: boolean } {
  const shouldSaveDraft = submitAction === "save-draft"
  const shouldSubmitPublish = submitAction === "submit-publish" && canSubmitPendingPublish(role)
  const shouldPublish = submitAction === "publish" && canPublishNow(role)
  const shouldSubmitReview = submitAction === "submit-review" && can(role, "submit-pending-review")

  const editorialStatus: EditorialStatus = shouldSaveDraft
    ? "DRAFT"
    : shouldPublish
      ? "PUBLISHED"
      : shouldSubmitPublish
        ? "PENDING_PUBLISH"
        : shouldSubmitReview
          ? "PENDING_REVIEW"
          : "DRAFT"

  return {
    editorialStatus,
    isPublished: editorialStatus === "PUBLISHED",
    isDraft: editorialStatus === "DRAFT",
  }
}
