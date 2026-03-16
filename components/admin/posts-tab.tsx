import Link from "next/link"

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
import { Textarea } from "@/components/ui/textarea"

type PostRow = {
  id: string
  title: string
  slug: string
  views: number
  isFeatured: boolean
  isTrending: boolean
  isPublished: boolean
  seoTitle: string | null
  seoDescription: string | null
  category: {
    name: string
    slug: string
  }
}

type PostsTabProps = {
  postsData: {
    posts: PostRow[]
    totalCount: number
    totalPages: number
    currentPage: number
  }
  postsQuery: string
  postsPaginationItems: Array<number | "ellipsis">
  updatePostFlags: (formData: FormData) => Promise<void>
  movePostToTrash: (formData: FormData) => Promise<void>
}

export function PostsTab({
  postsData,
  postsQuery,
  postsPaginationItems,
  updatePostFlags,
  movePostToTrash,
}: PostsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kho bài viết</CardTitle>
        <CardDescription>
          Quản lý trạng thái bài viết và SEO trực tiếp trên bảng. Tổng kết quả: {postsData.totalCount.toLocaleString("vi-VN")}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form method="get" className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input type="hidden" name="tab" value="posts" />
          <Input
            name="q"
            defaultValue={postsQuery}
            placeholder="Tìm theo tiêu đề, slug, mô tả hoặc danh mục..."
            className="sm:max-w-md"
          />
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
              <TableHead className="text-right">Lượt xem</TableHead>
              <TableHead>SEO</TableHead>
              <TableHead>Thiết lập</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {postsData.posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <p className="font-semibold">{post.title}</p>
                  <p className="text-muted-foreground text-xs">/{post.category.slug}/{post.slug}</p>
                </TableCell>
                <TableCell>{post.category.name}</TableCell>
                <TableCell className="text-right font-medium">{post.views.toLocaleString("vi-VN")}</TableCell>
                <TableCell>
                  <p className="max-w-xs truncate text-sm">{post.seoTitle || "Chưa có SEO title"}</p>
                  <p className="text-muted-foreground max-w-xs truncate text-xs">{post.seoDescription || "Chưa có SEO description"}</p>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <form action={updatePostFlags} className="space-y-2">
                      <input type="hidden" name="postId" value={post.id} />
                      <div className="flex flex-wrap gap-3 text-xs">
                        <label className="inline-flex items-center gap-1.5">
                          <input className="size-4 rounded border-input" name="isFeatured" type="checkbox" defaultChecked={post.isFeatured} />
                          Featured
                        </label>
                        <label className="inline-flex items-center gap-1.5">
                          <input className="size-4 rounded border-input" name="isTrending" type="checkbox" defaultChecked={post.isTrending} />
                          Trending
                        </label>
                        <label className="inline-flex items-center gap-1.5">
                          <input className="size-4 rounded border-input" name="isPublished" type="checkbox" defaultChecked={post.isPublished} />
                          Published
                        </label>
                      </div>
                      <Input name="seoTitle" defaultValue={post.seoTitle || ""} placeholder="SEO title" className="h-8" />
                      <Textarea name="seoDescription" defaultValue={post.seoDescription || ""} placeholder="SEO description" className="min-h-16" />
                      <Button type="submit" size="sm" variant="outline">Cập nhật</Button>
                    </form>

                    <div className="flex flex-wrap gap-2">
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
                    </div>
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
                href={`/admin?tab=posts${postsQuery ? `&q=${encodeURIComponent(postsQuery)}` : ""}&page=${postsData.currentPage - 1}`}
              >
                <Button type="button" size="sm" variant="outline">Trang trước</Button>
              </Link>
            ) : (
              <Button type="button" size="sm" variant="outline" disabled>Trang trước</Button>
            )}

            {postsData.currentPage < postsData.totalPages ? (
              <Link
                href={`/admin?tab=posts${postsQuery ? `&q=${encodeURIComponent(postsQuery)}` : ""}&page=${postsData.currentPage + 1}`}
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
                      href={`/admin?tab=posts${postsQuery ? `&q=${encodeURIComponent(postsQuery)}` : ""}&page=${item}`}
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
