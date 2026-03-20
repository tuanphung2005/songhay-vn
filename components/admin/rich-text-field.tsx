/* eslint-disable @next/next/no-img-element */
"use client"

import { CKEditor } from "@ckeditor/ckeditor5-react"
import Editor from "@monaco-editor/react"
import {
  Alignment,
  AutoLink,
  BlockQuote,
  Bold,
  ClassicEditor,
  Code,
  CodeBlock,
  Essentials,
  FindAndReplace,
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
  GeneralHtmlSupport,
  Heading,
  Highlight,
  HorizontalLine,
  HtmlEmbed,
  Image,
  ImageCaption,
  ImageInsertViaUrl,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  Indent,
  IndentBlock,
  Italic,
  Link,
  ListProperties,
  MediaEmbed,
  Mention,
  List,
  Paragraph,
  PasteFromOffice,
  RemoveFormat,
  ShowBlocks,
  SpecialCharacters,
  SpecialCharactersArrows,
  SpecialCharactersCurrency,
  SpecialCharactersEssentials,
  SpecialCharactersLatin,
  SpecialCharactersMathematical,
  SpecialCharactersText,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TextPartLanguage,
  TodoList,
  Underline,
} from "ckeditor5"
import type { EditorConfig } from "ckeditor5"
import "ckeditor5/ckeditor5-editor.css"
import type { editor as MonacoEditor, IDisposable } from "monaco-editor"
import { useMemo, useRef, useState } from "react"

type RichTextFieldProps = {
  name: string
  placeholder?: string
  defaultValue?: string
  mediaAssets?: Array<{
    id: string
    assetType: "IMAGE" | "VIDEO"
    visibility: "PRIVATE" | "SHARED"
    url: string
    displayName: string | null
    filename: string
  }>
}

type EditorMode = "classic" | "code"

function toPlainText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

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

