export type MediaAsset = {
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
}

export type MediaPickerProps = {
  isOpen: boolean
  onClose: () => void
  onSelect: (asset: { assetType: "IMAGE" | "VIDEO"; url: string; filename: string; displayName: string | null }) => void
  mediaAssets: MediaAsset[]
  currentUserId?: string
}

export type PickerTab = "library" | "upload" | "link"
