"use client"

import Editor from "@monaco-editor/react"
import type { editor as MonacoEditor, IDisposable } from "monaco-editor"
import { useRef } from "react"
import { COMPLETION_ITEMS } from "./snippets"

type MonacoEditorWrapperProps = {
  value: string
  onChange: (value: string) => void
}

export function MonacoEditorWrapper({ value, onChange }: MonacoEditorWrapperProps) {
  const completionProviderRef = useRef<IDisposable | null>(null)

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
    <div className="overflow-hidden rounded-md border border-zinc-300">
      <Editor
        height="560px"
        defaultLanguage="html"
        value={value}
        onMount={handleEditorMount}
        onChange={(val) => onChange(val ?? "")}
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
  )
}
