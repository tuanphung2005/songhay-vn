'use client'
import { useState, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

export function CategorySelector({
  categories,
  defaultCategoryId,
}: {
  categories: { id: string; name: string; parentId?: string | null }[]
  defaultCategoryId?: string
}) {
  const mainCategories = useMemo(() => categories.filter(c => !c.parentId), [categories])

  const initialMainCat = useMemo(() => {
    if (!defaultCategoryId) return ""
    const current = categories.find(c => c.id === defaultCategoryId)
    if (!current) return ""
    return current.parentId ? current.parentId : current.id
  }, [categories, defaultCategoryId])

  const initialSubCat = useMemo(() => {
    if (!defaultCategoryId) return ""
    const current = categories.find(c => c.id === defaultCategoryId)
    if (!current) return ""
    return current.parentId ? current.id : ""
  }, [categories, defaultCategoryId])

  const [mainCatId, setMainCatId] = useState(initialMainCat)
  const [subCatId, setSubCatId] = useState(initialSubCat)

  const subCategories = useMemo(() => {
    if (!mainCatId) return []
    return categories.filter(c => c.parentId === mainCatId)
  }, [categories, mainCatId])

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="mainCategorySelect">Danh mục chính</Label>
        <Select
          id="mainCategorySelect"
          name="mainCategoryId"
          required
          value={mainCatId}
          onChange={(e) => {
            setMainCatId(e.target.value)
            setSubCatId("")
          }}
        >
          <option value="" disabled>Chọn danh mục chính</option>
          {mainCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="subCategorySelect">Chuyên mục con (không bắt buộc)</Label>
        <Select
          id="subCategorySelect"
          name="subcategoryId"
          value={subCatId}
          onChange={(e) => setSubCatId(e.target.value)}
          disabled={!mainCatId || subCategories.length === 0}
        >
          <option value="">-- Trống --</option>
          {subCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
    </>
  )
}
