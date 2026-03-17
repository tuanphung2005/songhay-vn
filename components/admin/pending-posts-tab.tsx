import Link from "next/link"

import { ConfirmActionForm } from "@/components/admin/confirm-action-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type PendingPostRow = {
  id: string
  title: string
  slug: string
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
  rows: PendingPostRow[]
  approvePendingPost: (formData: FormData) => Promise<void>
  rejectPendingPost: (formData: FormData) => Promise<void>
}

export function PendingPostsTab({ isAdmin, rows, approvePendingPost, rejectPendingPost }: PendingPostsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kho bài chờ duyệt</CardTitle>
        <CardDescription>
          {isAdmin
            ? "Admin có thể duyệt hoặc từ chối bài trước khi xuất bản."
            : "Danh sách bài của bạn đang chờ admin duyệt."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? <p className="text-muted-foreground text-sm">Không có bài nào đang chờ duyệt.</p> : null}

        {rows.map((post) => (
          <div key={post.id} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{post.title}</p>
                <p className="text-muted-foreground text-xs">/{post.category.slug}/{post.slug}</p>
                <p className="text-muted-foreground text-xs">
                  Tác giả: {post.author?.name || "Ẩn danh"} ({post.author?.email || "-"})
                </p>
                <p className="text-muted-foreground text-xs">
                  Tạo lúc: {new Date(post.createdAt).toLocaleString("vi-VN")} | Cập nhật: {new Date(post.updatedAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <Badge variant="outline">Chờ duyệt</Badge>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/admin/edit/${post.id}`}>
                <Button type="button" size="sm" variant="secondary">Xem/Sửa</Button>
              </Link>
              {isAdmin ? (
                <>
                  <form action={approvePendingPost}>
                    <input type="hidden" name="postId" value={post.id} />
                    <Button type="submit" size="sm">Duyệt & xuất bản</Button>
                  </form>
                  <ConfirmActionForm
                    action={rejectPendingPost}
                    fields={[{ name: "postId", value: post.id }]}
                    confirmMessage="Từ chối bài viết này?"
                  >
                    <Button type="submit" size="sm" variant="destructive">Từ chối</Button>
                  </ConfirmActionForm>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
