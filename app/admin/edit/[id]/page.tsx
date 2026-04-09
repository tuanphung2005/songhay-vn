/* eslint-disable @next/next/no-img-element */
import { revalidatePath } from "next/cache"
import Link from "next/link"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ArrowLeft, Eye, Globe, Save, Send, SendToBack } from "lucide-react"

import { RichTextField } from "@/components/admin/rich-text-field/index"
import { SeoFields } from "@/components/admin/seo-fields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CategorySelector } from "@/components/admin/category-selector"
import { SeoKeywordPicker } from "@/components/admin/seo-keyword-picker"
import { uploadThumbnail } from "@/lib/cloudinary"
import { clearDataCache } from "@/lib/data-cache"
import { requireCmsUser } from "@/lib/auth"
import {
  canEditByStatus,
  canPublishNow,
  canSubmitPendingPublish,
  canViewAllPosts,
} from "@/lib/permissions"
import { resolvePostSeoInput } from "@/lib/post-seo"
import { EditFormDirtyTracker } from "@/components/admin/edit-form-dirty-tracker"
import { ThumbnailPicker } from "@/components/admin/thumbnail-picker"
import { prisma } from "@/lib/prisma"
import {
  resolveSeoKeywordSelection,
  syncPostSeoKeywords,
} from "@/lib/seo-keyword-store"
import { normalizeKeyword, splitLegacySeoKeywords } from "@/lib/seo-keywords"
import {
  getPlainTextFromHtml,
  resolveEditorialFromSubmitAction,
  sortCategoriesByTree,
  uniquePostSlug,
} from "@/app/admin/edit/[id]/helpers"
import { logPostHistory } from "@/app/admin/actions-helpers"

