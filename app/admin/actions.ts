"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { MediaAssetType, type UserRole } from "@/generated/prisma/client"

import { requireAdminUser, requireCmsUser, requireEditorInChiefUser } from "@/lib/auth"
import { uploadImageToCloudinary, uploadVideoToCloudinary, uploadThumbnail } from "@/lib/cloudinary"
import { clearDataCache } from "@/lib/data-cache"
import {
  can,
  canApprovePendingReview,
  canCreateSubordinateAccount,
  canPublishNow,
  canViewAllPosts,
  roleCanCreate,
} from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import {
  ensurePermission,
  getPlainTextFromHtml,
  resolveEditorialFromSubmitAction,
  uniqueCategorySlug,
  uniquePostSlug,
} from "@/app/admin/actions-helpers"

const MAX_VIDEO_UPLOAD_BYTES = 200 * 1024 * 1024

export async function createCategory(formData: FormData) {
  const currentUser = await requireAdminUser()
  ensurePermission(can(currentUser.role, "create-category"), "/admin?tab=categories&toast=post_action_forbidden")

  const name = String(formData.get("name") || "").trim()
  const description = String(formData.get("description") || "").trim()
  const parentIdRaw = String(formData.get("parentId") || "").trim()
  const parentId = parentIdRaw ? parentIdRaw : null

  if (!name) {
    redirect("/admin?tab=categories&toast=category_delete_failed")
  }

  const maxSortOrder = await prisma.category.aggregate({ _max: { sortOrder: true } })
  const nextSortOrder = (maxSortOrder._max.sortOrder || 0) + 1

  const slug = await uniqueCategorySlug(name)
  await prisma.category.upsert({
    where: { slug },
    update: { name, description, sortOrder: nextSortOrder, parentId },
    create: { name, slug, description, sortOrder: nextSortOrder, parentId },
  })

  revalidatePath("/")
  revalidatePath("/admin")
  clearDataCache()
  redirect("/admin?tab=categories&toast=category_created")
}

export async function createPost(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(can(currentUser.role, "create-post"), "/admin?tab=write&toast=post_action_forbidden")

  const title = String(formData.get("title") || "").trim()
  const excerpt = String(formData.get("excerpt") || "").trim()
  const content = String(formData.get("content") || "").trim()
  const plainContent = getPlainTextFromHtml(content)
  const categoryId = String(formData.get("categoryId") || "").trim()
  const seoTitle = String(formData.get("seoTitle") || "").trim() || null
  const seoDescription = String(formData.get("seoDescription") || "").trim() || null
  const seoKeywords = String(formData.get("seoKeywords") || "").trim() || null
  const manualOgImage = String(formData.get("ogImage") || "").trim() || null
  const videoEmbedUrl = String(formData.get("videoEmbedUrl") || "").trim() || null
  const isSensitive = formData.get("isSensitive") === "on"
  const isFeatured = formData.get("isFeatured") === "on"
  const isTrending = formData.get("isTrending") === "on"
  const submitAction = String(formData.get("submitAction") || "").trim()
  const thumbnailUpload = formData.get("thumbnailUpload")
  const thumbnailUrlInput = String(formData.get("thumbnailUrl") || "").trim()

  if (!title || !excerpt || !plainContent || !categoryId) {
    return
  }

  const slug = await uniquePostSlug(title)
  const thumbnailUrl =
    thumbnailUpload instanceof File && thumbnailUpload.size > 0
      ? await uploadThumbnail(thumbnailUpload)
      : thumbnailUrlInput || null
  const ogImage = thumbnailUrl || manualOgImage

  const { editorialStatus, isPublished, isDraft } = resolveEditorialFromSubmitAction({
    submitAction,
    role: currentUser.role,
  })

  await prisma.post.create({
    data: {
      title,
      slug,
      excerpt,
      content,
      categoryId,
      authorId: currentUser.id,
      seoTitle,
      seoDescription,
      seoKeywords,
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

  revalidatePath("/")
  revalidatePath("/admin")
  clearDataCache()
  if (editorialStatus === "DRAFT") {
    redirect("/admin?tab=personal-archive&toast=post_saved_draft")
  }

  if (isPublished) {
    redirect("/admin?tab=posts&toast=post_published")
  }

  if (editorialStatus === "PENDING_PUBLISH") {
    redirect("/admin?tab=posts&postsStatus=pending-publish&toast=post_submitted_publish")
  }

  redirect("/admin?tab=posts&postsStatus=pending-review&toast=post_submitted_review")
}

export async function createPostForPreview(formData: FormData): Promise<{ postId: string } | { error: string }> {
  const currentUser = await requireCmsUser()
  ensurePermission(can(currentUser.role, "create-post"), "/admin?tab=write&toast=post_action_forbidden")

  const title = String(formData.get("title") || "").trim()
  const excerpt = String(formData.get("excerpt") || "").trim()
  const content = String(formData.get("content") || "").trim()
  const plainContent = getPlainTextFromHtml(content)
  const mainCategoryId = String(formData.get("mainCategoryId") || "").trim()
  const subcategoryId = String(formData.get("subcategoryId") || "").trim()
  const categoryId = subcategoryId || mainCategoryId
  const seoTitle = String(formData.get("seoTitle") || "").trim() || null
  const seoDescription = String(formData.get("seoDescription") || "").trim() || null
  const seoKeywords = String(formData.get("seoKeywords") || "").trim() || null
  const videoEmbedUrl = String(formData.get("videoEmbedUrl") || "").trim() || null
  const isSensitive = formData.get("isSensitive") === "on"
  const thumbnailUpload = formData.get("thumbnailUpload")
  const thumbnailUrlInput = String(formData.get("thumbnailUrl") || "").trim()

  if (!title || !excerpt || !plainContent || !categoryId) {
    return { error: "missing_fields" }
  }

  const slug = await uniquePostSlug(title)
  const thumbnailUrl =
    thumbnailUpload instanceof File && thumbnailUpload.size > 0
      ? await uploadThumbnail(thumbnailUpload)
      : thumbnailUrlInput || null

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      excerpt,
      content,
      categoryId,
      authorId: currentUser.id,
      seoTitle,
      seoDescription,
      seoKeywords,
      ogImage: thumbnailUrl,
      videoEmbedUrl,
      isSensitive,
      isPublished: false,
      isDraft: true,
      editorialStatus: "DRAFT",
      thumbnailUrl,
    },
  })

  revalidatePath("/admin")
  return { postId: post.id }
}

