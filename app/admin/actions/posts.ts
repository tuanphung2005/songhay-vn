"use server"

// @ts-ignore
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"

import { requireCmsUser } from "@/lib/auth"
import { uploadThumbnail } from "@/lib/cloudinary"
import { clearDataCache } from "@/lib/data-cache"
import {
  can,
  canPublishNow,
  canTrashOrDeletePost,
} from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { resolvePostSeoInput } from "@/lib/post-seo"
import {
  resolveSeoKeywordSelection,
  resolveSeoKeywordSelectionForPreview,
  syncPostSeoKeywords,
} from "@/lib/seo-keyword-store"
import {
  ensurePermission,
  getPlainTextFromHtml,
  resolveEditorialFromSubmitAction,
  uniquePostSlug,
  logPostHistory,
} from "@/app/admin/actions-helpers"

export async function createPost(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(
    can(currentUser.role, "create-post"),
    "/admin?tab=write&toast=post_action_forbidden"
  )

  const title = String(formData.get("title") || "").trim()
  const penName = String(formData.get("penName") || "").trim()
  const excerpt = String(formData.get("excerpt") || "").trim()
  const content = String(formData.get("content") || "").trim()
  const plainContent = getPlainTextFromHtml(content)
  const mainCategoryId = String(formData.get("mainCategoryId") || "").trim()
  const subcategoryId = String(formData.get("subcategoryId") || "").trim()
  const categoryId = subcategoryId || mainCategoryId
  const rawSeoTitle = String(formData.get("seoTitle") || "").trim()
  const rawSeoDescription = String(formData.get("seoDescription") || "").trim()
  const manualOgImage = String(formData.get("ogImage") || "").trim() || null
  const videoEmbedUrl =
    String(formData.get("videoEmbedUrl") || "").trim() || null
  const isSensitive = formData.get("isSensitive") === "on"
  const isFeatured = formData.get("isFeatured") === "on"
  const isTrending = formData.get("isTrending") === "on"
  const submitAction = String(formData.get("submitAction") || "").trim()
  const thumbnailUpload = formData.get("thumbnailUpload")
  const thumbnailUrlInput = String(formData.get("thumbnailUrl") || "").trim()

  if (!title || !penName) {
    redirect("/admin?tab=write&toast=missing_fields")
  }

  if (submitAction !== "save-draft" && (!excerpt || !plainContent || !categoryId)) {
    redirect("/admin?tab=write&toast=missing_fields")
  }

  const { seoTitle, seoDescription } = resolvePostSeoInput({
    title,
    excerpt,
    content: plainContent,
    seoTitle: rawSeoTitle,
    seoDescription: rawSeoDescription,
  })

  const slug = await uniquePostSlug(title)
  const thumbnailUrl =
    thumbnailUpload instanceof File && thumbnailUpload.size > 0
      ? await uploadThumbnail(thumbnailUpload)
      : thumbnailUrlInput || null
  const ogImage = thumbnailUrl || manualOgImage

  const { editorialStatus, isPublished, isDraft } =
    resolveEditorialFromSubmitAction({
      submitAction,
      role: currentUser.role,
    })

  const { keywordIds, seoKeywordsText } =
    await resolveSeoKeywordSelectionForPreview(formData)

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      penName,
      excerpt,
      content,
      categoryId,
      authorId: currentUser.id,
      seoTitle,
      seoDescription,
      seoKeywords: seoKeywordsText,
      ogImage,
      videoEmbedUrl,
      isSensitive,
      isFeatured,
      isTrending,
      isPublished,
      isDraft,
      editorialStatus,
      approvedAt: isPublished ? new Date() : null,
      approverId: isPublished ? currentUser.id : null,
      publishedAt: isPublished ? new Date() : undefined,
      thumbnailUrl,
    },
  })

  await syncPostSeoKeywords(post.id, keywordIds)

  await logPostHistory({
    postId: post.id,
    actorId: currentUser.id,
    actionType: "CREATED",
    toStatus: post.editorialStatus,
    snapshotTitle: post.title,
    snapshotExcerpt: post.excerpt,
    snapshotContent: post.content,
  })

  revalidatePath("/")
  revalidatePath("/admin")
  revalidateTag("posts")
  revalidateTag("homepage")
  clearDataCache()
  if (editorialStatus === "DRAFT") {
    redirect("/admin?tab=personal-archive&toast=post_saved_draft")
  }

  if (isPublished) {
    redirect("/admin?tab=posts&toast=post_published")
  }

  if (editorialStatus === "PENDING_PUBLISH") {
    redirect(
      "/admin?tab=posts&postsStatus=pending-publish&toast=post_submitted_publish"
    )
  }

  redirect(
    "/admin?tab=posts&postsStatus=pending-review&toast=post_submitted_review"
  )
}

