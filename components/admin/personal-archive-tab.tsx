import Link from "next/link"
import Image from "next/image"
import { CalendarDays, Eye, Filter, Funnel, Pencil, Search, Trash2, X } from "lucide-react"

import { ConfirmActionForm } from "@/components/admin/confirm-action-form"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import { Badge } from "@/components/ui/badge"
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

type PersonalPostRow = {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  editorialStatus:
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PENDING_PUBLISH"
  | "PUBLISHED"
  | "REJECTED"
  isPublished: boolean
  isDraft: boolean
  createdAt: Date
  publishedAt: Date
  approvedAt: Date | null
  updatedAt: Date
  author: {
    id: string
    name: string
    email: string
  } | null
  approver: {
    id: string
    name: string
    email: string
  } | null
  category: {
    name: string
    slug: string
  }
}

type PersonalArchiveTabProps = {
  isAdmin: boolean
  canDeletePost: boolean
  currentUserId: string
  data: {
    rows: PersonalPostRow[]
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
  movePostToTrash: (formData: FormData) => Promise<void>
}

function statusLabel(status: PersonalPostRow["editorialStatus"]) {
  if (status === "DRAFT") return "Bản nháp"
  if (status === "PENDING_PUBLISH") return "Chờ xuất bản"
  if (status === "PUBLISHED") return "Đã xuất bản"
  if (status === "REJECTED") return "Bị từ chối"
  return "Chờ duyệt"
}

export function PersonalArchiveTab({
  data,
  filters,
  movePostToTrash,
  canDeletePost,
  currentUserId,
}: PersonalArchiveTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Lưu trữ cá nhân</p>
        <Badge variant="outline" className="font-normal text-muted-foreground">
          {data.totalCount.toLocaleString("vi-VN")} kết quả
        </Badge>
      </div>
      <form
        method="get"
        className="grid gap-2 md:grid-cols-[minmax(0,1fr)_170px_160px_160px_auto_auto] md:items-center"
      >
        <input type="hidden" name="tab" value="personal-archive" />
        <input type="hidden" name="personalPage" value="1" />

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            name="personalQ"
            defaultValue={filters.query}
            placeholder="Tìm bài theo tiêu đề, slug, mô tả hoặc danh mục..."
            className="pl-8"
          />
        </div>

        <div className="relative">
          <Funnel className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Select name="personalStatus" defaultValue={filters.status} className="pl-8">
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Bản nháp</option>
            <option value="pending">Chờ duyệt</option>
            <option value="pending-publish">Chờ xuất bản</option>
            <option value="published">Đã xuất bản</option>
            <option value="rejected">Bị từ chối</option>
          </Select>
        </div>

        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            name="personalFrom"
            type="date"
            defaultValue={filters.fromDate}
            className="pl-8"
          />
        </div>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input name="personalTo" type="date" defaultValue={filters.toDate} className="pl-8" />
        </div>

        <Button type="submit" variant="outline">
          <Filter className="size-4" />
          Lọc
        </Button>
        <Link href="/admin?tab=personal-archive">
          <Button type="button" variant="ghost">
            <X className="size-4" />
            Xóa lọc
          </Button>
        </Link>
      </form>

      {data.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Bạn chưa có bài viết nào.
        </p>
      ) : null}

      {data.rows.map((post) => (
        <div key={post.id} className="rounded-lg border p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {post.thumbnailUrl ? (
                <Image
                  src={post.thumbnailUrl}
                  alt={post.title}
                  width={80}
                  height={56}
                  className="h-14 w-20 rounded border object-cover"
                />
              ) : (
                <div className="flex h-14 w-20 items-center justify-center rounded border bg-muted text-[11px] text-muted-foreground">
                  No img
                </div>
              )}
              <div>
                <p className="font-semibold">{post.title}</p>
                <p className="text-xs text-muted-foreground">
                  /{post.category.slug}/{post.slug}
                </p>
                <p className="text-xs text-muted-foreground">
                  Người viết: {post.author?.name || "Không rõ"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Người duyệt: {post.approver?.name || "Chưa duyệt"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Ngày đăng:{" "}
                  {new Date(post.publishedAt).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  post.editorialStatus === "PUBLISHED" ? "default" : "outline"
                }
              >
                {statusLabel(post.editorialStatus)}
              </Badge>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link href={`/admin/edit/${post.id}`}>
              <Button type="button" size="sm" variant="secondary">
                <Pencil className="size-4" />
                Sửa bài
              </Button>
            </Link>
            {post.isPublished ? (
              <a
                href={`/${post.category.slug}/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button type="button" size="sm" variant="outline">
                  <Eye className="size-4" />
                  Xem bài viết
                </Button>
              </a>
            ) : (
              <a
                href={`/admin/preview/${post.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button type="button" size="sm" variant="outline">
                  <Eye className="size-4" />
                  Xem trước
                </Button>
              </a>
            )}
            {(canDeletePost || (post.author?.id === currentUserId && post.editorialStatus !== "PUBLISHED" && post.editorialStatus !== "PENDING_PUBLISH")) && (
              <ConfirmActionForm
                action={movePostToTrash}
                fields={[
                  { name: "postId", value: post.id },
                  { name: "sourceTab", value: "personal-archive" },
                ]}
                confirmMessage="Chuyển bài viết này vào thùng rác?"
              >
                <PendingSubmitButton
                  type="submit"
                  size="sm"
                  variant="destructive"
                  pendingText="Đang chuyển..."
                >
                  <Trash2 className="size-4" />
                  Chuyển vào thùng rác
                </PendingSubmitButton>
              </ConfirmActionForm>
            )}
          </div>
        </div>
      ))}

      {data.totalPages > 1 ? (
        <Pagination className="justify-start">
          <PaginationContent>
            {data.paginationItems.map((item, index) => (
              <PaginationItem key={`personal-page-${index}-${String(item)}`}>
                {item === "ellipsis" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href={`/admin?tab=personal-archive${filters.query ? `&personalQ=${encodeURIComponent(filters.query)}` : ""}${filters.status !== "all" ? `&personalStatus=${filters.status}` : ""}${filters.fromDate ? `&personalFrom=${encodeURIComponent(filters.fromDate)}` : ""}${filters.toDate ? `&personalTo=${encodeURIComponent(filters.toDate)}` : ""}&personalPage=${item}`}
                    isActive={item === data.currentPage}
                  >
                    {item}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  )
}
