'use client'
import dynamic from "next/dynamic"
const RichTextField = dynamic(() => import("@/components/admin/rich-text-field").then(m => m.RichTextField), { ssr: false })

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type CategoryWriteRow = {
  id: string
  name: string
}

type WriteTabProps = {
  isAdmin: boolean
  categoriesForWrite: CategoryWriteRow[]
  mediaAssets: Array<{
    id: string
    assetType: "IMAGE" | "VIDEO"
    visibility: "PRIVATE" | "SHARED"
    url: string
    displayName: string | null
    filename: string
  }>
  createPost: (formData: FormData) => Promise<void>
}

export function WriteTab({ isAdmin, categoriesForWrite, mediaAssets, createPost }: WriteTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Viết bài mới</CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createPost} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="postTitle">Tên bài viết</Label>
            <Input id="postTitle" name="title" placeholder="Nhập tiêu đề" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="postExcerpt">Trích dẫn</Label>
            <Textarea id="postExcerpt" name="excerpt" className="min-h-20" placeholder="Mô tả ngắn bài viết" required />
          </div>

          <div className="space-y-1.5">
            <Label>Nội dung</Label>
            <RichTextField
              name="content"
              placeholder="Viết nội dung bài báo tại đây..."
              mediaAssets={mediaAssets}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="categorySelect">Danh mục chính</Label>
              <Select id="categorySelect" name="categoryId" required>
                <option value="">Chọn chuyên mục</option>
                {categoriesForWrite.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="videoEmbed">Video embed URL</Label>
              <Input id="videoEmbed" name="videoEmbedUrl" placeholder="https://www.youtube.com/embed/..." />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="thumbnailUrl">Ảnh đại diện URL</Label>
              <Input id="thumbnailUrl" name="thumbnailUrl" placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="thumbnailUpload">Upload ảnh</Label>
              <Input id="thumbnailUpload" name="thumbnailUpload" type="file" accept="image/*" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="seoTitle">SEO title</Label>
              <Input id="seoTitle" name="seoTitle" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ogImage">OG image URL</Label>
              <Input id="ogImage" name="ogImage" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="seoDescription">SEO description</Label>
            <Textarea id="seoDescription" name="seoDescription" className="min-h-20" />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input className="size-4 rounded border-input" name="isFeatured" type="checkbox" />
              Tin nổi bật
            </label>
            <label className="inline-flex items-center gap-2">
              <input className="size-4 rounded border-input" name="isTrending" type="checkbox" />
              Tin đọc nhiều
            </label>
            <label className="inline-flex items-center gap-2">
              <input className="size-4 rounded border-input" name="isPublished" type="checkbox" defaultChecked />
              {isAdmin ? "Xuất bản ngay" : "Gửi chờ duyệt"}
            </label>
          </div>

          <Button type="submit" className="w-full">Đăng bài</Button>
        </form>
      </CardContent>
    </Card>
  )
}
