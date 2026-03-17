import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type PersonalPostRow = {
  id: string
  title: string
  slug: string
  editorialStatus: "PENDING_REVIEW" | "PUBLISHED" | "REJECTED"
  isPublished: boolean
  updatedAt: Date
  category: {
    name: string
    slug: string
  }
}

type PersonalArchiveTabProps = {
  rows: PersonalPostRow[]
}

function statusLabel(status: PersonalPostRow["editorialStatus"]) {
  if (status === "PUBLISHED") return "Đã xuất bản"
  if (status === "REJECTED") return "Bị từ chối"
  return "Chờ duyệt"
}

export function PersonalArchiveTab({ rows }: PersonalArchiveTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lưu trữ cá nhân</CardTitle>
        <CardDescription>Kho bài viết thuộc tài khoản đang đăng nhập.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? <p className="text-muted-foreground text-sm">Bạn chưa có bài viết nào.</p> : null}

        {rows.map((post) => (
          <div key={post.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <p className="font-semibold">{post.title}</p>
              <p className="text-muted-foreground text-xs">/{post.category.slug}/{post.slug}</p>
              <p className="text-muted-foreground text-xs">Cập nhật: {new Date(post.updatedAt).toLocaleString("vi-VN")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={post.editorialStatus === "PUBLISHED" ? "default" : "outline"}>{statusLabel(post.editorialStatus)}</Badge>
              <Link href={`/admin/edit/${post.id}`}>
                <Button type="button" size="sm" variant="secondary">Mở bài</Button>
              </Link>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
