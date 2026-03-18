/* eslint-disable @next/next/no-img-element */
import { revalidatePath } from "next/cache"
import Link from "next/link"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { RichTextField } from "@/components/admin/rich-text-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { uploadImageToCloudinary } from "@/lib/cloudinary"
import { clearDataCache } from "@/lib/data-cache"
import { requireCmsUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slug"

export const revalidate = 0
export const metadata: Metadata = {
  title: "Chỉnh sửa bài viết",
  robots: {
    index: false,
    follow: false,
  },
}

function getPlainTextFromHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Ensure unique slug, unless it's the exact same post
async function uniquePostSlug(baseTitle: string, currentId: string) {
  const base = slugify(baseTitle)
  let candidate = base
  let index = 1

  while (true) {
    const found = await prisma.post.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    // If no slug conflict, or the conflict happens to be the same post
    if (!found || found.id === currentId) {
      return candidate
    }
    candidate = `${base}-${index}`
    index++
  }
}

async function uploadThumbnail(file: File | null) {
  if (!file || file.size === 0) {
    return null
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  return uploadImageToCloudinary({
    buffer,
    filename: file.name,
    mimeType: file.type || "image/jpeg",
    folder: "songhay/thumbnails",
  })
}

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params
  const currentUser = await requireCmsUser()
  const isAdmin = currentUser.role === "ADMIN"

  const post = await prisma.post.findUnique({
    where: { id },
  })

  if (!post) {
    // Post not found
    redirect("/admin?tab=posts")
  }

  if (!isAdmin && post.authorId !== currentUser.id) {
    redirect("/admin?tab=personal-archive")
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })

  const mediaAssets = await prisma.mediaAsset.findMany({
    where: {
      OR: [{ uploaderId: currentUser.id }, { visibility: "SHARED", assetType: "VIDEO" }],
    },
    select: {
      id: true,
      assetType: true,
      visibility: true,
      url: true,
      displayName: true,
      filename: true,
    },
    orderBy: [{ uploadedAt: "desc" }],
    take: 200,
  })

  async function updatePost(formData: FormData) {
    "use server"

    const postId = formData.get("postId") as string
    if (!postId) return

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
    const submitAction = String(formData.get("submitAction") || "").trim()

    const requestedPublished = formData.get("isPublished") === "on"

    const thumbnailUpload = formData.get("thumbnailUpload")
    const thumbnailUrlInput = String(formData.get("thumbnailUrl") || "").trim()

    if (!title || !excerpt || !plainContent || !categoryId) {
      return
    }

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

    const shouldSaveDraft = submitAction === "save-draft"
    const shouldPublishNow = submitAction === "publish" || (submitAction.length === 0 && requestedPublished && isAdmin)
    const editorialStatus = shouldPublishNow ? "PUBLISHED" : "PENDING_REVIEW"
    const isPublished = editorialStatus === "PUBLISHED"
    const isDraft = shouldSaveDraft

    const currentPost = await prisma.post.findUnique({
      where: { id: postId },
      include: { category: true },
    })

    if (!currentPost) {
      return
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        slug,
        excerpt,
        content,
        categoryId,
        authorId: currentPost.authorId || currentUser.id,
        seoTitle,
        seoDescription,
        seoKeywords,
        ogImage,
        videoEmbedUrl,
        isSensitive,
        isFeatured: currentPost.isFeatured,
        isTrending: currentPost.isTrending,
        isPublished,
        isDraft,
        editorialStatus,
        approverId: isPublished ? currentUser.id : null,
        approvedAt: isPublished ? new Date() : null,
        publishedAt: isPublished ? new Date() : currentPost.publishedAt,
        thumbnailUrl,
        updatedAt: new Date(),
      },
      include: { category: true },
    })

    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath(`/${currentPost.category.slug}`)
    revalidatePath(`/${updatedPost.category.slug}`)
    revalidatePath(`/${currentPost.category.slug}/${currentPost.slug}`)
    revalidatePath(`/${updatedPost.category.slug}/${updatedPost.slug}`)
    clearDataCache()
    if (shouldSaveDraft) {
      redirect("/admin?tab=personal-archive&toast=post_saved_draft")
    }

    redirect(isPublished ? "/admin?tab=posts&toast=post_updated_published" : "/admin?tab=pending-posts&toast=post_updated_review")
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chỉnh sửa bài viết</h1>
          <p className="text-muted-foreground mt-1">Cập nhật nội dung bài viết hiện tại.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/preview/${post.id}`} target="_blank" rel="noreferrer">
            <Button variant="secondary">Xem trước</Button>
          </Link>
          <Link href="/admin?tab=posts">
            <Button variant="outline">Quay lại Kho bài</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={updatePost} className="space-y-4">
            <input type="hidden" name="postId" value={post.id} />

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
              <Label htmlFor="postExcerpt">Trích dẫn</Label>
              <Textarea
                id="postExcerpt"
                name="excerpt"
                defaultValue={post.excerpt}
                className="min-h-20"
                placeholder="Mô tả ngắn bài viết"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Nội dung</Label>
              <RichTextField
                name="content"
                defaultValue={post.content}
                mediaAssets={mediaAssets}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="categorySelect">Danh mục chính</Label>
                <Select id="categorySelect" name="categoryId" defaultValue={post.categoryId} required>
                  <option value="">Chọn chuyên mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="videoEmbed">Video embed URL</Label>
                <Input
                  id="videoEmbed"
                  name="videoEmbedUrl"
                  defaultValue={post.videoEmbedUrl || ""}
                  placeholder="https://www.youtube.com/embed/..."
                />
              </div>
            </div>

            <fieldset className="space-y-3 rounded-lg border p-3">
              <legend className="px-1 text-sm font-semibold">Ảnh đại diện</legend>
              <div className="space-y-1.5">
                <Label htmlFor="thumbnailUrl">Ảnh đại diện URL hiện tại</Label>
                <Input
                  id="thumbnailUrl"
                  name="thumbnailUrl"
                  defaultValue={post.thumbnailUrl || ""}
                  placeholder="https://..."
                />
                {post.thumbnailUrl && (
                  <div className="mt-2">
                    <img src={post.thumbnailUrl} alt="Thumbnail preview" className="h-20 w-auto rounded border" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="thumbnailUpload">Upload ảnh mới (thay thế ảnh cũ nếu có)</Label>
                <Input id="thumbnailUpload" name="thumbnailUpload" type="file" accept="image/*" />
              </div>
              <p className="text-muted-foreground text-xs">OG image sẽ tự đồng bộ theo ảnh đại diện.</p>
            </fieldset>

            <fieldset className="space-y-3 rounded-lg border p-3">
              <legend className="px-1 text-sm font-semibold">SEO</legend>
              <div className="space-y-1.5">
                <Label htmlFor="seoTitle">Tiêu đề SEO</Label>
                <Input id="seoTitle" name="seoTitle" defaultValue={post.seoTitle || ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seoDescription">Mô tả SEO</Label>
                <Textarea
                  id="seoDescription"
                  name="seoDescription"
                  defaultValue={post.seoDescription || ""}
                  className="min-h-20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seoKeywords">Từ khóa SEO</Label>
                <Input id="seoKeywords" name="seoKeywords" defaultValue={post.seoKeywords || ""} />
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2">
                <input
                  className="size-4 rounded border-input"
                  name="isSensitive"
                  type="checkbox"
                  defaultChecked={post.isSensitive}
                />
                Nội dung nhạy cảm
              </label>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              <Button type="submit" name="submitAction" value="save-draft" variant="outline">Lưu nháp</Button>
              <Button type="submit" name="submitAction" value="submit-review" variant="secondary">Gửi chờ duyệt</Button>
              {isAdmin ? (
                <Button type="submit" name="submitAction" value="publish">Xuất bản</Button>
              ) : (
                <Button type="button" disabled>Xuất bản (chỉ admin)</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}