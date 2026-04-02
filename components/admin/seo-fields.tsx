"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

import { buildAutoSeoDescription, buildAutoSeoTitle } from "@/lib/post-seo"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type SeoFieldsProps = {
  defaultSeoTitle?: string | null
  defaultSeoDescription?: string | null
  initialTitle?: string | null
  initialExcerpt?: string | null
  initialContent?: string | null
  children?: ReactNode
}

function readFieldValue(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name)
  if (
    field instanceof HTMLInputElement ||
    field instanceof HTMLTextAreaElement
  ) {
    return field.value
  }

  return ""
}

export function SeoFields({
  defaultSeoTitle = "",
  defaultSeoDescription = "",
  initialTitle = "",
  initialExcerpt = "",
  initialContent = "",
  children,
}: SeoFieldsProps) {
  const fieldsetRef = useRef<HTMLFieldSetElement>(null)
  const [fallbackSeoTitle, setFallbackSeoTitle] = useState(() =>
    buildAutoSeoTitle({ title: initialTitle })
  )
  const [fallbackSeoDescription, setFallbackSeoDescription] = useState(() =>
    buildAutoSeoDescription({
      title: initialTitle,
      excerpt: initialExcerpt,
      content: initialContent,
    })
  )

  useEffect(() => {
    const form = fieldsetRef.current?.closest("form")
    if (!form) {
      return
    }

    const updateFallbacks = () => {
      const title = readFieldValue(form, "title") || initialTitle
      const excerpt = readFieldValue(form, "excerpt") || initialExcerpt
      const content = readFieldValue(form, "content") || initialContent

      setFallbackSeoTitle(buildAutoSeoTitle({ title }))
      setFallbackSeoDescription(
        buildAutoSeoDescription({
          title,
          excerpt,
          content,
        })
      )
    }

    updateFallbacks()
    form.addEventListener("input", updateFallbacks)
    form.addEventListener("change", updateFallbacks)

    return () => {
      form.removeEventListener("input", updateFallbacks)
      form.removeEventListener("change", updateFallbacks)
    }
  }, [initialContent, initialExcerpt, initialTitle])

  return (
    <fieldset ref={fieldsetRef} className="space-y-3 rounded-lg border p-3">
      <legend className="px-1 text-sm font-semibold">SEO</legend>
      <div className="space-y-1.5">
        <Label htmlFor="seoTitle">Tiêu đề SEO</Label>
        <Input
          id="seoTitle"
          name="seoTitle"
          defaultValue={defaultSeoTitle || ""}
          placeholder={
            fallbackSeoTitle || "Hệ thống sẽ tự tạo từ tiêu đề bài viết"
          }
        />
        <p className="text-xs text-muted-foreground">
          Để trống, hệ thống sẽ tự tạo:{" "}
          {fallbackSeoTitle || "SEO title sẽ lấy theo tiêu đề bài viết"}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="seoDescription">Mô tả SEO</Label>
        <Textarea
          id="seoDescription"
          name="seoDescription"
          defaultValue={defaultSeoDescription || ""}
          className="min-h-20"
          placeholder={
            fallbackSeoDescription || "Hệ thống sẽ tự tạo từ trích dẫn bài viết"
          }
        />
        <p className="text-xs text-muted-foreground">
          Để trống, hệ thống sẽ tự tạo:{" "}
          {fallbackSeoDescription ||
            "SEO description sẽ lấy từ trích dẫn hoặc nội dung"}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="seoKeywords">Từ khóa SEO</Label>
        {children}
      </div>
    </fieldset>
  )
}
