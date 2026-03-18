import Link from "next/link"
import Image from "next/image"

import { ConfirmActionForm } from "@/components/admin/confirm-action-form"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select } from "@/components/ui/select"

type PostRow = {
  id: string
  title: string
  slug: string
  views: number
  thumbnailUrl: string | null
  publishedAt: Date
  isFeatured: boolean
  isTrending: boolean
  isPublished: boolean
  isDraft: boolean
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

type PostsTabProps = {
  isAdmin: boolean
  postsData: {
    posts: PostRow[]
    totalCount: number
    totalPages: number
    currentPage: number
    filterOptions: Array<{ id: string; name: string; email: string }>
  }
  filters: {
    query: string
    authorId: string
    approval: "all" | "approved" | "unapproved"
    fromDate: string
    toDate: string
  }
  postsPaginationItems: Array<number | "ellipsis">
  movePostToTrash: (formData: FormData) => Promise<void>
}

export function PostsTab({
  isAdmin,
  postsData,
  filters,
  postsPaginationItems,
  movePostToTrash,
}: PostsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kho bài viết</CardTitle>
        <CardDescription>
          Kho bài đã xuất bản toàn hệ thống. Tổng kết quả: {postsData.totalCount.toLocaleString("vi-VN")}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form method="get" className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input type="hidden" name="tab" value="posts" />
          <input type="hidden" name="postsPage" value="1" />
          <Input
            name="postsQ"
            defaultValue={filters.query}
            placeholder="Tìm theo tiêu đề, slug, mô tả hoặc danh mục..."
            className="sm:max-w-md"
          />
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            <Select name="postsApproval" defaultValue={filters.approval} className="w-full md:w-42.5">
              <option value="all">Tất cả trạng thái duyệt</option>
              <option value="approved">Đã có người duyệt</option>
              <option value="unapproved">Chưa có người duyệt</option>
            </Select>

            <Select name="postsAuthor" defaultValue={filters.authorId || "all"} className="w-full md:w-55">
              <option value="all">Tất cả người viết</option>
              {postsData.filterOptions.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name} ({author.email})
                </option>
              ))}
            </Select>

            <Input name="postsFrom" type="date" defaultValue={filters.fromDate} className="md:w-40" />
            <Input name="postsTo" type="date" defaultValue={filters.toDate} className="md:w-40" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="outline">Tìm kiếm</Button>
            <Link href="/admin?tab=posts">
              <Button type="button" variant="ghost">Xóa lọc</Button>
            </Link>
          </div>
        </form>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Người viết</TableHead>
              <TableHead>Người duyệt</TableHead>
              <TableHead>Ngày đăng</TableHead>
              <TableHead className="text-right">Lượt xem</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {postsData.posts.map((post) => (
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
                  <p className="text-sm font-medium">{post.author?.name || "Không rõ"}</p>
                  <p className="text-muted-foreground text-xs">{post.author?.email || "-"}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-medium">{post.approver?.name || "Không rõ"}</p>
                  <p className="text-muted-foreground text-xs">{post.approver?.email || "-"}</p>
                </TableCell>
                <TableCell className="text-sm">{new Date(post.publishedAt).toLocaleString("vi-VN")}</TableCell>
                <TableCell className="text-right font-medium">{post.views.toLocaleString("vi-VN")}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {isAdmin ? (
                      <>
                        <Link href={`/admin/edit/${post.id}`}>
                          <Button type="button" size="sm" variant="secondary">Sửa bài</Button>
                        </Link>
                        <ConfirmActionForm
                          action={movePostToTrash}
                          fields={[{ name: "postId", value: post.id }]}
                          confirmMessage="Chuyển bài viết này vào thùng rác?"
                        >
                          <Button type="submit" size="sm" variant="destructive">Chuyển vào thùng rác</Button>
                        </ConfirmActionForm>
                      </>
                    ) : (
                      <p className="text-muted-foreground text-xs">Bạn chỉ có quyền chỉnh sửa bài của mình tại tab Lưu trữ cá nhân.</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {postsData.posts.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-sm">Không tìm thấy bài viết phù hợp.</p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="text-muted-foreground text-sm">
            Trang {postsData.currentPage}/{postsData.totalPages}
          </p>
          <div className="flex items-center gap-2">
            {postsData.currentPage > 1 ? (
              <Link
                href={`/admin?tab=posts${filters.query ? `&postsQ=${encodeURIComponent(filters.query)}` : ""}${filters.authorId ? `&postsAuthor=${encodeURIComponent(filters.authorId)}` : ""}${filters.approval !== "all" ? `&postsApproval=${filters.approval}` : ""}${filters.fromDate ? `&postsFrom=${encodeURIComponent(filters.fromDate)}` : ""}${filters.toDate ? `&postsTo=${encodeURIComponent(filters.toDate)}` : ""}&postsPage=${postsData.currentPage - 1}`}
              >
                <Button type="button" size="sm" variant="outline">Trang trước</Button>
              </Link>
            ) : (
              <Button type="button" size="sm" variant="outline" disabled>Trang trước</Button>
            )}

            {postsData.currentPage < postsData.totalPages ? (
              <Link
                href={`/admin?tab=posts${filters.query ? `&postsQ=${encodeURIComponent(filters.query)}` : ""}${filters.authorId ? `&postsAuthor=${encodeURIComponent(filters.authorId)}` : ""}${filters.approval !== "all" ? `&postsApproval=${filters.approval}` : ""}${filters.fromDate ? `&postsFrom=${encodeURIComponent(filters.fromDate)}` : ""}${filters.toDate ? `&postsTo=${encodeURIComponent(filters.toDate)}` : ""}&postsPage=${postsData.currentPage + 1}`}
              >
                <Button type="button" size="sm">Trang sau</Button>
              </Link>
            ) : (
              <Button type="button" size="sm" disabled>Trang sau</Button>
            )}
          </div>
        </div>

        {postsData.totalPages > 1 ? (
          <Pagination className="mt-3 justify-start">
            <PaginationContent>
              {postsPaginationItems.map((item, index) => (
                <PaginationItem key={`page-${index}-${String(item)}`}>
                  {item === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href={`/admin?tab=posts${filters.query ? `&postsQ=${encodeURIComponent(filters.query)}` : ""}${filters.authorId ? `&postsAuthor=${encodeURIComponent(filters.authorId)}` : ""}${filters.approval !== "all" ? `&postsApproval=${filters.approval}` : ""}${filters.fromDate ? `&postsFrom=${encodeURIComponent(filters.fromDate)}` : ""}${filters.toDate ? `&postsTo=${encodeURIComponent(filters.toDate)}` : ""}&postsPage=${item}`}
                      isActive={item === postsData.currentPage}
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