export function RichTextField({
  name,
  placeholder = "Nhập nội dung bài viết...",
  defaultValue = "",
  mediaAssets = [],
}: RichTextFieldProps) {
  const completionProviderRef = useRef<IDisposable | null>(null)
  const [mode, setMode] = useState<EditorMode>("classic")
  const [html, setHtml] = useState(defaultValue)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [mediaType, setMediaType] = useState<"ALL" | "IMAGE" | "VIDEO">("IMAGE")
  const [searchTerm, setSearchTerm] = useState("")
  const [pickerPage, setPickerPage] = useState(1)
  const pickerPageSize = 12

  const isEmpty = useMemo(() => toPlainText(html).length === 0, [html])
  const classicConfig = useMemo(
    () =>
      ({
        licenseKey: "GPL",
        plugins: [
          Essentials,
          Paragraph,
          Heading,
          Alignment,
          Bold,
          Italic,
          Underline,
          Strikethrough,
          Subscript,
          Superscript,
          Code,
          CodeBlock,
          RemoveFormat,
          FontFamily,
          FontSize,
          FontColor,
          FontBackgroundColor,
          Highlight,
          Link,
          AutoLink,
          List,
          ListProperties,
          TodoList,
          Indent,
          IndentBlock,
          BlockQuote,
          HorizontalLine,
          ShowBlocks,
          FindAndReplace,
          PasteFromOffice,
          SpecialCharacters,
          SpecialCharactersEssentials,
          SpecialCharactersArrows,
          SpecialCharactersCurrency,
          SpecialCharactersLatin,
          SpecialCharactersMathematical,
          SpecialCharactersText,
          TextPartLanguage,
          Table,
          TableToolbar,
          TableCaption,
          TableCellProperties,
          TableColumnResize,
          TableProperties,
          Image,
          ImageCaption,
          ImageResize,
          ImageStyle,
          ImageToolbar,
          ImageInsertViaUrl,
          MediaEmbed,
          HtmlEmbed,
          GeneralHtmlSupport,
          Mention,
        ],
        toolbar: {
          items: [
            "undo",
            "redo",
            "|",
            "heading",
            "|",
            "fontFamily",
            "fontSize",
            "fontColor",
            "fontBackgroundColor",
            "highlight",
            "|",
            "bold",
            "italic",
            "underline",
            "strikethrough",
            "subscript",
            "superscript",
            "code",
            "removeFormat",
            "|",
            "link",
            "insertImageViaUrl",
            "mediaEmbed",
            "insertTable",
            "blockQuote",
            "codeBlock",
            "htmlEmbed",
            "specialCharacters",
            "horizontalLine",
            "|",
            "alignment",
            "bulletedList",
            "numberedList",
            "todoList",
            "outdent",
            "indent",
            "|",
            "showBlocks",
            "findAndReplace",
          ],
          shouldNotGroupWhenFull: true,
        },
        heading: {
          options: [
            { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
            { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
            { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
          ],
        },
        link: {
          addTargetToExternalLinks: true,
        },
        image: {
          toolbar: [
            "toggleImageCaption",
            "imageTextAlternative",
            "|",
            "imageStyle:inline",
            "imageStyle:block",
            "imageStyle:side",
            "|",
            "resizeImage",
          ],
        },
        mediaEmbed: {
          previewsInData: true,
        },
        htmlSupport: {
          allow: [
            {
              name: /.*/,
              attributes: true,
              classes: true,
              styles: true,
            },
          ],
        },
        mention: {
          feeds: [
            {
              marker: "@",
              feed: ["admin", "editor", "reviewer", "seo"],
              minimumCharacters: 1,
            },
          ],
        },
        table: {
          contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "tableProperties", "tableCellProperties"],
        },
        placeholder,
      }) satisfies EditorConfig,
    [placeholder],
  )

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

  function insertMedia(asset: { assetType: "IMAGE" | "VIDEO"; url: string; filename: string; displayName: string | null }) {
    const mediaName = asset.displayName || asset.filename
    const snippet =
      asset.assetType === "IMAGE"
        ? `\n<figure>\n  <img src="${asset.url}" alt="${mediaName}" loading="lazy" />\n  <figcaption>${mediaName}</figcaption>\n</figure>\n`
        : `\n<div class="video-wrap">\n  <video controls src="${asset.url}" title="${mediaName}"></video>\n</div>\n`

    setHtml((previous) => `${previous}${snippet}`)
    setShowMediaPicker(false)
  }

  const filteredMedia = mediaAssets.filter((asset) => {
    if (mediaType !== "ALL" && asset.assetType !== mediaType) {
      return false
    }

    if (!searchTerm.trim()) {
      return true
    }

    const text = `${asset.displayName || ""} ${asset.filename} ${asset.url}`.toLowerCase()
    return text.includes(searchTerm.trim().toLowerCase())
  })

  const pickerTotalPages = Math.max(1, Math.ceil(filteredMedia.length / pickerPageSize))
  const safePickerPage = Math.min(pickerPage, pickerTotalPages)
  const pagedMedia = filteredMedia.slice((safePickerPage - 1) * pickerPageSize, safePickerPage * pickerPageSize)

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
            Trình sửa CMS
          </button>
          <button
            type="button"
            onClick={() => setMode("code")}
            className={`rounded px-2 py-1 font-semibold transition ${mode === "code" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
              }`}
          >
            HTML
          </button>
          <button
            type="button"
            onClick={() => {
              setPickerPage(1)
              setShowMediaPicker(true)
            }}
            className="rounded bg-zinc-900 px-2 py-1 font-semibold text-white transition hover:bg-zinc-700"
          >
            Thêm media
          </button>
        </div>
      </div>

      {showMediaPicker ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-lg border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Chọn media đã upload</p>
                <p className="text-muted-foreground text-xs">Ảnh theo user, video shared cho toàn bộ CMS.</p>
              </div>
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs font-semibold"
                onClick={() => setShowMediaPicker(false)}
              >
                Đóng
              </button>
            </div>
            <div className="grid gap-3 border-b px-4 py-3 md:grid-cols-[180px_1fr]">
              <select
                className="h-9 rounded-md border border-input px-3 text-sm"
                value={mediaType}
                onChange={(event) => {
                  setPickerPage(1)
                  setMediaType(event.target.value as "ALL" | "IMAGE" | "VIDEO")
                }}
              >
                <option value="ALL">Tất cả</option>
                <option value="IMAGE">Ảnh</option>
                <option value="VIDEO">Video</option>
              </select>
              <input
                value={searchTerm}
                onChange={(event) => {
                  setPickerPage(1)
                  setSearchTerm(event.target.value)
                }}
                className="h-9 rounded-md border border-input px-3 text-sm"
                placeholder="Tìm theo tên file hoặc URL..."
              />
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {filteredMedia.length === 0 ? <p className="text-muted-foreground text-sm">Không tìm thấy media phù hợp.</p> : null}
              <div className="grid gap-3 md:grid-cols-2">
                {pagedMedia.map((asset) => (
                  <div key={asset.id} className="rounded-md border p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-semibold">{asset.displayName || asset.filename}</p>
                      <span className="rounded border px-1.5 py-0.5 text-[11px]">
                        {asset.assetType === "IMAGE" ? "Ảnh" : "Video"}
                      </span>
                    </div>
                    {asset.assetType === "IMAGE" ? (
                      <img src={asset.url} alt={asset.filename} className="h-28 w-full rounded border object-cover" loading="lazy" />
                    ) : (
                      <video src={asset.url} controls className="h-28 w-full rounded border bg-black/80 object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => insertMedia(asset)}
                      className="mt-2 w-full rounded bg-zinc-900 px-2 py-1.5 text-xs font-semibold text-white"
                    >
                      Chèn vào nội dung
                    </button>
                  </div>
                ))}
              </div>
              {filteredMedia.length > 0 ? (
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <p className="text-muted-foreground text-sm">Trang {safePickerPage}/{pickerTotalPages}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={safePickerPage <= 1}
                      onClick={() => setPickerPage((value) => Math.max(1, value - 1))}
                    >
                      Trước
                    </button>
                    <button
                      type="button"
                      className="rounded bg-zinc-900 px-2 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={safePickerPage >= pickerTotalPages}
                      onClick={() => setPickerPage((value) => Math.min(pickerTotalPages, value + 1))}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {mode === "classic" ? (
        <div className="ck-full-editor overflow-hidden rounded-md border border-zinc-300 bg-white">
          <CKEditor
            editor={ClassicEditor}
            data={html}
            config={classicConfig}
            onChange={(_event, editor) => setHtml(editor.getData())}
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

      <style jsx global>{`
        .ck-full-editor .ck.ck-toolbar {
          border-left: 0;
          border-right: 0;
          border-top: 0;
        }

        .ck-full-editor .ck.ck-editor__main > .ck-editor__editable {
          min-height: 620px;
          max-height: 70vh;
          padding: 20px;
          font-size: 16px;
          line-height: 1.75;
        }
      `}</style>
    </div>
  )
}
