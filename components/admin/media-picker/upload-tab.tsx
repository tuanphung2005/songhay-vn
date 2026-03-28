"use client"

import { useState, useMemo, useEffect } from "react"
import { MediaAsset } from "./types"
import { UploadCloud, FileImage, FileVideo, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

type UploadTabProps = {
  onSelect: (asset: { assetType: "IMAGE" | "VIDEO"; url: string; filename: string; displayName: string | null }) => void
  submitText?: string
  hideSaveToLibrary?: boolean
}

export function UploadTab({ onSelect, submitText = "Xác nhận tải lên và chèn", hideSaveToLibrary = false }: UploadTabProps) {
  const [file, setFile] = useState<File | null>(null)
  const [saveToLibrary, setSaveToLibrary] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewUrl = useMemo(() => {
    if (!file) return null
    return URL.createObjectURL(file)
  }, [file])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleUpload() {
    if (!file) return

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("skipLibrary", (!saveToLibrary).toString())

    const endpoint = file.type.startsWith("video/") ? "/api/uploads/video" : "/api/uploads/image"

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Upload failed")
      }

      const data = await response.json()
      onSelect({
        assetType: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
        url: data.url,
        filename: file.name,
        displayName: null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi upload.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[40vh] space-y-8 bg-white flex-1 relative">
      <div className="w-full max-w-md space-y-6">
        <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center hover:border-zinc-400 hover:bg-zinc-50/50 transition-all cursor-pointer relative group">
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept="image/*,video/*"
          />
          <div className="space-y-4">
            {file && previewUrl ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/5 flex items-center justify-center border shadow-inner">
                {file.type.startsWith("video/") ? (
                  <video
                    src={previewUrl}
                    className="max-h-full max-w-full object-contain"
                    controls
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="max-h-full max-w-full object-contain"
                  />
                )}
                <div className="absolute top-2 right-2 bg-black/60 text-white backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-bold shadow-sm">
                  Nhấp để chọn lại
                </div>
              </div>
            ) : (
              <div className="mx-auto w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 group-hover:bg-zinc-100 transition-all shadow-sm">
                <UploadCloud className="w-7 h-7" />
              </div>
            )}
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-zinc-900 line-clamp-1 px-4">
                {file ? file.name : "Kéo thả hoặc nhấp để chọn tệp"}
              </p>
              {!file && <p className="text-xs text-zinc-400 font-medium">Hỗ trợ Ảnh và Video (Tối đa 200MB)</p>}
            </div>
          </div>
        </div>

        {!hideSaveToLibrary && (
          <div className="flex items-center space-x-3 px-1">
            <Checkbox
              id="saveToLibrary"
              checked={saveToLibrary}
              onCheckedChange={(v) => setSaveToLibrary(v === true)}
            />
            <Label htmlFor="saveToLibrary" className="text-sm font-bold text-muted-foreground cursor-pointer select-none">
              Lưu vào kho media chung của hệ thống
            </Label>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="py-3">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="button"
          disabled={!file || isUploading}
          onClick={handleUpload}
          className="w-full h-12 rounded-xl font-bold shadow-md transition-all"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang xử lý tải lên...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {submitText}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
