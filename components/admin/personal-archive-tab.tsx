"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { CalendarDays, ChevronLeft, ChevronRight, Eye, Filter, Funnel, Pencil, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

import { PostsTable } from "@/components/admin/posts-tab/posts-table"
import type { PostPermissions, PostActions, PostRow } from "@/components/admin/posts-tab/types"

type PersonalArchiveTabProps = {
  data: {
    rows: PostRow[]
    totalCount: number
    totalPages: number
    currentPage: number
    paginationItems: Array<number | "ellipsis">
  }
  filters: {
    query: string
    status:
    | "all"
    | "draft"
    | "pending"
    | "pending-publish"
    | "published"
    | "rejected"
    fromDate: string
    toDate: string
  }
} & PostPermissions & PostActions

export function PersonalArchiveTab({
  data,
  filters,
  ...actionsAndPermissions
}: PersonalArchiveTabProps) {
  const router = useRouter()
  const hasActiveFilters = Boolean(filters.query || filters.fromDate || filters.toDate)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const params = new URLSearchParams()
    formData.forEach((value, key) => {
      if (typeof value === "string" && value) params.append(key, value)
    })
    router.replace(`/admin?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-4">
      <form
        method="get"
        onSubmit={onSubmit}
        className="sticky top-4 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 shadow-sm"
      >
        <input type="hidden" name="tab" value="personal-archive" />
        <input type="hidden" name="personalPage" value="1" />

        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            name="personalQ"
            defaultValue={filters.query}
            placeholder="Tìm theo tiêu đề, slug, mô tả hoặc danh mục..."
            className="h-8 pl-8 text-sm"
          />
        </div>

        <div className="relative">
          <Funnel className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Select name="personalStatus" defaultValue={filters.status} className="h-8 w-auto min-w-44 pl-8 text-sm">
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Bản nháp</option>
            <option value="pending">Chờ duyệt</option>
            <option value="pending-publish">Chờ xuất bản</option>
            <option value="published">Đã xuất bản</option>
            <option value="rejected">Bị từ chối</option>
          </Select>
        </div>

        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            name="personalFrom"
            type="date"
            defaultValue={filters.fromDate}
            className="h-8 w-auto pl-8 text-sm"
            title="Từ ngày"
          />
        </div>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            name="personalTo"
            type="date"
            defaultValue={filters.toDate}
            className="h-8 w-auto pl-8 text-sm"
            title="Đến ngày"
          />
        </div>

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
            onClick={() => router.replace(`/admin?tab=personal-archive&personalStatus=${filters.status}`, { scroll: false })}
          >
            <X className="size-3" />
            Xóa lọc
          </Button>
        )}
      </form>

      <PostsTable posts={data.rows} {...actionsAndPermissions} />

      {data.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3">
          <p className="text-xs text-zinc-500">
            Trang {data.currentPage}/{data.totalPages} ·{" "}
            {data.totalCount.toLocaleString("vi-VN")} bài
          </p>

          <div className="flex items-center gap-1">
            {data.currentPage > 1 ? (
              <Link href={`/admin?tab=personal-archive${filters.query ? `&personalQ=${encodeURIComponent(filters.query)}` : ""}${filters.status !== "all" ? `&personalStatus=${filters.status}` : ""}${filters.fromDate ? `&personalFrom=${encodeURIComponent(filters.fromDate)}` : ""}${filters.toDate ? `&personalTo=${encodeURIComponent(filters.toDate)}` : ""}&personalPage=${data.currentPage - 1}`}>
                <Button size="icon" variant="outline" className="size-7">
                  <ChevronLeft className="size-3.5" />
                </Button>
              </Link>
            ) : (
              <Button size="icon" variant="outline" className="size-7" disabled>
                <ChevronLeft className="size-3.5" />
              </Button>
            )}

            <Pagination className="justify-start">
              <PaginationContent className="gap-0.5">
                {data.paginationItems.map((item, index) => (
                  <PaginationItem key={`personal-page-${index}-${String(item)}`}>
                    {item === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href={`/admin?tab=personal-archive${filters.query ? `&personalQ=${encodeURIComponent(filters.query)}` : ""}${filters.status !== "all" ? `&personalStatus=${filters.status}` : ""}${filters.fromDate ? `&personalFrom=${encodeURIComponent(filters.fromDate)}` : ""}${filters.toDate ? `&personalTo=${encodeURIComponent(filters.toDate)}` : ""}&personalPage=${item}`}
                        isActive={item === data.currentPage}
                        className="size-7 text-xs"
                      >
                        {item}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
              </PaginationContent>
            </Pagination>

            {data.currentPage < data.totalPages ? (
              <Link href={`/admin?tab=personal-archive${filters.query ? `&personalQ=${encodeURIComponent(filters.query)}` : ""}${filters.status !== "all" ? `&personalStatus=${filters.status}` : ""}${filters.fromDate ? `&personalFrom=${encodeURIComponent(filters.fromDate)}` : ""}${filters.toDate ? `&personalTo=${encodeURIComponent(filters.toDate)}` : ""}&personalPage=${data.currentPage + 1}`}>
                <Button size="icon" variant="outline" className="size-7">
                  <ChevronRight className="size-3.5" />
                </Button>
              </Link>
            ) : (
              <Button size="icon" variant="outline" className="size-7" disabled>
                <ChevronRight className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