export async function createPostForPreview(
  formData: FormData
): Promise<{ postId: string } | { error: string }> {
  const currentUser = await requireCmsUser()
  ensurePermission(
    can(currentUser.role, "create-post"),
    "/admin?tab=write&toast=post_action_forbidden"
  )

  const title = String(formData.get("title") || "").trim()
  const penName = String(formData.get("penName") || "").trim()
  const excerpt = String(formData.get("excerpt") || "").trim()
  const content = String(formData.get("content") || "").trim()
  const plainContent = getPlainTextFromHtml(content)
  const mainCategoryId = String(formData.get("mainCategoryId") || "").trim()
  const subcategoryId = String(formData.get("subcategoryId") || "").trim()
  const categoryId = subcategoryId || mainCategoryId
  const rawSeoTitle = String(formData.get("seoTitle") || "").trim()
  const rawSeoDescription = String(formData.get("seoDescription") || "").trim()
  const videoEmbedUrl =
    String(formData.get("videoEmbedUrl") || "").trim() || null
  const isSensitive = formData.get("isSensitive") === "on"
  const thumbnailUpload = formData.get("thumbnailUpload")
  const thumbnailUrlInput = String(formData.get("thumbnailUrl") || "").trim()

  if (!title || !penName) {
    return { error: "missing_fields" }
  }

  const { seoTitle, seoDescription } = resolvePostSeoInput({
    title,
    excerpt,
    content: plainContent,
    seoTitle: rawSeoTitle,
    seoDescription: rawSeoDescription,
  })

  const slug = await uniquePostSlug(title)
  const thumbnailUrl =
    thumbnailUpload instanceof File && thumbnailUpload.size > 0
      ? await uploadThumbnail(thumbnailUpload)
      : thumbnailUrlInput || null

  const { keywordIds, seoKeywordsText } =
    await resolveSeoKeywordSelection(formData)

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      penName,
      excerpt,
      content,
      categoryId,
      authorId: currentUser.id,
      seoTitle,
      seoDescription,
      seoKeywords: seoKeywordsText,
      ogImage: thumbnailUrl,
      videoEmbedUrl,
      isSensitive,
      isPublished: false,
      isDraft: true,
      editorialStatus: "DRAFT",
      thumbnailUrl,
    },
  })

  await syncPostSeoKeywords(post.id, keywordIds)

  await logPostHistory({
    postId: post.id,
    actorId: currentUser.id,
    actionType: "CREATED",
    toStatus: post.editorialStatus,
    snapshotTitle: post.title,
    snapshotExcerpt: post.excerpt,
    snapshotContent: post.content,
  })

  revalidatePath("/admin")
  return { postId: post.id }
}

