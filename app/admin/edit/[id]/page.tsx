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

  const post = await prisma.post.findUnique({
    where: { id },
  })

  if (!post) {
    // Post not found
    redirect("/admin?tab=posts")
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
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
    const ogImage = String(formData.get("ogImage") || "").trim() || null
    const videoEmbedUrl = String(formData.get("videoEmbedUrl") || "").trim() || null

    const isFeatured = formData.get("isFeatured") === "on"
    const isTrending = formData.get("isTrending") === "on"
    const isPublished = formData.get("isPublished") === "on"

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
        seoTitle,
        seoDescription,
        ogImage,
        videoEmbedUrl,
        isFeatured,
        isTrending,
        isPublished,
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
    redirect("/admin?tab=posts")
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chỉnh sửa bài viết</h1>
          <p className="text-muted-foreground mt-1">Cập nhật nội dung bài viết hiện tại.</p>
        </div>
        <Link href="/admin?tab=posts">
          <Button variant="outline">Quay lại Kho bài</Button>
        </Link>
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

            <div className="grid gap-3 md:grid-cols-2">
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
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="seoTitle">SEO title</Label>
                <Input id="seoTitle" name="seoTitle" defaultValue={post.seoTitle || ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ogImage">OG image URL</Label>
                <Input id="ogImage" name="ogImage" defaultValue={post.ogImage || ""} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="seoDescription">SEO description</Label>
              <Textarea
                id="seoDescription"
                name="seoDescription"
                defaultValue={post.seoDescription || ""}
                className="min-h-20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  className="size-4 rounded border-input"
                  name="isFeatured"
                  type="checkbox"
                  defaultChecked={post.isFeatured}
                />
                Tin nổi bật
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  className="size-4 rounded border-input"
                  name="isTrending"
                  type="checkbox"
                  defaultChecked={post.isTrending}
                />
                Tin đọc nhiều
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  className="size-4 rounded border-input"
                  name="isPublished"
                  type="checkbox"
                  defaultChecked={post.isPublished}
                />
                Xuất bản ngay
              </label>
            </div>

            <Button type="submit" className="w-full">Lưu thay đổi</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}