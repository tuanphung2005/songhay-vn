"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { MediaPicker } from "@/components/admin/media-picker"
import type { MediaAsset } from "@/components/admin/media-picker/types"

type ThumbnailPickerProps = {
  defaultValue?: string
  mediaAssets: MediaAsset[]
  currentUserId: string
}

export function ThumbnailPicker({
  defaultValue = "",
  mediaAssets,
  currentUserId,
}: ThumbnailPickerProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState(defaultValue)
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id="thumbnailUrl"
          name="thumbnailUrl"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="https://..."
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => setIsMediaPickerOpen(true)}
        >
          Kho ảnh
        </Button>
      </div>
      {thumbnailUrl && (
        <div className="mt-2 text-center bg-zinc-50 border rounded-lg p-2">
          <Image
            src={thumbnailUrl}
            alt="Thumbnail preview"
            width={400}
            height={225}
            className="h-auto max-h-32 mx-auto rounded object-contain"
          />
        </div>
      )}

      <MediaPicker
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(asset) => {
          if (asset.assetType === "IMAGE") {
            setThumbnailUrl(asset.url)
            setIsMediaPickerOpen(false)
          } else {
            alert("Vui lòng chọn hoặc tải lên một file Ảnh cho ảnh đại diện.")
          }
        }}
        mediaAssets={mediaAssets}
        currentUserId={currentUserId}
      />
    </div>
  )
}