export async function updatePostFlags(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(
    canPublishNow(currentUser.role),
    "/admin?tab=posts&toast=post_action_forbidden"
  )

  const postId = String(formData.get("postId") || "")
  const isFeatured = formData.get("isFeatured") === "on"
  const isTrending = formData.get("isTrending") === "on"
  const isPublished = formData.get("isPublished") === "on"
  const rawSeoTitle = String(formData.get("seoTitle") || "").trim()
  const rawSeoDescription = String(formData.get("seoDescription") || "").trim()

  if (!postId) {
    return
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      title: true,
      excerpt: true,
      content: true,
    },
  })

  if (!existingPost) {
    return
  }

  const { seoTitle, seoDescription } = resolvePostSeoInput({
    title: existingPost.title,
    excerpt: existingPost.excerpt,
    content: getPlainTextFromHtml(existingPost.content),
    seoTitle: rawSeoTitle,
    seoDescription: rawSeoDescription,
  })

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      isFeatured,
      isTrending,
      isPublished,
      seoTitle,
      seoDescription,
    },
    include: { category: true },
  })

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "UPDATED",
  })

  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath(`/${updatedPost.category.slug}`)
  revalidatePath(`/${updatedPost.category.slug}/${updatedPost.slug}`)
  revalidateTag("posts")
  revalidateTag("homepage")
  clearDataCache()
}

export async function movePostToTrash(formData: FormData) {
  const currentUser = await requireCmsUser()

  const postId = String(formData.get("postId") || "")
  const sourceTabRaw = String(formData.get("sourceTab") || "").trim()
  const sourceTab =
    sourceTabRaw === "personal-archive" ? "personal-archive" : "posts"
  if (!postId) {
    redirect(`/admin?tab=${sourceTab}&toast=post_action_failed`)
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      authorId: true,
      slug: true,
      editorialStatus: true,
      category: {
        select: {
          slug: true,
        },
      },
    },
  })

  if (!existingPost) {
    redirect(`/admin?tab=${sourceTab}&toast=post_not_found`)
  }

  if (!canTrashOrDeletePost(currentUser.role, existingPost.authorId, currentUser.id, existingPost.editorialStatus)) {
    redirect(`/admin?tab=${sourceTab}&toast=post_action_forbidden`)
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      isPublished: false,
      isFeatured: false,
      isTrending: false,
    },
  })

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "TRASHED",
    fromStatus: existingPost.editorialStatus,
  })

  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath(`/${existingPost.category.slug}`)
  revalidatePath(`/${existingPost.category.slug}/${existingPost.slug}`)
  revalidateTag("posts")
  revalidateTag("homepage")
  clearDataCache()
  redirect(`/admin?tab=${sourceTab}&toast=post_moved_trash`)
}

export async function restorePostFromTrash(formData: FormData) {
  const currentUser = await requireCmsUser()

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    redirect("/admin?tab=trash&toast=post_action_failed")
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      authorId: true,
      editorialStatus: true,
    },
  })

  if (!existingPost) {
    redirect("/admin?tab=trash&toast=post_not_found")
  }

  if (!canTrashOrDeletePost(currentUser.role, existingPost.authorId, currentUser.id, existingPost.editorialStatus)) {
    redirect("/admin?tab=trash&toast=post_action_forbidden")
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  })

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "RESTORED",
    toStatus: existingPost.editorialStatus,
  })

  revalidatePath("/")
  revalidatePath("/admin")
  revalidateTag("posts")
  revalidateTag("homepage")
  clearDataCache()
  redirect("/admin?tab=trash&toast=post_restored")
}

export async function deletePostPermanently(formData: FormData) {
  const currentUser = await requireCmsUser()

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    redirect("/admin?tab=trash&toast=post_action_failed")
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      authorId: true,
      editorialStatus: true,
    },
  })

  if (!existingPost) {
    redirect("/admin?tab=trash&toast=post_not_found")
  }

  if (!canTrashOrDeletePost(currentUser.role, existingPost.authorId, currentUser.id, existingPost.editorialStatus)) {
    redirect("/admin?tab=trash&toast=post_action_forbidden")
  }

  await prisma.post.delete({ where: { id: postId } })

  revalidatePath("/")
  revalidatePath("/admin")
  revalidateTag("posts")
  revalidateTag("homepage")
  clearDataCache()
  redirect("/admin?tab=trash&toast=post_deleted_permanently")
}
