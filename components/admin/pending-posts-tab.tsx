import Image from "next/image"
import Link from "next/link"

import { ConfirmActionForm } from "@/components/admin/confirm-action-form"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type PendingPostRow = {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  createdAt: Date
  updatedAt: Date
  category: {
    name: string
    slug: string
  }
  author: {
    id: string
    name: string
    email: string
  } | null
}

type PendingPostsTabProps = {
  isAdmin: boolean
  canEditRows?: boolean
  approveLabel?: string
  rows: PendingPostRow[]
  approvePendingPost: (formData: FormData) => Promise<void>
  rejectPendingPost: (formData: FormData) => Promise<void>
}

export function PendingPostsTab({
  isAdmin,
  canEditRows = true,
  approveLabel,
  rows,
  approvePendingPost,
  rejectPendingPost,
}: PendingPostsTabProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Người viết</TableHead>
              <TableHead>Ngày tạo/cập nhật</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <div className="flex items-start gap-3">
                    {post.thumbnailUrl ? (
                      <Image
                        src={post.thumbnailUrl}
                        alt={post.title}
                        width={64}
                        height={48}
                        className="mt-0.5 h-12 w-16 border object-cover"
                      />
                    ) : (
                      <div className="mt-0.5 flex h-12 w-16 items-center justify-center border bg-muted text-[11px] text-muted-foreground">
                        No img
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{post.title}</p>
                      <p className="text-xs text-muted-foreground">
                        /{post.category.slug}/{post.slug}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{post.category.name}</TableCell>
                <TableCell>
                  <p className="text-sm font-medium">
                    {post.author?.name || "Ẩn danh"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {post.author?.email || "-"}
                  </p>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <p>Tạo: {new Date(post.createdAt).toLocaleString("vi-VN")}</p>
                  <p>Sửa: {new Date(post.updatedAt).toLocaleString("vi-VN")}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">Chờ duyệt</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {canEditRows ? (
                      <Link href={`/admin/edit/${post.id}`}>
                        <Button type="button" size="sm" variant="secondary">
                          Sửa bài
                        </Button>
                      </Link>
                    ) : null}
                    <a
                      href={`/admin/preview/${post.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button type="button" size="sm" variant="outline">
                        Xem trước
                      </Button>
                    </a>
                    {isAdmin ? (
                      <>
                        <form action={approvePendingPost}>
                          <input type="hidden" name="postId" value={post.id} />
                          <PendingSubmitButton
                            type="submit"
                            size="sm"
                            pendingText="Đang duyệt..."
                          >
                            {approveLabel || "Duyệt & xuất bản"}
                          </PendingSubmitButton>
                        </form>
                        <ConfirmActionForm
                          action={rejectPendingPost}
                          fields={[{ name: "postId", value: post.id }]}
                          confirmMessage="Từ chối bài viết này?"
                        >
                          <PendingSubmitButton
                            type="submit"
                            size="sm"
                            variant="destructive"
                            pendingText="Đang từ chối..."
                          >
                            Từ chối
                          </PendingSubmitButton>
                        </ConfirmActionForm>
                      </>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Không có bài nào đang chờ duyệt.
        </p>
      ) : null}
    </div>
  )
}