export async function approvePendingPost(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(canApprovePendingReview(currentUser.role), "/admin?tab=posts&postsStatus=pending-review&toast=post_action_forbidden")

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return
  }

  await prisma.post.update({
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

  await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "REJECTED",
      isPublished: false,
      isDraft: false,
      approverId: null,
      approvedAt: null,
    },
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
    select: { authorId: true },
  })

  if (!existingPost) {
    redirect("/admin?tab=posts&postsStatus=all&toast=post_not_found")
  }

  if (!canViewAllPosts(currentUser.role) && existingPost.authorId !== currentUser.id) {
    redirect("/admin?tab=posts&postsStatus=all&toast=post_action_forbidden")
  }

  await prisma.post.update({
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

  revalidatePath("/")
  revalidatePath("/admin")
  clearDataCache()
  redirect("/admin?tab=posts&postsStatus=pending-review&toast=post_submitted_review")
}

export async function promotePostToPendingPublish(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(canApprovePendingReview(currentUser.role), "/admin?tab=posts&postsStatus=pending-review&toast=post_action_forbidden")

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return
  }

  await prisma.post.update({
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

  await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "PENDING_REVIEW",
      isPublished: false,
      isDraft: false,
      approverId: null,
      approvedAt: null,
    },
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

  await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "PENDING_PUBLISH",
      isPublished: false,
      isDraft: false,
    },
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
    select: { authorId: true },
  })

  if (!existingPost) {
    redirect("/admin?tab=posts&postsStatus=all&toast=post_not_found")
  }

  const canManageWorkflow = canApprovePendingReview(currentUser.role) || canPublishNow(currentUser.role)
  if (!canManageWorkflow && existingPost.authorId !== currentUser.id) {
    redirect("/admin?tab=posts&postsStatus=all&toast=post_action_forbidden")
  }

  await prisma.post.update({
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

  revalidatePath("/")
  revalidatePath("/admin")
  clearDataCache()
  redirect("/admin?tab=posts&postsStatus=draft&toast=post_returned_draft")
}

export async function uploadMediaAsset(formData: FormData) {
  const currentUser = await requireCmsUser()

  const file = formData.get("file")
  const assetTypeInput = String(formData.get("assetType") || "").trim().toLowerCase()

  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin?tab=media-library&toast=media_upload_failed")
  }

  const isVideo = assetTypeInput === "video"
  const selectedType = isVideo ? MediaAssetType.VIDEO : MediaAssetType.IMAGE

  if (selectedType === MediaAssetType.IMAGE && !file.type.startsWith("image/")) {
    redirect("/admin?tab=media-library&toast=media_upload_failed")
  }

  if (selectedType === MediaAssetType.VIDEO && !file.type.startsWith("video/")) {
    redirect("/admin?tab=media-library&toast=media_upload_failed")
  }

  if (selectedType === MediaAssetType.VIDEO && file.size > MAX_VIDEO_UPLOAD_BYTES) {
    redirect("/admin?tab=media-library&toast=media_upload_failed")
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const url =
    selectedType === MediaAssetType.IMAGE
      ? await uploadImageToCloudinary({
        buffer,
        filename: file.name,
        mimeType: file.type || "image/jpeg",
        folder: "songhay/editor",
      })
      : await uploadVideoToCloudinary({
        buffer,
        filename: file.name,
        mimeType: file.type || "video/mp4",
        folder: "songhay/editor/videos",
      })

  await prisma.mediaAsset.create({
    data: {
      assetType: selectedType,
      visibility: "SHARED",
      url,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      uploaderId: currentUser.id,
    },
  })

  revalidatePath("/admin")
  clearDataCache()
  redirect("/admin?tab=media-library&toast=media_uploaded")
}

export async function updatePasswordMock() {
  await requireCmsUser()
  redirect("/admin?tab=settings-password&toast=password_mock_saved")
}

export async function updatePostFlags(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(canPublishNow(currentUser.role), "/admin?tab=posts&toast=post_action_forbidden")

  const postId = String(formData.get("postId") || "")
  const isFeatured = formData.get("isFeatured") === "on"
  const isTrending = formData.get("isTrending") === "on"
  const isPublished = formData.get("isPublished") === "on"
  const seoTitle = String(formData.get("seoTitle") || "").trim() || null
  const seoDescription = String(formData.get("seoDescription") || "").trim() || null

  if (!postId) {
    return
  }

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

  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath(`/${updatedPost.category.slug}`)
  revalidatePath(`/${updatedPost.category.slug}/${updatedPost.slug}`)
  clearDataCache()
}

export async function movePostToTrash(formData: FormData) {
  const currentUser = await requireCmsUser()

  const postId = String(formData.get("postId") || "")
  const sourceTabRaw = String(formData.get("sourceTab") || "").trim()
  const sourceTab = sourceTabRaw === "personal-archive" ? "personal-archive" : "posts"
  if (!postId) {
    redirect(`/admin?tab=${sourceTab}&toast=post_action_failed`)
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      authorId: true,
      slug: true,
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

  if (!canViewAllPosts(currentUser.role) && existingPost.authorId !== currentUser.id) {
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

  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath(`/${existingPost.category.slug}`)
  revalidatePath(`/${existingPost.category.slug}/${existingPost.slug}`)
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
    },
  })

  if (!existingPost) {
    redirect("/admin?tab=trash&toast=post_not_found")
  }

  if (!canViewAllPosts(currentUser.role) && existingPost.authorId !== currentUser.id) {
    redirect("/admin?tab=trash&toast=post_action_forbidden")
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  })

  revalidatePath("/")
  revalidatePath("/admin")
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
    },
  })

  if (!existingPost) {
    redirect("/admin?tab=trash&toast=post_not_found")
  }

  if (!canViewAllPosts(currentUser.role) && existingPost.authorId !== currentUser.id) {
    redirect("/admin?tab=trash&toast=post_action_forbidden")
  }

  await prisma.post.delete({ where: { id: postId } })

  revalidatePath("/")
  revalidatePath("/admin")
  clearDataCache()
  redirect("/admin?tab=trash&toast=post_deleted_permanently")
}

