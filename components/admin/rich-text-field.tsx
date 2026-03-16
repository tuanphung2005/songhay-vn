"use client"

import Editor from "@monaco-editor/react"
import { Editor as TinyMCEEditor } from "@tinymce/tinymce-react"
import type { editor as MonacoEditor, IDisposable } from "monaco-editor"
import { useMemo, useRef, useState } from "react"

type RichTextFieldProps = {
  name: string
  placeholder?: string
  defaultValue?: string
}

type EditorMode = "classic" | "code"

function toPlainText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const STARTER_TEMPLATE = `<h2>Tieu de bai viet</h2>
<p>Nhap doan mo dau tai day...</p>

<h3>Noi dung chinh</h3>
<p>Viet noi dung HTML thuong tai day.</p>

<ul>
  <li>Y 1</li>
  <li>Y 2</li>
</ul>
`

const COMPLETION_ITEMS: Array<{ label: string; insertText: string; documentation: string }> = [
  {
    label: "article-shell",
    insertText:
      "<article>\n  <header>\n    <h1>${1:Tieu de bai viet}</h1>\n    <p>${2:Mo ta ngan}</p>\n  </header>\n\n  <section>\n    <h2>${3:Tieu de muc}</h2>\n    <p>${4:Noi dung}</p>\n  </section>\n</article>",
    documentation: "Khung bai viet co header va section.",
  },
  {
    label: "table-basic",
    insertText:
      "<table>\n  <thead>\n    <tr><th>${1:Cot 1}</th><th>${2:Cot 2}</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>${3:Du lieu 1}</td><td>${4:Du lieu 2}</td></tr>\n  </tbody>\n</table>",
    documentation: "Bang HTML co thead va tbody.",
  },
  {
    label: "image-figure",
    insertText:
      "<figure>\n  <img src=\"${1:https://}\" alt=\"${2:Mo ta anh}\" loading=\"lazy\" />\n  <figcaption>${3:Chu thich anh}</figcaption>\n</figure>",
    documentation: "Anh kem chu thich figure/figcaption.",
  },
  {
    label: "youtube-embed",
    insertText:
      "<div class=\"video-wrap\">\n  <iframe src=\"${1:https://www.youtube.com/embed/...}\" title=\"${2:Video}\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen></iframe>\n</div>",
    documentation: "Khung nhung YouTube co thuoc tinh an toan.",
  },
]

export function RichTextField({ name, placeholder = "Nhập nội dung bài viết...", defaultValue = "" }: RichTextFieldProps) {
  const completionProviderRef = useRef<IDisposable | null>(null)
  const [mode, setMode] = useState<EditorMode>("classic")
  const [html, setHtml] = useState(defaultValue)
  const tinyMceApiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY

  const isEmpty = useMemo(() => toPlainText(html).length === 0, [html])

  function handleEditorMount(editor: MonacoEditor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) {
    if (completionProviderRef.current) {
      completionProviderRef.current.dispose()
    }

    completionProviderRef.current = monaco.languages.registerCompletionItemProvider("html", {
      triggerCharacters: ["<", " ", "/", "-"],
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }

        const suggestions = COMPLETION_ITEMS.map((item) => ({
          label: item.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: item.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: item.documentation,
          range,
        }))

        return { suggestions }
      },
    })
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={html} />

      <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("classic")}
            className={`rounded px-2 py-1 font-semibold transition ${mode === "classic" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
              }`}
          >
            Classic CMS
          </button>
          <button
            type="button"
            onClick={() => setMode("code")}
            className={`rounded px-2 py-1 font-semibold transition ${mode === "code" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
              }`}
          >
            HTML Code
          </button>
        </div>
      </div>

      {mode === "classic" ? (
        <div className="overflow-hidden rounded-md border border-zinc-300 bg-white">
          <TinyMCEEditor
            apiKey={tinyMceApiKey}
            value={html}
            onEditorChange={(content) => setHtml(content)}
            init={{
              height: 620,
              menubar: "file edit view insert format tools table help",
              toolbar_sticky: true,
              branding: false,
              resize: true,
              convert_urls: false,
              browser_spellcheck: true,
              contextmenu: "link image table",
              plugins: [
                "advlist",
                "anchor",
                "autolink",
                "autosave",
                "charmap",
                "code",
                "codesample",
                "directionality",
                "emoticons",
                "fullscreen",
                "help",
                "image",
                "insertdatetime",
                "link",
                "lists",
                "media",
                "preview",
                "searchreplace",
                "table",
                "visualblocks",
                "wordcount",
              ],
              toolbar:
                "undo redo | restoredraft | blocks fontfamily fontsize | bold italic underline strikethrough forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link unlink anchor image media table | removeformat | charmap emoticons | ltr rtl | searchreplace visualblocks code preview fullscreen help",
              quickbars_selection_toolbar:
                "bold italic underline | blocks | forecolor backcolor | quicklink blockquote",
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
                "body { font-family: Be Vietnam Pro, Arial, sans-serif; font-size: 16px; line-height: 1.7; } img { max-width: 100%; height: auto; } table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #d4d4d8; padding: 8px; }",
            }}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-zinc-300">
          <Editor
            height="560px"
            defaultLanguage="html"
            value={html}
            onMount={handleEditorMount}
            onChange={(value) => setHtml(value ?? "")}
            options={{
              minimap: { enabled: false },
              wordWrap: "on",
              lineNumbers: "on",
              tabSize: 2,
              insertSpaces: true,
              fontSize: 14,
              suggestOnTriggerCharacters: true,
              quickSuggestions: {
                other: true,
                comments: false,
                strings: true,
              },
              snippetSuggestions: "top",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              formatOnPaste: true,
              formatOnType: true,
            }}
            theme="vs"
          />
        </div>
      )}

      {isEmpty ? <p className="text-xs text-amber-600">Nội dung bài viết đang trống.</p> : null}
    </div>
  )
}
