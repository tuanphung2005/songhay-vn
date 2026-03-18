"use client"

/* eslint-disable @next/next/no-img-element */
import { type FormEvent, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

type MediaAssetRow = {
  id: string
  assetType: "IMAGE" | "VIDEO"
  visibility: "PRIVATE" | "SHARED"
  url: string
  displayName: string | null
  filename: string
  mimeType: string
  sizeBytes: number
  uploadedAt: Date
  uploader: {
    id: string
    name: string
    email?: string
  }
}

type MediaLibraryTabProps = {
  isAdmin: boolean
  rows: MediaAssetRow[]
}

function toMb(sizeBytes: number) {
  return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`
}

function getInitialUploaderOptions(rows: MediaAssetRow[]) {
  const map = new Map<string, { id: string; name: string; email: string }>()

  for (const row of rows) {
    if (!row.uploader?.id) {
      continue
    }

    map.set(row.uploader.id, {
      id: row.uploader.id,
      name: row.uploader.name,
      email: row.uploader.email || "-",
    })
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "vi"))
}

export function MediaLibraryTab({ isAdmin, rows }: MediaLibraryTabProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<"image" | "video">("image")
  const [uploaderFilter, setUploaderFilter] = useState("all")
  const [searchValue, setSearchValue] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [isLoading, setIsLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [uploaderOptions, setUploaderOptions] = useState<Array<{ id: string; name: string; email: string }>>(
    getInitialUploaderOptions(rows)
  )
  const [items, setItems] = useState<MediaAssetRow[]>(
    rows.filter((item) => item.assetType === "IMAGE").slice(0, 12)
  )

  async function loadMedia(next: { filterType: "image" | "video"; searchValue: string; page: number; uploaderFilter: string }) {
    setIsLoading(true)

    try {
      const params = new URLSearchParams({
        page: String(next.page),
        pageSize: String(pageSize),
      })

      if (next.searchValue.trim().length > 0) {
        params.set("search", next.searchValue.trim())
      }

      if (isAdmin && next.uploaderFilter !== "all") {
        params.set("uploaderId", next.uploaderFilter)
      }

      const endpoint = next.filterType === "video" ? "/api/uploads/video" : "/api/uploads/image"
      const response = await fetch(`${endpoint}?${params.toString()}`, {
        method: "GET",
      })

      if (!response.ok) {
        setItems([])
        setTotalPages(1)
        return
      }

      const payload = (await response.json()) as {
        items: MediaAssetRow[]
        uploaderOptions?: Array<{ id: string; name: string; email: string }>
        pagination: {
          totalPages: number
        }
      }

      setItems(payload.items)
      if (isAdmin) {
        setUploaderOptions(payload.uploaderOptions || [])
      }
      setTotalPages(Math.max(1, payload.pagination.totalPages || 1))
    } catch {
      setItems([])
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)
    const file = formData.get("file")
    if (!(file instanceof File) || file.size === 0) {
      window.location.assign("/admin?tab=media-library&toast=media_upload_failed")
      return
    }

    const endpoint = file.type.startsWith("video/") ? "/api/uploads/video" : "/api/uploads/image"

    setIsUploading(true)

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        window.location.assign("/admin?tab=media-library&toast=media_upload_failed")
        return
      }

      window.location.assign("/admin?tab=media-library&toast=media_uploaded")
      form.reset()
    } catch {
      window.location.assign("/admin?tab=media-library&toast=media_upload_failed")
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDelete(assetId: string) {
    const ok = window.confirm("Xóa media này khỏi kho dữ liệu?")
    if (!ok) {
      return
    }

    setDeletingId(assetId)

    try {
      const response = await fetch(`/api/media/${assetId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        window.location.assign("/admin?tab=media-library&toast=media_delete_failed")
        return
      }

      await loadMedia({ filterType, searchValue, page, uploaderFilter })
      window.history.replaceState({}, "", "/admin?tab=media-library&toast=media_deleted")
    } catch {
      window.location.assign("/admin?tab=media-library&toast=media_delete_failed")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleFilterChange(value: "image" | "video") {
    setFilterType(value)
    setPage(1)
    await loadMedia({ filterType: value, searchValue, page: 1, uploaderFilter })
  }

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    await loadMedia({ filterType, searchValue, page: 1, uploaderFilter })
  }

  async function goToPage(nextPage: number) {
    const bounded = Math.max(1, Math.min(nextPage, totalPages))
    setPage(bounded)
    await loadMedia({ filterType, searchValue, page: bounded, uploaderFilter })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kho dữ liệu</CardTitle>
        <CardDescription>
          Upload media một lần để tái sử dụng. Admin có thể lọc theo người upload để quản trị nhanh.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleUpload} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[160px_1fr_auto] md:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="assetDisplayName">Tên media (để tìm kiếm)</Label>
            <Input id="assetDisplayName" name="displayName" placeholder="VD: Anh bia tu vi thang 3" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assetFile">Tệp upload</Label>
            <Input id="assetFile" name="file" type="file" required />
          </div>
          <Button type="submit" disabled={isUploading}>{isUploading ? "Đang upload..." : "Upload vào kho"}</Button>
          <p className="text-muted-foreground text-xs md:col-span-3">Loại media sẽ tự nhận diện theo tệp upload (ảnh/video).</p>
        </form>

        <div className="space-y-3">
          <form onSubmit={handleSearchSubmit} className="grid gap-2 rounded-lg border p-3 md:grid-cols-[180px_1fr_auto] lg:grid-cols-[180px_260px_1fr_auto] md:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="mediaFilterType">Lọc loại media</Label>
              <Select
                id="mediaFilterType"
                value={filterType}
                onChange={(event) => {
                  const nextType = event.target.value === "video" ? "video" : "image"
                  void handleFilterChange(nextType)
                }}
              >
                <option value="image">Ảnh</option>
                <option value="video">Video</option>
              </Select>
            </div>
            {isAdmin ? (
              <div className="space-y-1.5">
                <Label htmlFor="mediaFilterUploader">Lọc theo người upload</Label>
                <Select
                  id="mediaFilterUploader"
                  value={uploaderFilter}
                  onChange={async (event) => {
                    const nextValue = event.target.value
                    setUploaderFilter(nextValue)
                    setPage(1)
                    await loadMedia({ filterType, searchValue, page: 1, uploaderFilter: nextValue })
                  }}
                >
                  <option value="all">Tất cả người upload</option>
                  {uploaderOptions.map((uploader) => (
                    <option key={uploader.id} value={uploader.id}>
                      {uploader.name} ({uploader.email})
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="mediaSearch">Tìm media</Label>
              <Input
                id="mediaSearch"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Tìm theo tên đặt hoặc tên file..."
              />
            </div>
            <Button type="submit" variant="secondary">Tìm</Button>
          </form>

          {isLoading ? <p className="text-muted-foreground text-sm">Đang tải dữ liệu...</p> : null}
          {!isLoading && items.length === 0 ? <p className="text-muted-foreground text-sm">Không có media phù hợp.</p> : null}

          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {items.map((asset) => (
              <div key={asset.id} className="rounded-lg border p-2">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="line-clamp-1 font-semibold">{asset.displayName || asset.filename}</p>
                    <Badge variant="outline">{asset.assetType === "IMAGE" ? "Ảnh" : "Video"}</Badge>
                    <Badge variant="outline">{asset.visibility === "SHARED" ? "Shared" : "Private"}</Badge>
                  </div>
                  <p className="text-muted-foreground line-clamp-1 text-xs">File: {asset.filename}</p>
                  <p className="text-muted-foreground text-xs">
                    {asset.mimeType} · {toMb(asset.sizeBytes)} · bởi {asset.uploader.name} · {new Date(asset.uploadedAt).toLocaleString("vi-VN")}
                  </p>
                </div>

                <div className="bg-muted/40 mt-2 flex min-h-24 items-center justify-center rounded border p-1">
                  {asset.assetType === "IMAGE" ? (
                    <img
                      src={asset.url}
                      alt={asset.displayName || asset.filename}
                      className="max-h-24 w-auto max-w-full rounded object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <video
                      src={asset.url}
                      controls
                      preload="metadata"
                      className="max-h-24 w-auto max-w-full rounded bg-black/80 object-contain"
                    />
                  )}
                </div>

                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(asset.id)}
                    disabled={deletingId === asset.id}
                  >
                    {deletingId === asset.id ? "Đang xóa..." : "Xóa"}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-muted-foreground text-sm">Trang {page}/{totalPages}</p>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" disabled={page <= 1 || isLoading} onClick={() => void goToPage(page - 1)}>
                Trước
              </Button>
              <Button type="button" size="sm" disabled={page >= totalPages || isLoading} onClick={() => void goToPage(page + 1)}>
                Sau
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
