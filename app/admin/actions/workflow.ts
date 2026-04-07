"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireCmsUser } from "@/lib/auth"
import { clearDataCache } from "@/lib/data-cache"
import {
  can,
  canApprovePendingReview,
  canPublishNow,
  canSubmitPendingPublish,
  canViewAllPosts,
} from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import {
  ensurePermission,
  logPostHistory,
} from "@/app/admin/actions-helpers"

export async function approvePendingPost(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(canApprovePendingReview(currentUser.role), "/admin?tab=posts&postsStatus=pending-review&toast=post_action_forbidden")

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { editorialStatus: true },
  })

  if (!existingPost) return

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: canPublishNow(currentUser.role) ? "PUBLISHED" : "PENDING_PUBLISH",
      isPublished: canPublishNow(currentUser.role),
      isDraft: false,
      approverId: currentUser.id,
      approvedAt: new Date(),
      publishedAt: canPublishNow(currentUser.role) ? new Date() : undefined,
    },
  })

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "STATUS_CHANGED",
    fromStatus: existingPost.editorialStatus,
    toStatus: updatedPost.editorialStatus,
  })

  revalidatePath("/")
  revalidatePath("/admin")
  clearDataCache()
  redirect(
    canPublishNow(currentUser.role)
      ? "/admin?tab=posts&postsStatus=published&toast=post_approved"
      : "/admin?tab=posts&postsStatus=pending-publish&toast=post_submitted_publish"
  )
}

export async function rejectPendingPost(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(canApprovePendingReview(currentUser.role), "/admin?tab=posts&postsStatus=pending-review&toast=post_action_forbidden")

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { editorialStatus: true },
  })

  if (!existingPost) return

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "REJECTED",
      isPublished: false,
      isDraft: false,
      approverId: null,
      approvedAt: null,
    },
  })

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "STATUS_CHANGED",
    fromStatus: existingPost.editorialStatus,
    toStatus: updatedPost.editorialStatus,
  })

  revalidatePath("/admin")
  clearDataCache()
  redirect("/admin?tab=posts&postsStatus=rejected&toast=post_rejected")
}

export async function submitPostToPendingReview(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(can(currentUser.role, "submit-pending-review"), "/admin?tab=posts&postsStatus=all&toast=post_action_forbidden")

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, editorialStatus: true },
  })

  if (!existingPost) {
    redirect("/admin?tab=posts&postsStatus=all&toast=post_not_found")
  }

  if (!canViewAllPosts(currentUser.role) && existingPost.authorId !== currentUser.id) {
    redirect("/admin?tab=posts&postsStatus=all&toast=post_action_forbidden")
  }

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "PENDING_REVIEW",
      isPublished: false,
      isDraft: false,
      approverId: null,
      approvedAt: null,
      publishedAt: undefined,
    },
  })

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "STATUS_CHANGED",
    fromStatus: existingPost.editorialStatus,
    toStatus: updatedPost.editorialStatus,
  })

  revalidatePath("/")
  revalidatePath("/admin")
  clearDataCache()
  redirect("/admin?tab=posts&postsStatus=pending-review&toast=post_submitted_review")
}

export async function promotePostToPendingPublish(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(
    canApprovePendingReview(currentUser.role) || canSubmitPendingPublish(currentUser.role),
    "/admin?tab=posts&postsStatus=pending-review&toast=post_action_forbidden"
  )

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { editorialStatus: true },
  })

  if (!existingPost) return

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "PENDING_PUBLISH",
      isPublished: false,
      isDraft: false,
      approverId: currentUser.id,
      approvedAt: new Date(),
      publishedAt: undefined,
    },
  })

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "STATUS_CHANGED",
    fromStatus: existingPost.editorialStatus,
    toStatus: updatedPost.editorialStatus,
  })

  revalidatePath("/")
  revalidatePath("/admin")
  clearDataCache()
  redirect("/admin?tab=posts&postsStatus=pending-publish&toast=post_submitted_publish")
}

export async function returnPostToPendingReview(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(canApprovePendingReview(currentUser.role), "/admin?tab=posts&postsStatus=all&toast=post_action_forbidden")

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { editorialStatus: true },
  })

  if (!existingPost) return

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "PENDING_REVIEW",
      isPublished: false,
      isDraft: false,
      approverId: null,
      approvedAt: null,
    },
  })

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "STATUS_CHANGED",
    fromStatus: existingPost.editorialStatus,
    toStatus: updatedPost.editorialStatus,
  })

  revalidatePath("/")
  revalidatePath("/admin")
  clearDataCache()
  redirect("/admin?tab=posts&postsStatus=pending-review&toast=post_returned_review")
}

export async function returnPostToPendingPublish(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(canPublishNow(currentUser.role), "/admin?tab=posts&postsStatus=published&toast=post_action_forbidden")

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { editorialStatus: true },
  })

  if (!existingPost) return

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "PENDING_PUBLISH",
      isPublished: false,
      isDraft: false,
    },
  })

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "STATUS_CHANGED",
    fromStatus: existingPost.editorialStatus,
    toStatus: updatedPost.editorialStatus,
  })

  revalidatePath("/")
  revalidatePath("/admin")
  clearDataCache()
  redirect("/admin?tab=posts&postsStatus=pending-publish&toast=post_returned_publish_queue")
}

export async function returnPostToDraft(formData: FormData) {
  const currentUser = await requireCmsUser()

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, editorialStatus: true },
  })

  if (!existingPost) {
    redirect("/admin?tab=posts&postsStatus=all&toast=post_not_found")
  }

  const canManageWorkflow = canApprovePendingReview(currentUser.role) || canPublishNow(currentUser.role)
  if (!canManageWorkflow && existingPost.authorId !== currentUser.id) {
    redirect("/admin?tab=posts&postsStatus=all&toast=post_action_forbidden")
  }

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "DRAFT",
      isPublished: false,
      isDraft: true,
      approverId: null,
      approvedAt: null,
      publishedAt: undefined,
    },
  })

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "STATUS_CHANGED",
    fromStatus: existingPost.editorialStatus,
    toStatus: updatedPost.editorialStatus,
  })

  revalidatePath("/")
  revalidatePath("/admin")
  clearDataCache()
  redirect("/admin?tab=posts&postsStatus=draft&toast=post_returned_draft")
}
