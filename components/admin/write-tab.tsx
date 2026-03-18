'use client'
import dynamic from "next/dynamic"
import { useState } from "react"

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
  const [hasVideo, setHasVideo] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Viết bài mới</CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createPost} className="space-y-4">
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
            <label className="inline-flex items-center gap-2 self-end rounded-md border px-3 py-2 text-sm">
              <input
                className="size-4 rounded border-input"
                name="hasVideo"
                type="checkbox"
                checked={hasVideo}
                onChange={(event) => setHasVideo(event.target.checked)}
              />
              Bài có video
            </label>
          </div>

          {hasVideo ? (
            <div className="space-y-1.5">
              <Label htmlFor="videoEmbed">Video embed URL</Label>
              <Input id="videoEmbed" name="videoEmbedUrl" placeholder="https://www.youtube.com/embed/..." />
            </div>
          ) : null}

          <fieldset className="space-y-3 rounded-lg border p-3">
            <legend className="px-1 text-sm font-semibold">Ảnh đại diện</legend>
            <div className="space-y-1.5">
              <Label htmlFor="thumbnailUrl">Ảnh đại diện URL</Label>
              <Input id="thumbnailUrl" name="thumbnailUrl" placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="thumbnailUpload">Upload ảnh</Label>
              <Input id="thumbnailUpload" name="thumbnailUpload" type="file" accept="image/*" />
            </div>
            <p className="text-muted-foreground text-xs">Khi upload ảnh tại đây, hệ thống sẽ tự dùng ảnh này làm OG image.</p>
          </fieldset>

          <fieldset className="space-y-3 rounded-lg border p-3">
            <legend className="px-1 text-sm font-semibold">SEO</legend>
            <div className="space-y-1.5">
              <Label htmlFor="seoTitle">Tiêu đề SEO</Label>
              <Input id="seoTitle" name="seoTitle" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seoDescription">Mô tả SEO</Label>
              <Textarea id="seoDescription" name="seoDescription" className="min-h-20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seoKeywords">Từ khóa SEO</Label>
              <Input id="seoKeywords" name="seoKeywords" placeholder="ví dụ: tử vi, phong thủy, lịch âm" />
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2">
              <input className="size-4 rounded border-input" name="isSensitive" type="checkbox" />
              Nội dung nhạy cảm
            </label>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            <Button type="submit" name="submitAction" value="save-draft" variant="outline">Lưu nháp</Button>
            <Button type="submit" name="submitAction" value="submit-review" className="w-full" variant="secondary">Gửi chờ duyệt</Button>
            {isAdmin ? (
              <Button type="submit" name="submitAction" value="publish" className="w-full">Xuất bản</Button>
            ) : (
              <Button type="button" className="w-full" disabled>Xuất bản (chỉ admin)</Button>
            )}
          </div>
          <p className="text-muted-foreground text-xs">Sau khi lưu nháp, mở bài trong Lưu trữ cá nhân để dùng chế độ Xem trước.</p>
        </form>
      </CardContent>
    </Card>
  )
}
