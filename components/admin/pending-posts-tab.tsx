import Image from "next/image"
import Link from "next/link"

import { ConfirmActionForm } from "@/components/admin/confirm-action-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
      <CardContent>
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
                        className="mt-0.5 h-12 w-16 rounded border object-cover"
                      />
                    ) : (
                      <div className="bg-muted text-muted-foreground mt-0.5 flex h-12 w-16 items-center justify-center rounded border text-[11px]">
                        No img
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{post.title}</p>
                      <p className="text-muted-foreground text-xs">/{post.category.slug}/{post.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{post.category.name}</TableCell>
                <TableCell>
                  <p className="text-sm font-medium">{post.author?.name || "Ẩn danh"}</p>
                  <p className="text-muted-foreground text-xs">{post.author?.email || "-"}</p>
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
                    <Link href={`/admin/edit/${post.id}`}>
                      <Button type="button" size="sm" variant="secondary">Sửa bài</Button>
                    </Link>
                    <a href={`/admin/preview/${post.id}`} target="_blank" rel="noopener noreferrer">
                      <Button type="button" size="sm" variant="outline">Xem trước</Button>
                    </a>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {rows.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-sm">Không có bài nào đang chờ duyệt.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
