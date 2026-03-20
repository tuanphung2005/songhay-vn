"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { MediaAssetType } from "@prisma/client"

import { requireAdminUser, requireCmsUser } from "@/lib/auth"
import { uploadImageToCloudinary, uploadVideoToCloudinary, uploadThumbnail } from "@/lib/cloudinary"
import { clearDataCache } from "@/lib/data-cache"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slug"

const MAX_VIDEO_UPLOAD_BYTES = 200 * 1024 * 1024

function getPlainTextFromHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

async function uniqueCategorySlug(baseName: string, currentId?: string) {
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

async function uniquePostSlug(baseTitle: string) {
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


export async function createCategory(formData: FormData) {
  await requireAdminUser()

  const name = String(formData.get("name") || "").trim()
  const description = String(formData.get("description") || "").trim()

  if (!name) {
    redirect("/admin?tab=categories&toast=category_delete_failed")
  }

  const maxSortOrder = await prisma.category.aggregate({ _max: { sortOrder: true } })
  const nextSortOrder = (maxSortOrder._max.sortOrder || 0) + 1

  const slug = await uniqueCategorySlug(name)
  await prisma.category.upsert({
    where: { slug },
    update: { name, description, sortOrder: nextSortOrder },
    create: { name, slug, description, sortOrder: nextSortOrder },
  })

  revalidatePath("/")
  revalidatePath("/admin")
  clearDataCache()
  redirect("/admin?tab=categories&toast=category_created")
}

export async function createPost(formData: FormData) {
  const currentUser = await requireCmsUser()

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
  const requestedPublished = formData.get("isPublished") === "on"
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

  const isAdmin = currentUser.role === "ADMIN"
  const shouldSaveDraft = submitAction === "save-draft"
  const shouldPublishNow = submitAction === "publish" || (submitAction.length === 0 && requestedPublished && isAdmin)
  const editorialStatus = shouldPublishNow ? "PUBLISHED" : "PENDING_REVIEW"
  const isPublished = editorialStatus === "PUBLISHED"
  const isDraft = shouldSaveDraft

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
  if (shouldSaveDraft) {
    redirect("/admin?tab=personal-archive&toast=post_saved_draft")
  }

  if (isPublished) {
    redirect("/admin?tab=posts&toast=post_published")
  }

  redirect("/admin?tab=pending-posts&toast=post_submitted_review")
}

export async function createPostForPreview(formData: FormData): Promise<{ postId: string } | { error: string }> {
  const currentUser = await requireCmsUser()

  const title = String(formData.get("title") || "").trim()
  const excerpt = String(formData.get("excerpt") || "").trim()
  const content = String(formData.get("content") || "").trim()
  const plainContent = getPlainTextFromHtml(content)
  const categoryId = String(formData.get("categoryId") || "").trim()
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
      editorialStatus: "PENDING_REVIEW",
      thumbnailUrl,
    },
  })

  revalidatePath("/admin")
  return { postId: post.id }
}

export async function approvePendingPost(formData: FormData) {
  const currentUser = await requireAdminUser()

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "PUBLISHED",
      isPublished: true,
      isDraft: false,
      approverId: currentUser.id,
      approvedAt: new Date(),
      publishedAt: new Date(),
    },
  })

  revalidatePath("/")
  revalidatePath("/admin")
  clearDataCache()
  redirect("/admin?tab=pending-posts&toast=post_approved")
}

export async function rejectPendingPost(formData: FormData) {
  await requireAdminUser()

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
  redirect("/admin?tab=pending-posts&toast=post_rejected")
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
      visibility: selectedType === MediaAssetType.VIDEO ? "SHARED" : "PRIVATE",
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
  await requireAdminUser()

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

  if (currentUser.role !== "ADMIN" && existingPost.authorId !== currentUser.id) {
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

  if (currentUser.role !== "ADMIN" && existingPost.authorId !== currentUser.id) {
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

  if (currentUser.role !== "ADMIN" && existingPost.authorId !== currentUser.id) {
    redirect("/admin?tab=trash&toast=post_action_forbidden")
  }

  await prisma.post.delete({ where: { id: postId } })

  revalidatePath("/")
  revalidatePath("/admin")
  clearDataCache()
  redirect("/admin?tab=trash&toast=post_deleted_permanently")
}

export async function moderateComment(formData: FormData) {
  await requireAdminUser()

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
  await requireAdminUser()

  const categoryId = String(formData.get("categoryId") || "")
  const name = String(formData.get("name") || "").trim()
  const description = String(formData.get("description") || "").trim()

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

  const slug = await uniqueCategorySlug(name, categoryId)

  await prisma.category.update({
    where: { id: categoryId },
    data: { name, description, slug },
  })

  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath(`/${existingCategory.slug}`)
  revalidatePath(`/${slug}`)
  clearDataCache()
  redirect("/admin?tab=categories&toast=category_updated")
}

export async function reorderCategory(formData: FormData) {
  await requireAdminUser()

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
  await requireAdminUser()

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