export async function moderateComment(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(can(currentUser.role, "moderate-comment"), "/admin?tab=comments&toast=post_action_forbidden")

  const commentId = String(formData.get("commentId") || "")
  const action = String(formData.get("action") || "")

  if (!commentId || !["approve", "delete"].includes(action)) {
    redirect("/admin?tab=comments&toast=comment_action_failed")
  }

  if (action === "approve") {
    await prisma.comment.update({ where: { id: commentId }, data: { isApproved: true } })
  }

  if (action === "delete") {
    await prisma.comment.delete({ where: { id: commentId } })
  }

  revalidatePath("/admin")
  clearDataCache()
  redirect(`/admin?tab=comments&toast=${action === "approve" ? "comment_approved" : "comment_deleted"}`)
}

export async function updateCategory(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(can(currentUser.role, "edit-category"), "/admin?tab=categories&toast=post_action_forbidden")

  const categoryId = String(formData.get("categoryId") || "")
  const name = String(formData.get("name") || "").trim()
  const description = String(formData.get("description") || "").trim()
  const parentIdRaw = String(formData.get("parentId") || "").trim()
  const parentId = parentIdRaw ? parentIdRaw : null

  if (!categoryId || !name) {
    redirect("/admin?tab=categories&toast=category_delete_failed")
  }

  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, slug: true },
  })

  if (!existingCategory) {
    redirect("/admin?tab=categories&toast=category_delete_failed")
  }

  // Prevent setting itself as parent
  if (parentId === categoryId) {
    redirect("/admin?tab=categories&toast=category_updated")
  }

  const slug = await uniqueCategorySlug(name, categoryId)

  await prisma.category.update({
    where: { id: categoryId },
    data: { name, description, slug, parentId },
  })

  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath(`/${existingCategory.slug}`)
  revalidatePath(`/${slug}`)
  clearDataCache()
  redirect("/admin?tab=categories&toast=category_updated")
}

