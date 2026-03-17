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

export function RichTextField({ name, placeholder = "Nhập nội dung bài viết...", defaultValue = "" }: RichTextFieldProps) {
  const completionProviderRef = useRef<IDisposable | null>(null)
  const [mode, setMode] = useState<EditorMode>("classic")
  const [html, setHtml] = useState(defaultValue)

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
