"use client"

import { useState, useEffect } from "react"
import { MediaPickerProps, PickerTab, MediaAsset } from "./types"
import { LibraryTab } from "./library-tab"
import { UploadTab } from "./upload-tab"
import { LinkTab } from "./link-tab"
import { Library, UploadCloud, Link as LinkIcon, Image as ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export function MediaPicker({ isOpen, onClose, onSelect, mediaAssets, currentUserId }: MediaPickerProps) {
  const [activeTab, setActiveTab] = useState<PickerTab>("library")
  const [localAssets, setLocalAssets] = useState<MediaAsset[]>(mediaAssets)

  useEffect(() => {
    setLocalAssets(mediaAssets)
  }, [mediaAssets])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden sm:max-w-4xl">
        <DialogHeader className="px-6 py-4 border-b bg-zinc-50/50 flex-row items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <DialogTitle className="text-lg font-bold">Thêm Media vào bài viết</DialogTitle>
            <DialogDescription className="text-xs font-medium">
              Chọn từ kho, tải lên mới hoặc chèn qua URL.
            </DialogDescription>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PickerTab)} className="flex-1 flex flex-col">
          <div className="px-2 border-b">
            <TabsList variant="line" className="h-auto p-0 bg-transparent gap-2">
              <TabsTrigger value="library" className="px-6 py-3.5 font-bold data-active:border-b-2 data-active:border-zinc-900 data-active:text-zinc-900 rounded-none transition-none shadow-none">
                <Library className="mr-2 w-4 h-4" />
                Kho media
              </TabsTrigger>
              <TabsTrigger value="upload" className="px-6 py-3.5 font-bold data-active:border-b-2 data-active:border-zinc-900 data-active:text-zinc-900 rounded-none transition-none shadow-none">
                <UploadCloud className="mr-2 w-4 h-4" />
                Tải lên mới
              </TabsTrigger>
              <TabsTrigger value="link" className="px-6 py-3.5 font-bold data-active:border-b-2 data-active:border-zinc-900 data-active:text-zinc-900 rounded-none transition-none shadow-none">
                <LinkIcon className="mr-2 w-4 h-4" />
                Chèn từ Link
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
            <TabsContent value="library" className="flex-1 flex-col data-[state=active]:flex data-[state=inactive]:hidden min-h-0 m-0 outline-none">
              <LibraryTab
                mediaAssets={localAssets}
                currentUserId={currentUserId}
                onSelect={onSelect}
              />
            </TabsContent>
            <TabsContent value="upload" className="flex-1 flex-col data-[state=active]:flex data-[state=inactive]:hidden min-h-0 m-0 outline-none">
              <UploadTab 
                currentUserId={currentUserId}
                onSelect={(item, fullAsset) => {
                  if (fullAsset) setLocalAssets(prev => [fullAsset, ...prev])
                  onSelect(item)
                }} 
              />
            </TabsContent>
            <TabsContent value="link" className="flex-1 flex-col data-[state=active]:flex data-[state=inactive]:hidden min-h-0 m-0 outline-none">
              <LinkTab onSelect={onSelect} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