export async function reorderCategory(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(can(currentUser.role, "edit-category"), "/admin?tab=categories&toast=post_action_forbidden")

  const categoryId = String(formData.get("categoryId") || "")
  const direction = String(formData.get("direction") || "")

  if (!categoryId || !["up", "down"].includes(direction)) {
    redirect("/admin?tab=categories&toast=category_reorder_failed")
  }

  const orderedCategories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, sortOrder: true, slug: true },
  })

  const currentIndex = orderedCategories.findIndex((item) => item.id === categoryId)
  if (currentIndex < 0) {
    redirect("/admin?tab=categories&toast=category_reorder_failed")
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= orderedCategories.length) {
    redirect("/admin?tab=categories&toast=category_reorder_failed")
  }

  const swapped = [...orderedCategories]
  const currentItem = swapped[currentIndex]
  const targetItem = swapped[targetIndex]
  swapped[currentIndex] = targetItem
  swapped[targetIndex] = currentItem

  await prisma.$transaction(
    swapped.map((item, index) =>
      prisma.category.update({
        where: { id: item.id },
        data: { sortOrder: index + 1 },
      })
    )
  )

  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath(`/${currentItem.slug}`)
  revalidatePath(`/${targetItem.slug}`)
  clearDataCache()
  redirect(`/admin?tab=categories&toast=category_reordered&moved=${currentItem.id}&direction=${direction}`)
}

export async function deleteCategory(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(can(currentUser.role, "delete-category"), "/admin?tab=categories&toast=post_action_forbidden")

  const categoryId = String(formData.get("categoryId") || "")
  const moveToCategoryId = String(formData.get("moveToCategoryId") || "")

  if (!categoryId) {
    redirect("/admin?tab=categories&toast=category_delete_failed")
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, slug: true, _count: { select: { posts: true } } },
  })

  if (!category) {
    redirect("/admin?tab=categories&toast=category_delete_failed")
  }

  if (category._count.posts > 0) {
    if (!moveToCategoryId || moveToCategoryId === categoryId) {
      redirect("/admin?tab=categories&toast=category_delete_failed")
    }

    const targetCategory = await prisma.category.findUnique({
      where: { id: moveToCategoryId },
      select: { id: true, slug: true },
    })

    if (!targetCategory) {
      redirect("/admin?tab=categories&toast=category_delete_failed")
    }

    await prisma.$transaction([
      prisma.post.updateMany({
        where: { categoryId },
        data: { categoryId: targetCategory.id },
      }),
      prisma.category.delete({ where: { id: categoryId } }),
    ])

    revalidatePath(`/${targetCategory.slug}`)
  } else {
    await prisma.category.delete({ where: { id: categoryId } })
  }

  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath(`/${category.slug}`)
  clearDataCache()
  redirect("/admin?tab=categories&toast=category_deleted")
}

export async function createSubordinateAccount(formData: FormData) {
  const currentUser = await requireEditorInChiefUser()
  ensurePermission(canCreateSubordinateAccount(currentUser.role), "/admin?tab=settings-password&toast=account_create_failed")

  const email = String(formData.get("email") || "").trim().toLowerCase()
  const name = String(formData.get("name") || "").trim()
  const password = String(formData.get("password") || "")
  const role = String(formData.get("role") || "").trim() as UserRole

  if (!email || !name || !password || password.length < 8) {
    redirect("/admin?tab=settings-password&toast=account_create_failed")
  }

  if (!roleCanCreate(currentUser.role, role)) {
    redirect("/admin?tab=settings-password&toast=account_create_forbidden")
  }

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existingUser) {
    redirect("/admin?tab=settings-password&toast=account_create_duplicated")
  }

  await prisma.user.create({
    data: {
      email,
      name,
      role,
      passwordHash: hashPassword(password),
    },
  })

  clearDataCache()
  redirect("/admin?tab=settings-password&toast=account_created")
}
