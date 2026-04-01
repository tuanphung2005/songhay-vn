"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

import type { PostsData, PostsFilters } from "./types"

type PostsFilterBarProps = {
  filters: PostsFilters
  filterOptions: PostsData["filterOptions"]
  isAdmin: boolean
  hasActiveFilters: boolean
}

export function PostsFilterBar({
  filters,
  filterOptions,
  isAdmin,
  hasActiveFilters,
}: PostsFilterBarProps) {
  const router = useRouter()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const params = new URLSearchParams()
    
    formData.forEach((value, key) => {
      if (typeof value === "string" && value) {
        params.append(key, value)
      }
    })
    
    router.replace(`/admin?${params.toString()}`, { scroll: false })
  }

  return (
    <form
      method="get"
      onSubmit={onSubmit}
      className="sticky top-4 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 shadow-sm"
    >
      <input type="hidden" name="tab" value="posts" />
      <input type="hidden" name="postsPage" value="1" />

      {/* Search input */}
      <div className="relative min-w-[220px] flex-1">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
        <Input
          name="postsQ"
          defaultValue={filters.query}
          placeholder="Tìm tiêu đề, slug, tác giả..."
          className="h-8 pl-8 text-sm"
        />
      </div>

      {/* Filters */}
      <Select name="postsStatus" defaultValue={filters.status} className="h-8 w-auto text-sm">
        <option value="all">Tất cả trạng thái</option>
        <option value="draft">Nháp</option>
        <option value="pending-review">Chờ duyệt</option>
        <option value="pending-publish">Chờ đăng</option>
        <option value="published">Đã đăng</option>
        <option value="rejected">Từ chối</option>
      </Select>

      <Select name="postsApproval" defaultValue={filters.approval} className="h-8 w-auto text-sm">
        <option value="all">Tất cả duyệt</option>
        <option value="approved">Đã duyệt</option>
        <option value="unapproved">Chưa duyệt</option>
      </Select>

      {isAdmin ? (
        <Select
          name="postsAuthor"
          defaultValue={filters.authorId || "all"}
          className="h-8 w-auto text-sm"
        >
          <option value="all">Tất cả tác giả</option>
          {filterOptions.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>
      ) : (
        <input type="hidden" name="postsAuthor" value="all" />
      )}

      <Input
        name="postsFrom"
        type="date"
        defaultValue={filters.fromDate}
        className="h-8 w-auto text-sm"
        title="Từ ngày"
      />
      <Input
        name="postsTo"
        type="date"
        defaultValue={filters.toDate}
        className="h-8 w-auto text-sm"
        title="Đến ngày"
      />

      <Button type="submit" size="sm" className="h-8 gap-1.5 text-xs">
        <Search className="size-3" />
        Lọc
      </Button>

      {hasActiveFilters && (
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          className="h-8 gap-1 text-xs text-zinc-500"
          onClick={() => router.replace("/admin?tab=posts", { scroll: false })}
        >
          <X className="size-3" />
          Xóa lọc
        </Button>
      )}
    </form>
  )
}
