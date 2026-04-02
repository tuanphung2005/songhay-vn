import Link from "next/link"
import Image from "next/image"

import { ConfirmActionForm } from "@/components/admin/confirm-action-form"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"
import { Select } from "@/components/ui/select"

type TrashedPost = {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  createdAt: Date
  publishedAt: Date
  approvedAt: Date | null
  deletedAt: Date | null
  author: {
    id: string
    name: string
    email: string
  } | null
  category: {
    slug: string
  }
}

type TrashTabProps = {
  isAdmin: boolean
  data: {
    rows: TrashedPost[]
    totalCount: number
    totalPages: number
    currentPage: number
    paginationItems: Array<number | "ellipsis">
    authorOptions: Array<{ id: string; name: string; email: string }>
  }
  filters: {
    query: string
    authorId: string
    fromDate: string
    toDate: string
  }
  restorePostFromTrash: (formData: FormData) => Promise<void>
  deletePostPermanently: (formData: FormData) => Promise<void>
}

export function TrashTab({ isAdmin, data, filters, restorePostFromTrash, deletePostPermanently }: TrashTabProps) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <p className="text-sm font-semibold">Thùng rác</p>
        <form method="get" className="grid gap-2 md:grid-cols-[minmax(0,1fr)_220px_160px_160px_auto_auto] md:items-center">
          <input type="hidden" name="tab" value="trash" />
          <input type="hidden" name="trashPage" value="1" />

          <Input
            name="trashQ"
            defaultValue={filters.query}
            placeholder="Tìm theo tiêu đề, slug, danh mục hoặc tác giả..."
          />

          {isAdmin ? (
            <Select name="trashAuthor" defaultValue={filters.authorId || "all"}>
              <option value="all">Tất cả người viết</option>
              {data.authorOptions.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name} ({author.email})
                </option>
              ))}
            </Select>
          ) : (
            <input type="hidden" name="trashAuthor" value="" />
          )}

          <Input name="trashFrom" type="date" defaultValue={filters.fromDate} />
          <Input name="trashTo" type="date" defaultValue={filters.toDate} />

          <Button type="submit" variant="outline">Lọc</Button>
          <Link href="/admin?tab=trash">
            <Button type="button" variant="ghost">Xóa lọc</Button>
          </Link>
        </form>

        {data.rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">Thùng rác đang trống.</p>
        ) : (
          data.rows.map((post) => (
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
                    <p className="text-muted-foreground text-xs">
                      Đã xóa lúc: {post.deletedAt ? new Date(post.deletedAt).toLocaleString("vi-VN") : "Không rõ"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={restorePostFromTrash}>
                    <input type="hidden" name="postId" value={post.id} />
                    <PendingSubmitButton type="submit" size="sm" variant="outline" pendingText="Đang khôi phục...">Khôi phục</PendingSubmitButton>
                  </form>
                  <ConfirmActionForm
                    action={deletePostPermanently}
                    fields={[{ name: "postId", value: post.id }]}
                    confirmMessage="Xóa vĩnh viễn bài viết này? Hành động này không thể hoàn tác."
                  >
                    <PendingSubmitButton type="submit" size="sm" variant="destructive" pendingText="Đang xóa...">Xóa vĩnh viễn</PendingSubmitButton>
                  </ConfirmActionForm>
                </div>
              </div>
            </div>
          ))
        )}

        {data.totalPages > 1 ? (
          <Pagination className="justify-start">
            <PaginationContent>
              {data.paginationItems.map((item, index) => (
                <PaginationItem key={`trash-page-${index}-${String(item)}`}>
                  {item === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href={`/admin?tab=trash${filters.query ? `&trashQ=${encodeURIComponent(filters.query)}` : ""}${isAdmin && filters.authorId ? `&trashAuthor=${encodeURIComponent(filters.authorId)}` : ""}${filters.fromDate ? `&trashFrom=${encodeURIComponent(filters.fromDate)}` : ""}${filters.toDate ? `&trashTo=${encodeURIComponent(filters.toDate)}` : ""}&trashPage=${item}`}
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
