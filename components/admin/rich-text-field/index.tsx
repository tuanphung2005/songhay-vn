"use client"

import { useMemo, useState, useRef } from "react"
import { EditorMode, RichTextFieldProps } from "./types"
import { CKEditorWrapper } from "./ck-editor-wrapper"
import { MonacoEditorWrapper } from "./monaco-editor-wrapper"
import { MediaPicker } from "../media-picker"
import { Plus, FileText, Code as CodeIcon, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardHeader } from "@/components/ui/card"

function toPlainText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function RichTextField({
  name,
  placeholder = "Nhập nội dung bài viết...",
  defaultValue = "",
  mediaAssets = [],
  currentUserId,
}: RichTextFieldProps) {
  const [mode, setMode] = useState<EditorMode>("classic")
  const [html, setHtml] = useState(defaultValue)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const editorRef = useRef<any>(null)

  const isEmpty = useMemo(() => toPlainText(html).length === 0, [html])

  function insertMedia(asset: { assetType: "IMAGE" | "VIDEO"; url: string; filename: string; displayName: string | null }) {
    const currentImgCount = (html.match(/<img /gi) || []).length
    const currentVideoCount = (html.match(/<video /gi) || []).length

    const caption = asset.assetType === "IMAGE" ? `Ảnh ${currentImgCount + 1}.` : `Video ${currentVideoCount + 1}.`

    const snippet =
      asset.assetType === "IMAGE"
        ? `\n<figure class="image image-style-align-center" style="display: table; margin: 2em auto; text-align: center;">\n  <img src="${asset.url}" alt="${caption}" loading="lazy" />\n  <figcaption>${caption}</figcaption>\n</figure>\n<p>&nbsp;</p>\n`
        : `\n<div class="video-wrap" style="text-align: center; margin: 2em auto;">\n  <video controls src="${asset.url}" title="${caption}" style="max-width: 100%; height: auto; display: inline-block;"></video>\n  <div class="video-caption" style="margin-top: 0.3em; font-size: 0.9em; color: #6b7280; font-style: italic; text-align: center;">${caption}</div>\n</div>\n<p>&nbsp;</p>\n`

    if (mode === "classic" && editorRef.current) {
        const viewFragment = editorRef.current.data.processor.toView(snippet)
        const modelFragment = editorRef.current.data.toModel(viewFragment)
        editorRef.current.model.change((writer: any) => {
           editorRef.current.model.insertContent(modelFragment)
        })
        setHtml(editorRef.current.getData())
    } else {
        setHtml((previous) => `${previous}${snippet}`)
    }
    setShowMediaPicker(false)
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name={name} value={html} />

      <Card className="overflow-hidden border-zinc-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-2 border-b bg-zinc-50/50">
          <Tabs value={mode} onValueChange={(v) => setMode(v as EditorMode)} className="w-auto">
            <TabsList variant="line" className="h-9 bg-transparent p-0 border-0">
              <TabsTrigger value="classic" className="px-4 py-2 font-bold data-active:text-primary data-[variant=line]:data-active:after:-bottom-2.25">
                <FileText className="mr-2 h-4 w-4" />
                Trình soạn thảo
              </TabsTrigger>
              <TabsTrigger value="code" className="px-4 py-2 font-bold data-active:text-primary data-[variant=line]:data-active:after:-bottom-2.25">
                <CodeIcon className="mr-2 h-4 w-4" />
                Mã HTML
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setShowMediaPicker(true)}
            className="font-bold border-zinc-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm media
          </Button>
        </CardHeader>

        <div className="bg-white">
          {mode === "classic" ? (
            <CKEditorWrapper
              data={html}
              onChange={setHtml}
              placeholder={placeholder}
              onReady={(editor) => { editorRef.current = editor }}
            />
          ) : (
            <MonacoEditorWrapper
              value={html}
              onChange={setHtml}
            />
          )}
        </div>
      </Card>

      <MediaPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={insertMedia}
        mediaAssets={mediaAssets}
        currentUserId={currentUserId}
      />

      {isEmpty && (
        <Alert variant="default" className="border-amber-200 bg-amber-50/50 text-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="font-semibold italic">
            Lưu ý: Nội dung bài viết hiện đang trống.
          </AlertDescription>
        </Alert>
      )}

      <style jsx global>{`
        .ck-full-editor .ck.ck-toolbar {
          border-left: 0;
          border-right: 0;
          border-top: 0;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb !important;
        }

        .ck-full-editor .ck.ck-editor__main > .ck-editor__editable {
          min-height: 600px;
          padding: 32px 40px;
          font-size: 17px;
          line-height: 1.8;
          color: #111827;
          resize: vertical;
          overflow-y: auto;
        }

        .ck-content figure.image {
          margin: 2em auto;
        }

        .ck-content figure.image img {
          max-width: 100%;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .ck-content figure.image figcaption {
          margin-top: 0.3em;
          font-size: 0.9em;
          color: #6b7280;
          font-style: italic;
          text-align: center;
        }

        .ck-content .video-caption {
          margin-top: 0.3em;
          font-size: 0.9em;
          color: #6b7280;
          font-style: italic;
          text-align: center;
        }
      `}</style>
    </div>
  )
}
