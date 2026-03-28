"use client"

import { useMemo, useRef } from "react"
import { CKEditor } from "@ckeditor/ckeditor5-react"
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
  WordCount,
  Plugin,
  ButtonView,
  type EditorConfig,
} from "ckeditor5"
import "ckeditor5/ckeditor5-editor.css"

class PastePlainTextPlugin extends Plugin {
  init() {
    const editor = this.editor
    editor.ui.componentFactory.add("pastePlainText", (locale) => {
      const view = new ButtonView(locale)
      view.set({
        label: "Dán text",
        tooltip: "Dán văn bản thuần (Ctrl+Shift+V)",
        withText: true,
      })

      view.on("execute", async () => {
        try {
          const text = await navigator.clipboard.readText()
          if (text) {
            editor.model.change((writer) => {
              editor.model.insertContent(writer.createText(text))
            })
          }
        } catch (err) {
          console.error(err)
          alert("Trình duyệt chặn lấy clipboard. Vui lòng bấm Ctrl+Shift+V.")
        }
      })

      return view
    })
  }
}

type CKEditorWrapperProps = {
  data: string
  onChange: (data: string) => void
  placeholder?: string
}

export function CKEditorWrapper({ data, onChange, placeholder }: CKEditorWrapperProps) {
  const wordCountRef = useRef<HTMLDivElement>(null)

  const config = useMemo(() => ({
    licenseKey: "GPL",
    plugins: [
      Essentials, Paragraph, Heading, Alignment, Bold, Italic, Underline,
      Strikethrough, Subscript, Superscript, Code, CodeBlock, RemoveFormat,
      FontFamily, FontSize, FontColor, FontBackgroundColor, Highlight,
      Link, AutoLink, List, ListProperties, TodoList, Indent, IndentBlock,
      BlockQuote, HorizontalLine, ShowBlocks, FindAndReplace, PasteFromOffice,
      SpecialCharacters, SpecialCharactersEssentials, SpecialCharactersArrows,
      SpecialCharactersCurrency, SpecialCharactersLatin, SpecialCharactersMathematical,
      SpecialCharactersText, TextPartLanguage, Table, TableToolbar, TableCaption,
      TableCellProperties, TableColumnResize, TableProperties, Image, ImageCaption,
      ImageResize, ImageStyle, ImageToolbar, ImageInsertViaUrl, MediaEmbed,
      HtmlEmbed, GeneralHtmlSupport, Mention, PastePlainTextPlugin, WordCount,
    ],
    toolbar: {
      items: [
        "undo", "redo", "pastePlainText", "|", "heading", "|",
        "fontFamily", "fontSize", "fontColor", "fontBackgroundColor", "highlight", "|",
        "bold", "italic", "underline", "strikethrough", "subscript", "superscript",
        "code", "removeFormat", "|", "link", "insertImageViaUrl", "mediaEmbed",
        "insertTable", "blockQuote", "codeBlock", "htmlEmbed", "specialCharacters",
        "horizontalLine", "|", "alignment", "bulletedList", "numberedList", "todoList",
        "outdent", "indent", "|", "showBlocks", "findAndReplace",
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
    link: { addTargetToExternalLinks: true },
    image: {
      toolbar: [
        "toggleImageCaption", "imageTextAlternative", "|",
        "imageStyle:inline", "imageStyle:block", "imageStyle:side", "|", "resizeImage",
      ],
    },
    mediaEmbed: { previewsInData: true },
    htmlSupport: {
      allow: [{ name: /.*/, attributes: true, classes: true, styles: true }],
    },
    mention: {
      feeds: [{ marker: "@", feed: ["admin", "editor", "reviewer", "seo"], minimumCharacters: 1 }],
    },
    table: {
      contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "tableProperties", "tableCellProperties"],
    },
    placeholder,
  }) satisfies EditorConfig, [placeholder])

  return (
    <div className="ck-full-editor overflow-hidden rounded-md border border-zinc-300 bg-white flex flex-col">
      <div className="flex-1 overflow-hidden">
        <CKEditor
          editor={ClassicEditor}
          data={data}
          config={config}
          onChange={(_event, editor) => onChange(editor.getData())}
          onReady={(editor) => {
            const wordCountPlugin = editor.plugins.get("WordCount")
            if (wordCountRef.current && wordCountPlugin) {
              wordCountRef.current.innerHTML = ""
              wordCountRef.current.appendChild(wordCountPlugin.wordCountContainer)
            }
          }}
        />
      </div>
      <div ref={wordCountRef} className="px-3 md:px-4 py-1.5 bg-zinc-50 border-t border-zinc-200 text-[11px] text-zinc-500 font-medium flex justify-end items-center empty:hidden"></div>
    </div>
  )
}
