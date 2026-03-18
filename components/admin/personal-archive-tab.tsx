import Link from "next/link"
import Image from "next/image"

import { ConfirmActionForm } from "@/components/admin/confirm-action-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  editorialStatus: "PENDING_REVIEW" | "PUBLISHED" | "REJECTED"
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
  data: {
    rows: PersonalPostRow[]
    totalCount: number
    totalPages: number
    currentPage: number
    paginationItems: Array<number | "ellipsis">
  }
  filters: {
    query: string
    status: "all" | "draft" | "pending" | "published" | "rejected"
    fromDate: string
    toDate: string
  }
  movePostToTrash: (formData: FormData) => Promise<void>
}

function statusLabel(status: PersonalPostRow["editorialStatus"]) {
  if (status === "PUBLISHED") return "Đã xuất bản"
  if (status === "REJECTED") return "Bị từ chối"
  return "Chờ duyệt"
}

export function PersonalArchiveTab({ data, filters, movePostToTrash }: PersonalArchiveTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lưu trữ cá nhân</CardTitle>
        <CardDescription>
          Kho bài viết thuộc tài khoản đang đăng nhập. Tổng kết quả: {data.totalCount.toLocaleString("vi-VN")}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <form method="get" className="grid gap-2 md:grid-cols-[minmax(0,1fr)_170px_160px_160px_auto_auto] md:items-center">
          <input type="hidden" name="tab" value="personal-archive" />
          <input type="hidden" name="personalPage" value="1" />

          <Input
            name="personalQ"
            defaultValue={filters.query}
            placeholder="Tìm bài theo tiêu đề, slug, mô tả hoặc danh mục..."
          />

          <Select name="personalStatus" defaultValue={filters.status}>
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Bản nháp</option>
            <option value="pending">Chờ duyệt</option>
            <option value="published">Đã xuất bản</option>
            <option value="rejected">Bị từ chối</option>
          </Select>

          <Input name="personalFrom" type="date" defaultValue={filters.fromDate} />
          <Input name="personalTo" type="date" defaultValue={filters.toDate} />

          <Button type="submit" variant="outline">Lọc</Button>
          <Link href="/admin?tab=personal-archive">
            <Button type="button" variant="ghost">Xóa lọc</Button>
          </Link>
        </form>

        {data.rows.length === 0 ? <p className="text-muted-foreground text-sm">Bạn chưa có bài viết nào.</p> : null}

        {data.rows.map((post) => (
          <div key={post.id} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {post.thumbnailUrl ? (
                  <Image src={post.thumbnailUrl} alt={post.title} width={80} height={56} className="h-14 w-20 rounded border object-cover" />
                ) : (
                  <div className="bg-muted text-muted-foreground flex h-14 w-20 items-center justify-center rounded border text-[11px]">No img</div>
                )}
                <div>
                  <p className="font-semibold">{post.title}</p>
                  <p className="text-muted-foreground text-xs">/{post.category.slug}/{post.slug}</p>
                  <p className="text-muted-foreground text-xs">Người viết: {post.author?.name || "Không rõ"}</p>
                  <p className="text-muted-foreground text-xs">Người duyệt: {post.approver?.name || "Chưa duyệt"}</p>
                  <p className="text-muted-foreground text-xs">Ngày đăng: {new Date(post.publishedAt).toLocaleString("vi-VN")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={post.editorialStatus === "PUBLISHED" ? "default" : "outline"}>{statusLabel(post.editorialStatus)}</Badge>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link href={`/admin/edit/${post.id}`}>
                <Button type="button" size="sm" variant="secondary">Sửa bài</Button>
              </Link>
              {post.isPublished ? (
                <a href={`/${post.category.slug}/${post.slug}`} target="_blank" rel="noopener noreferrer">
                  <Button type="button" size="sm" variant="outline">Xem bài viết</Button>
                </a>
              ) : (
                <a href={`/admin/preview/${post.id}`} target="_blank" rel="noopener noreferrer">
                  <Button type="button" size="sm" variant="outline">Xem trước</Button>
                </a>
              )}
              <ConfirmActionForm
                action={movePostToTrash}
                fields={[{ name: "postId", value: post.id }, { name: "sourceTab", value: "personal-archive" }]}
                confirmMessage="Chuyển bài viết này vào thùng rác?"
              >
                <Button type="submit" size="sm" variant="destructive">Chuyển vào thùng rác</Button>
              </ConfirmActionForm>
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
      </CardContent>
    </Card>
  )
}
