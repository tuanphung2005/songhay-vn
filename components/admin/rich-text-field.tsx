"use client"

import { Editor } from "@tinymce/tinymce-react"
import { useMemo, useRef, useState } from "react"

type RichTextFieldProps = {
  name: string
  placeholder?: string
  defaultValue?: string
}

function toPlainText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function RichTextField({ name, placeholder = "Nhập nội dung bài viết...", defaultValue = "" }: RichTextFieldProps) {
  const editorRef = useRef<unknown>(null)
  const [html, setHtml] = useState(defaultValue)

  const isEmpty = useMemo(() => toPlainText(html).length === 0, [html])

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={html} />

      <Editor
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
        initialValue={defaultValue}
        onInit={(_event, editor) => {
          editorRef.current = editor
          setHtml(editor.getContent({ format: "html" }))
        }}
        onEditorChange={(content) => setHtml(content)}
        init={{
          height: 560,
          menubar: "file edit view insert format tools table help",
          branding: false,
          resize: true,
          placeholder,
          toolbar_sticky: true,
          convert_urls: false,
          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "preview",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "insertdatetime",
            "media",
            "table",
            "wordcount",
          ],
          toolbar:
            "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | removeformat code preview fullscreen",
          image_title: true,
          automatic_uploads: true,
          file_picker_types: "image",
          images_upload_handler: async (blobInfo) => {
            const formData = new FormData()
            formData.append("file", blobInfo.blob(), blobInfo.filename())

            const response = await fetch("/api/uploads/image", {
              method: "POST",
              body: formData,
            })

            if (!response.ok) {
              throw new Error("Upload ảnh thất bại")
            }

            const payload = (await response.json()) as { url?: string }
            if (!payload.url) {
              throw new Error("Không nhận được URL ảnh")
            }

            return payload.url
          },
          content_style:
            "body { font-family: Be Vietnam Pro, Arial, sans-serif; font-size: 16px; line-height: 1.7; } img { max-width: 100%; height: auto; }",
        }}
      />

      {isEmpty ? <p className="text-xs text-amber-600">Nội dung bài viết đang trống.</p> : null}

      <p className="text-muted-foreground text-xs">
        TinyMCE có trải nghiệm gần Microsoft Word hơn, hỗ trợ chèn ảnh trực tiếp trong bài qua Cloudinary.
      </p>
    </div>
  )
}
