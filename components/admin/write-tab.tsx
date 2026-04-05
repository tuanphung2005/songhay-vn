"use client"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState, useTransition } from "react"
import { Eye, Globe, Save, Send, SendToBack } from "lucide-react"

const RichTextField = dynamic(
  () =>
    import("@/components/admin/rich-text-field").then((m) => m.RichTextField),
  { ssr: false }
)

import { createPostForPreview } from "@/app/admin/actions"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CategorySelector } from "@/components/admin/category-selector"
import { SeoFields } from "@/components/admin/seo-fields"
import { SeoKeywordPicker } from "@/components/admin/seo-keyword-picker"

type CategoryWriteRow = {
  id: string
  name: string
  parentId?: string | null
}

type WriteTabProps = {
  canPublishNow: boolean
  canSubmitPendingPublish: boolean
  categoriesForWrite: CategoryWriteRow[]
  seoKeywordOptions: Array<{
    id: string
    keyword: string
  }>
  mediaAssets: Array<{
    id: string
    assetType: "IMAGE" | "VIDEO"
    visibility: "PRIVATE" | "SHARED"
    url: string
    displayName: string | null
    filename: string
    uploader?: {
      id: string
      name: string
      email?: string
    }
  }>
  currentUserId: string
  createPost: (formData: FormData) => Promise<void>
}

const WRITE_DIRTY_STORAGE_KEY = "admin-write-dirty"

function setWriteDirtyState(isDirty: boolean) {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.setItem(WRITE_DIRTY_STORAGE_KEY, isDirty ? "1" : "0")
}

export function WriteTab({
  canPublishNow,
  canSubmitPendingPublish,
  categoriesForWrite,
  seoKeywordOptions,
  mediaAssets,
  currentUserId,
  createPost,
}: WriteTabProps) {
  const [hasVideo, setHasVideo] = useState(false)
  const [isSensitive, setIsSensitive] = useState(false)
  const [isPreviewing, startPreviewTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    setWriteDirtyState(false)
  }, [])

  function updateDirtyStateFromForm(form: HTMLFormElement) {
    const title = String(
      (form.elements.namedItem("title") as HTMLInputElement | null)?.value || ""
    ).trim()
    const excerpt = String(
      (form.elements.namedItem("excerpt") as HTMLTextAreaElement | null)
        ?.value || ""
    ).trim()
    const content = String(
      (form.elements.namedItem("content") as HTMLInputElement | null)?.value ||
        ""
    )
      .replace(/<[^>]+>/g, " ")
      .trim()
    setWriteDirtyState(Boolean(title || excerpt || content))
  }

  function handlePreview() {
    if (!formRef.current) return
    if (!formRef.current.reportValidity()) return
    
    const formData = new FormData(formRef.current)
    startPreviewTransition(async () => {
      const result = await createPostForPreview(formData)
      if ("postId" in result) {
        window.open(`/admin/preview/${result.postId}`, "_blank")
      }
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold">Viết bài mới</p>
      <form
        ref={formRef}
        action={createPost}
        className="space-y-4"
        onChange={(event) => {
          const target = event.currentTarget
          updateDirtyStateFromForm(target)
        }}
        onSubmit={() => {
          setWriteDirtyState(false)
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="postTitle">Tên bài viết</Label>
          <Input
            id="postTitle"
            name="title"
            placeholder="Nhập tiêu đề"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="postExcerpt">Trích dẫn</Label>
          <Textarea
            id="postExcerpt"
            name="excerpt"
            className="min-h-20"
            placeholder="Mô tả ngắn bài viết"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Nội dung</Label>
          <RichTextField
            name="content"
            placeholder="Viết nội dung bài báo tại đây..."
            mediaAssets={mediaAssets}
            currentUserId={currentUserId}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <CategorySelector categories={categoriesForWrite} />

          <div className="self-end rounded-md border px-3 py-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasVideo"
                checked={hasVideo}
                onCheckedChange={(checked) => setHasVideo(checked === true)}
              />
              <Label htmlFor="hasVideo">Bài có video</Label>
            </div>
          </div>
        </div>

        {hasVideo ? <input type="hidden" name="hasVideo" value="on" /> : null}

        {hasVideo ? (
          <div className="space-y-1.5">
            <Label htmlFor="videoEmbed">Video embed URL</Label>
            <Input
              id="videoEmbed"
              name="videoEmbedUrl"
              placeholder="https://www.youtube.com/embed/..."
            />
          </div>
        ) : null}

        <fieldset className="space-y-3 rounded-lg border p-3">
          <legend className="px-1 text-sm font-semibold">Ảnh đại diện</legend>
          <div className="space-y-1.5">
            <Label htmlFor="thumbnailUrl">Ảnh đại diện URL</Label>
            <Input
              id="thumbnailUrl"
              name="thumbnailUrl"
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="thumbnailUpload">Upload ảnh</Label>
            <Input
              id="thumbnailUpload"
              name="thumbnailUpload"
              type="file"
              accept="image/*"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Khi upload ảnh tại đây, hệ thống sẽ tự dùng ảnh này làm OG image.
          </p>
        </fieldset>

        <SeoFields>
          <SeoKeywordPicker options={seoKeywordOptions} />
        </SeoFields>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="rounded-md border px-3 py-2">
            <div className="inline-flex items-center gap-2">
              <Checkbox
                id="isSensitive"
                checked={isSensitive}
                onCheckedChange={(checked) => setIsSensitive(checked === true)}
              />
              <Label htmlFor="isSensitive">Nội dung nhạy cảm</Label>
            </div>
          </div>
        </div>

        {isSensitive ? (
          <input type="hidden" name="isSensitive" value="on" />
        ) : null}

        <div
          className={`grid gap-2 ${canPublishNow || canSubmitPendingPublish ? "md:grid-cols-4" : "md:grid-cols-3"}`}
        >
          <PendingSubmitButton
            type="submit"
            name="submitAction"
            value="save-draft"
            variant="outline"
            pendingText="Đang lưu..."
          >
            <Save className="size-4" />
            Lưu nháp
          </PendingSubmitButton>
          <PendingSubmitButton
            type="submit"
            name="submitAction"
            value="submit-review"
            className="w-full"
            variant="destructive"
            pendingText="Đang gửi duyệt..."
          >
            <Send className="size-4" />
            Gửi chờ duyệt
          </PendingSubmitButton>
          <Button
            type="button"
            className="w-full"
            variant="secondary"
            onClick={handlePreview}
            disabled={isPreviewing}
          >
            <Eye className="size-4" />
            {isPreviewing ? "Đang lưu..." : "Xem trước"}
          </Button>
          {canSubmitPendingPublish ? (
            <PendingSubmitButton
              type="submit"
              name="submitAction"
              value="submit-publish"
              className="w-full"
              variant="secondary"
              pendingText="Đang chuyển kho..."
            >
              <SendToBack className="size-4" />
              Gửi chờ xuất bản
            </PendingSubmitButton>
          ) : null}
          {canPublishNow ? (
            <PendingSubmitButton
              type="submit"
              name="submitAction"
              value="publish"
              className="w-full"
              pendingText="Đang xuất bản..."
            >
              <Globe className="size-4" />
              Xuất bản
            </PendingSubmitButton>
          ) : null}
        </div>
      </form>
    </div>
  )
}
