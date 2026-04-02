"use client"

/* eslint-disable @next/next/no-img-element */
import { type FormEvent, useState } from "react"
import { ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UploadTab } from "./media-picker/upload-tab"

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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null)
  const [previewAsset, setPreviewAsset] = useState<MediaAssetRow | null>(null)
  const [filterType, setFilterType] = useState<"image" | "video">("image")
  const [uploaderFilter, setUploaderFilter] = useState("all")
  const [searchValue, setSearchValue] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [isLoading, setIsLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [uploaderOptions, setUploaderOptions] = useState<
    Array<{ id: string; name: string; email: string }>
  >(getInitialUploaderOptions(rows))
  const [items, setItems] = useState<MediaAssetRow[]>(
    rows.filter((item) => item.assetType === "IMAGE").slice(0, 12)
  )

  async function loadMedia(next: {
    filterType: "image" | "video"
    searchValue: string
    page: number
    uploaderFilter: string
  }) {
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

      const endpoint =
        next.filterType === "video"
          ? "/api/uploads/video"
          : "/api/uploads/image"
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

  async function handleDelete(assetId: string) {
    setDeletingId(assetId)

    try {
      const response = await fetch(`/api/media/${assetId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        window.location.assign(
          "/admin?tab=media-library&toast=media_delete_failed"
        )
        return
      }

      await loadMedia({ filterType, searchValue, page, uploaderFilter })
      window.history.replaceState(
        {},
        "",
        "/admin?tab=media-library&toast=media_deleted"
      )
    } catch {
      window.location.assign(
        "/admin?tab=media-library&toast=media_delete_failed"
      )
    } finally {
      setDeletingId(null)
      setDeleteDialogId(null)
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
      <CardContent className="space-y-4 pt-6">
        <p className="text-sm font-semibold">Kho dữ liệu media</p>
        <Tabs defaultValue="library" className="space-y-4">
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-lg bg-muted p-1">
            <TabsTrigger value="library" className="rounded-md px-6 py-2.5">
              Danh sách quy chuẩn
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="rounded-md px-6 py-2.5 font-bold text-primary"
            >
              + Tải lên mới
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="upload"
            className="m-0 overflow-hidden rounded-2xl border bg-zinc-50/50 shadow-sm"
          >
            <UploadTab
              hideSaveToLibrary
              submitText="Đẩy lên Kho Media"
              onSelect={() =>
                window.location.assign(
                  "/admin?tab=media-library&toast=media_uploaded"
                )
              }
            />
          </TabsContent>

          <TabsContent value="library" className="m-0 space-y-4">
            <form
              onSubmit={handleSearchSubmit}
              className="grid gap-2 rounded-lg border p-3 md:grid-cols-[180px_1fr_auto] md:items-end lg:grid-cols-[180px_260px_1fr_auto]"
            >
              <div className="space-y-1.5">
                <Label htmlFor="mediaFilterType">Lọc loại media</Label>
                <Select
                  id="mediaFilterType"
                  value={filterType}
                  onChange={(event) => {
                    const nextType =
                      event.target.value === "video" ? "video" : "image"
                    void handleFilterChange(nextType)
                  }}
                >
                  <option value="image">Ảnh</option>
                  <option value="video">Video</option>
                </Select>
              </div>
              {isAdmin ? (
                <div className="space-y-1.5">
                  <Label htmlFor="mediaFilterUploader">
                    Lọc theo người upload
                  </Label>
                  <Select
                    id="mediaFilterUploader"
                    value={uploaderFilter}
                    onChange={async (event) => {
                      const nextValue = event.target.value
                      setUploaderFilter(nextValue)
                      setPage(1)
                      await loadMedia({
                        filterType,
                        searchValue,
                        page: 1,
                        uploaderFilter: nextValue,
                      })
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
              <Button type="submit" variant="secondary">
                <Search className="size-4" />
                Tìm
              </Button>
            </form>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Đang tải dữ liệu...
              </p>
            ) : null}
            {!isLoading && items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Không có media phù hợp.
              </p>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {items.map((asset) => (
                <div key={asset.id} className="rounded-lg border p-2">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="line-clamp-1 font-semibold">
                        {asset.displayName || asset.filename}
                      </p>
                      <Badge variant="outline">
                        {asset.assetType === "IMAGE" ? "Ảnh" : "Video"}
                      </Badge>
                      <Badge variant="outline">Shared</Badge>
                    </div>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      File: {asset.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {asset.mimeType} · {toMb(asset.sizeBytes)} · bởi{" "}
                      {asset.uploader.name} ·{" "}
                      {new Date(asset.uploadedAt).toLocaleString("vi-VN")}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="mt-2 flex min-h-24 w-full items-center justify-center rounded border bg-muted/40 p-1 transition hover:border-zinc-400"
                    onClick={() => setPreviewAsset(asset)}
                  >
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
                  </button>

                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteDialogId(asset.id)}
                      disabled={deletingId === asset.id}
                    >
                      <Trash2 className="size-4" />
                      {deletingId === asset.id ? "Đang xóa..." : "Xóa"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <AlertDialog
              open={deleteDialogId !== null}
              onOpenChange={(open) => !open && setDeleteDialogId(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Xóa media khỏi kho dữ liệu?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Hành động này sẽ xóa tệp media đã chọn và không thể hoàn
                    tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingId !== null}>
                    Hủy
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={deleteDialogId === null || deletingId !== null}
                    onClick={() => {
                      if (deleteDialogId !== null) {
                        void handleDelete(deleteDialogId)
                      }
                    }}
                  >
                    {deletingId !== null ? "Đang xóa..." : "Xóa"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Dialog
              open={previewAsset !== null}
              onOpenChange={(open) => !open && setPreviewAsset(null)}
            >
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>
                    {previewAsset?.displayName ||
                      previewAsset?.filename ||
                      "Xem trước media"}
                  </DialogTitle>
                  <DialogDescription>
                    {previewAsset
                      ? `${previewAsset.mimeType} · ${toMb(previewAsset.sizeBytes)} · tải bởi ${previewAsset.uploader.name}`
                      : ""}
                  </DialogDescription>
                </DialogHeader>

                {previewAsset ? (
                  <div className="max-h-[70vh] overflow-auto rounded border bg-zinc-50 p-2">
                    {previewAsset.assetType === "IMAGE" ? (
                      <img
                        src={previewAsset.url}
                        alt={previewAsset.displayName || previewAsset.filename}
                        className="h-auto max-h-[65vh] w-full rounded object-contain"
                      />
                    ) : (
                      <video
                        src={previewAsset.url}
                        controls
                        preload="metadata"
                        className="h-auto max-h-[65vh] w-full rounded bg-black"
                      />
                    )}
                  </div>
                ) : null}
              </DialogContent>
            </Dialog>

            <div className="flex items-center justify-between border-t pt-3">
              <p className="text-sm text-muted-foreground">
                Trang {page}/{totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || isLoading}
                  onClick={() => void goToPage(page - 1)}
                >
                  <ChevronLeft className="size-4" />
                  Trước
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => void goToPage(page + 1)}
                >
                  Sau
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