export const revalidate = 0
export const metadata: Metadata = {
  title: "Chỉnh sửa bài viết",
  robots: {
    index: false,
    follow: false,
  },
}

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params
  const currentUser = await requireCmsUser()
  const canPublish = canPublishNow(currentUser.role)

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      seoKeywordLinks: {
        select: {
          seoKeywordId: true,
        },
      },
    },
  })

  if (!post) {
    // Post not found
    redirect("/admin?tab=posts")
  }

  const canSeeAllPosts = canViewAllPosts(currentUser.role)
  if (!canSeeAllPosts && post.authorId !== currentUser.id) {
    redirect("/admin?tab=personal-archive")
  }

  if (!canEditByStatus(currentUser.role, post.editorialStatus)) {
    redirect("/admin?tab=personal-archive&toast=post_action_forbidden")
  }

  const rawCategories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, parentId: true },
  })
  const categories = sortCategoriesByTree(rawCategories)

  const mediaAssets = await prisma.mediaAsset.findMany({
    select: {
      id: true,
      assetType: true,
      visibility: true,
      url: true,
      displayName: true,
      filename: true,
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ uploadedAt: "desc" }],
    take: 200,
  })

  const seoKeywordOptions = await prisma.seoKeyword.findMany({
    orderBy: { keyword: "asc" },
    take: 200,
    select: {
      id: true,
      keyword: true,
    },
  })
  const selectedSeoKeywordIds = new Set(
    post.seoKeywordLinks.map((item) => item.seoKeywordId)
  )
  const selectedSeoKeywordNormalized = new Set(
    seoKeywordOptions
      .filter((item) => selectedSeoKeywordIds.has(item.id))
      .map((item) => normalizeKeyword(item.keyword))
  )
  const initialCustomSeoKeywords = splitLegacySeoKeywords(
    post.seoKeywords
  ).filter((item) => !selectedSeoKeywordNormalized.has(normalizeKeyword(item)))

  async function updatePost(formData: FormData) {
    "use server"

    const postId = formData.get("postId") as string
    if (!postId) return

    const title = String(formData.get("title") || "").trim()
    const penName = String(formData.get("penName") || "").trim()
    const excerpt = String(formData.get("excerpt") || "").trim()
    const content = String(formData.get("content") || "").trim()
    const plainContent = getPlainTextFromHtml(content)
    const mainCategoryId = String(formData.get("mainCategoryId") || "").trim()
    const subcategoryId = String(formData.get("subcategoryId") || "").trim()
    const categoryId = subcategoryId || mainCategoryId
    const rawSeoTitle = String(formData.get("seoTitle") || "").trim()
    const rawSeoDescription = String(
      formData.get("seoDescription") || ""
    ).trim()
    const manualOgImage = String(formData.get("ogImage") || "").trim() || null
    const videoEmbedUrl =
      String(formData.get("videoEmbedUrl") || "").trim() || null
    const isSensitive = formData.get("isSensitive") === "on"
    const submitAction = String(formData.get("submitAction") || "").trim()
    const lastUpdatedAt = String(formData.get("lastUpdatedAt") || "").trim()

    const thumbnailUpload = formData.get("thumbnailUpload")
    const thumbnailUrlInput = String(formData.get("thumbnailUrl") || "").trim()

    if (!title || !penName) {
      redirect(`/admin/edit/${postId}?toast=missing_fields`)
    }

    if (submitAction !== "save-draft" && (!excerpt || !plainContent || !categoryId)) {
      redirect(`/admin/edit/${postId}?toast=missing_fields`)
    }

    const { seoTitle, seoDescription } = resolvePostSeoInput({
      title,
      excerpt,
      content: plainContent,
      seoTitle: rawSeoTitle,
      seoDescription: rawSeoDescription,
    })

    const slug = await uniquePostSlug(title, postId)

    let thumbnailUrl = thumbnailUrlInput || null
    if (thumbnailUpload instanceof File && thumbnailUpload.size > 0) {
      const uploaded = await uploadThumbnail(thumbnailUpload)
      if (uploaded) {
        thumbnailUrl = uploaded
      }
    } else if (!thumbnailUrlInput && post?.thumbnailUrl) {
      // Keep existing
      thumbnailUrl = post.thumbnailUrl
    }

    const ogImage = thumbnailUrl || manualOgImage

    const currentPost = await prisma.post.findUnique({
      where: { id: postId },
      include: { category: true },
    })

    if (!currentPost) {
      return
    }

    if (currentPost.updatedAt.toISOString() !== lastUpdatedAt) {
      redirect(`/admin/edit/${postId}?toast=post_concurrent_modification`)
    }

    const canSeeAllPostsAction = canViewAllPosts(currentUser.role)
    if (!canSeeAllPostsAction && currentPost.authorId !== currentUser.id) {
      redirect("/admin?tab=personal-archive&toast=post_action_forbidden")
    }

    if (!canEditByStatus(currentUser.role, currentPost.editorialStatus)) {
      redirect("/admin?tab=personal-archive&toast=post_action_forbidden")
    }

    const isSaveChanges = submitAction === "save-changes"
    let editorialStatus = currentPost.editorialStatus
    let isPublished = currentPost.isPublished
    let isDraft = currentPost.isDraft

    if (!isSaveChanges) {
      const resolved = resolveEditorialFromSubmitAction({
        submitAction,
        role: currentUser.role,
      })
      editorialStatus = resolved.editorialStatus
      isPublished = resolved.isPublished
      isDraft = resolved.isDraft
    }

    const { keywordIds, seoKeywordsText } =
      await resolveSeoKeywordSelection(formData)

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        slug,
        penName,
        excerpt,
        content,
        categoryId,
        authorId: currentPost.authorId || currentUser.id,
        seoTitle,
        seoDescription,
        seoKeywords: seoKeywordsText,
        ogImage,
        videoEmbedUrl,
        isSensitive,
        isFeatured: currentPost.isFeatured,
        isTrending: currentPost.isTrending,
        isPublished,
        isDraft,
        editorialStatus,
        lastEditorId: currentUser.id,
        approverId: isSaveChanges ? currentPost.approverId : (isPublished ? currentUser.id : null),
        approvedAt: isSaveChanges ? currentPost.approvedAt : (isPublished ? new Date() : null),
        publishedAt: isSaveChanges ? currentPost.publishedAt : (isPublished ? new Date() : currentPost.publishedAt),
        thumbnailUrl,
        updatedAt: new Date(),
      },
      include: { category: true },
    })

    await syncPostSeoKeywords(postId, keywordIds)

    await logPostHistory({
      postId,
      actorId: currentUser.id,
      actionType: isSaveChanges ? "UPDATED" : "STATUS_CHANGED",
      fromStatus: currentPost.editorialStatus,
      toStatus: editorialStatus,
      snapshotTitle: title,
      snapshotExcerpt: excerpt,
      snapshotContent: content,
    })

    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath(`/${currentPost.category.slug}`)
    revalidatePath(`/${updatedPost.category.slug}`)
    revalidatePath(`/${currentPost.category.slug}/${currentPost.slug}`)
    revalidatePath(`/${updatedPost.category.slug}/${updatedPost.slug}`)
    clearDataCache()
    if (isDraft) {
      redirect("/admin?tab=personal-archive&toast=post_saved_draft")
    }

    if (isPublished) {
      redirect("/admin?tab=posts&toast=post_updated_published")
    }

    if (editorialStatus === "PENDING_PUBLISH") {
      redirect(
        "/admin?tab=posts&postsStatus=pending-publish&toast=post_submitted_publish"
      )
    }

    redirect(
      "/admin?tab=posts&postsStatus=pending-review&toast=post_updated_review"
    )
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chỉnh sửa bài viết</h1>
          <p className="mt-1 text-muted-foreground">
            Cập nhật nội dung bài viết hiện tại.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin?tab=posts">
            <Button variant="outline">
              <ArrowLeft className="size-4 mr-1.5" />
              Quay lại Kho bài
            </Button>
          </Link>
        </div>
      </div>

      <form action={updatePost} className="space-y-6">
        <EditFormDirtyTracker />
        <input type="hidden" name="postId" value={post.id} />
        <input type="hidden" name="lastUpdatedAt" value={post.updatedAt.toISOString()} />

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="postTitle">Tên bài viết</Label>
            <Input
              id="postTitle"
              name="title"
              defaultValue={post.title}
              placeholder="Nhập tiêu đề"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="postPenName">Bút danh</Label>
            <Input
              id="postPenName"
              name="penName"
              defaultValue={post.penName || ""}
              autoComplete="off"
              placeholder="Tên tác giả hiển thị công khai"
              required
            />
          </div>

          <div className="space-y-1.5">            <Label htmlFor="postExcerpt">Trích dẫn</Label>
            <Textarea
              id="postExcerpt"
              name="excerpt"
              defaultValue={post.excerpt}
              className="min-h-20"
              placeholder="Mô tả ngắn bài viết"
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <Label>Nội dung</Label>
              <RichTextField
                name="content"
                defaultValue={post.content}
                mediaAssets={mediaAssets}
                currentUserId={currentUser.id}
              />
            </div>

            <fieldset className="space-y-3 rounded-lg border bg-white p-4">
              <legend className="px-1 text-sm font-semibold">Thao tác xuất bản</legend>
              <div className="grid gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="submit"
                    name="submitAction"
                    value="save-changes"
                    variant="outline"
                    size="lg"
                  >
                    <Save className="size-4 mr-1.5" />
                    {post.editorialStatus === "DRAFT" ? "Lưu nháp" : "Cập nhật thay đổi"}
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                    <Link
                      href={`/admin/preview/${post.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Eye className="size-4 mr-1.5" />
                      Xem trước
                    </Link>
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {post.editorialStatus !== "DRAFT" && (post.editorialStatus !== "PUBLISHED" || canPublish) ? (
                    <Button
                      type="submit"
                      name="submitAction"
                      value="save-draft"
                      variant="outline"
                      size="lg"
                    >
                      <Save className="size-4 mr-1.5" />
                      Chuyển về nháp
                    </Button>
                  ) : null}

                  <Button
                    type="submit"
                    name="submitAction"
                    value="submit-review"
                    className="w-full"
                    variant="destructive"
                    size="lg"
                  >
                    <Send className="size-4 mr-1.5" />
                    Gửi chờ duyệt
                  </Button>

                  {canSubmitPendingPublish(currentUser.role) ? (
                    <Button
                      type="submit"
                      name="submitAction"
                      value="submit-publish"
                      className="w-full"
                      variant="secondary"
                      size="lg"
                    >
                      <SendToBack className="size-4 mr-1.5" />
                      Gửi chờ xuất bản
                    </Button>
                  ) : null}

                  {canPublish ? (
                    <Button type="submit" name="submitAction" value="publish" className="w-full" size="lg">
                      <Globe className="size-4 mr-1.5" />
                      Xuất bản
                    </Button>
                  ) : null}
                </div>
              </div>
            </fieldset>
          </div>

          <div className="space-y-4">
            <div className="sticky top-4 space-y-4">
              <fieldset className="space-y-3 rounded-lg border bg-white p-4">
                <legend className="px-1 text-sm font-semibold">Phân loại & Cấu hình</legend>
                <CategorySelector
                  categories={categories}
                  defaultCategoryId={post.categoryId}
                />
                <div className="flex items-center gap-2 pt-2">
                  <input
                    className="size-4 rounded border-input"
                    name="isSensitive"
                    type="checkbox"
                    defaultChecked={post.isSensitive}
                    id="isSensitiveEdit"
                  />
                  <Label htmlFor="isSensitiveEdit">Nội dung nhạy cảm</Label>
                </div>
              </fieldset>

              <fieldset className="space-y-3 rounded-lg border bg-white p-4">
                <legend className="px-1 text-sm font-semibold">Đa phương tiện</legend>
                <div className="space-y-2">
                  <Label htmlFor="thumbnailUrl">Ảnh đại diện</Label>
                  <ThumbnailPicker
                    defaultValue={post.thumbnailUrl || ""}
                    mediaAssets={mediaAssets}
                    currentUserId={currentUser.id}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  OG image sẽ tự đồng bộ theo ảnh đại diện.
                </p>

                <div className="mt-3 border-t pt-3 space-y-1.5">
                  <Label htmlFor="videoEmbed">Video embed URL</Label>
                  <Input
                    id="videoEmbed"
                    name="videoEmbedUrl"
                    defaultValue={post.videoEmbedUrl || ""}
                    placeholder="https://www.youtube.com/embed/..."
                  />
                </div>
              </fieldset>

              <div className="bg-white">
                <SeoFields
                  defaultSeoTitle={post.seoTitle || ""}
                  defaultSeoDescription={post.seoDescription || ""}
                  initialTitle={post.title}
                  initialExcerpt={post.excerpt}
                  initialContent={post.content}
                >
                  <SeoKeywordPicker
                    options={seoKeywordOptions}
                    initialSelectedIds={[...selectedSeoKeywordIds]}
                    initialCustomKeywords={initialCustomSeoKeywords}
                  />
                </SeoFields>
              </div>


            </div>
          </div>
        </div>
      </form>
    </main>
  )
}
