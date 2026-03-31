"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, Plus, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { parseSeoKeywordInput } from "@/lib/seo-keywords"

type SeoKeywordOption = {
  id: string
  keyword: string
}

type SeoKeywordPickerProps = {
  options: SeoKeywordOption[]
  initialSelectedIds?: string[]
  initialCustomKeywords?: string[]
}

function normalizeKeyword(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, " ")
}

function labelKeyword(raw: string) {
  return raw.trim().replace(/\s+/g, " ")
}

export function SeoKeywordPicker({
  options,
  initialSelectedIds = [],
  initialCustomKeywords = [],
}: SeoKeywordPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState(() => {
    const optionIds = new Set(options.map((item) => item.id))
    return [...new Set(initialSelectedIds.filter((id) => optionIds.has(id)))]
  })
  const [customKeywords, setCustomKeywords] = useState(() => parseSeoKeywordInput(initialCustomKeywords.join(", ")))

  const optionById = useMemo(() => {
    const map = new Map<string, SeoKeywordOption>()
    for (const item of options) {
      map.set(item.id, item)
    }
    return map
  }, [options])

  const normalizedCustom = useMemo(() => new Set(customKeywords.map((item) => normalizeKeyword(item))), [customKeywords])
  const normalizedSelected = useMemo(
    () => new Set(selectedIds.map((id) => normalizeKeyword(optionById.get(id)?.keyword || "")).filter(Boolean)),
    [optionById, selectedIds]
  )

  const selectedOptions = useMemo(
    () => selectedIds.map((id) => optionById.get(id)).filter((item): item is SeoKeywordOption => Boolean(item)),
    [optionById, selectedIds]
  )

  const normalizedQuery = normalizeKeyword(query)
  const canCreateQueryKeyword =
    normalizedQuery.length > 0 &&
    !normalizedCustom.has(normalizedQuery) &&
    !normalizedSelected.has(normalizedQuery) &&
    !options.some((item) => normalizeKeyword(item.keyword) === normalizedQuery)

  const suggestions = useMemo(() => {
    const selectedSet = new Set(selectedIds)
    const base = options.filter((item) => !selectedSet.has(item.id))
    if (!normalizedQuery) {
      return base.slice(0, 10)
    }

    return base
      .filter((item) => normalizeKeyword(item.keyword).includes(normalizedQuery))
      .slice(0, 12)
  }, [normalizedQuery, options, selectedIds])

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current) {
        return
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [])

  function selectSuggestion(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setQuery("")
  }

  function addCustomKeyword(raw: string) {
    const label = labelKeyword(raw)
    const normalized = normalizeKeyword(label)
    if (!normalized) {
      return
    }

    setCustomKeywords((prev) => {
      if (prev.some((item) => normalizeKeyword(item) === normalized)) {
        return prev
      }
      return [...prev, label]
    })
    setQuery("")
    setOpen(true)
  }

  return (
    <div ref={rootRef} className="space-y-2">
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="seoKeywordIds" value={id} />
      ))}
      <input type="hidden" name="seoKeywords" value={customKeywords.join(", ")} />

      <div className="relative">
        <Input
          id="seoKeywords"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              if (canCreateQueryKeyword) {
                addCustomKeyword(query)
                return
              }

              if (suggestions[0]) {
                selectSuggestion(suggestions[0].id)
              }
            }
          }}
          placeholder="Tìm từ khóa có sẵn hoặc nhập để thêm mới"
        />

        {open ? (
          <div className="absolute z-30 mt-2 w-full rounded-md border bg-popover p-1 shadow-lg">
            {canCreateQueryKeyword ? (
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={() => addCustomKeyword(query)}
              >
                <Plus className="size-4" />
                <span>
                  Thêm mới <strong>{labelKeyword(query)}</strong>
                </span>
              </button>
            ) : null}

            {suggestions.length > 0 ? (
              <div className="max-h-56 overflow-y-auto">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => selectSuggestion(item.id)}
                  >
                    <Check className="size-4 text-muted-foreground" />
                    <span>{item.keyword}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {!canCreateQueryKeyword && suggestions.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground">Không tìm thấy từ khóa phù hợp.</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedOptions.map((item) => (
          <Badge key={item.id} variant="outline" className="gap-1.5 pr-1">
            {item.keyword}
            <button
              type="button"
              className="inline-flex size-4 items-center justify-center rounded-full hover:bg-muted"
              onClick={() => setSelectedIds((prev) => prev.filter((id) => id !== item.id))}
              aria-label={`Bỏ chọn ${item.keyword}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        {customKeywords.map((item) => (
          <Badge key={`custom-${item}`} variant="secondary" className="gap-1.5 pr-1">
            {item}
            <button
              type="button"
              className="inline-flex size-4 items-center justify-center rounded-full hover:bg-muted"
              onClick={() => setCustomKeywords((prev) => prev.filter((value) => value !== item))}
              aria-label={`Xóa từ khóa ${item}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>

      <p className="text-muted-foreground text-xs">
        Chọn từ khóa có sẵn trong popup gợi ý. Nếu chưa có, nhấn dấu + để thêm tạm vào bài; hệ thống chỉ lưu vào DB khi bạn submit bài.
      </p>
    </div>
  )
}