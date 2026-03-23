import Link from "next/link"
import Image from "next/image"

import { ConfirmActionForm } from "@/components/admin/confirm-action-form"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select } from "@/components/ui/select"
import type { EditorialStatus } from "@/generated/prisma/client"

type PostRow = {
  id: string
  title: string
  slug: string
  views: number
  thumbnailUrl: string | null
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
  approvedAt: Date | null
  isFeatured: boolean
  isTrending: boolean
  isPublished: boolean
  isDraft: boolean
  editorialStatus: EditorialStatus
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
  canSubmitPendingReview: boolean
  canReviewPending: boolean
  canPublishNow: boolean
  canEditDraft: boolean
  canEditPendingReview: boolean
  canEditPendingPublish: boolean
  canEditPublished: boolean
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
    status: "all" | "draft" | "pending-review" | "pending-publish" | "published" | "rejected"
    approval: "all" | "approved" | "unapproved"
    fromDate: string
    toDate: string
  }
  postsPaginationItems: Array<number | "ellipsis">
  movePostToTrash: (formData: FormData) => Promise<void>
  submitPostToPendingReview: (formData: FormData) => Promise<void>
  promotePostToPendingPublish: (formData: FormData) => Promise<void>
  approvePendingPost: (formData: FormData) => Promise<void>
  rejectPendingPost: (formData: FormData) => Promise<void>
  returnPostToDraft: (formData: FormData) => Promise<void>
  returnPostToPendingReview: (formData: FormData) => Promise<void>
  returnPostToPendingPublish: (formData: FormData) => Promise<void>
}

const STATUS_LABELS: Record<EditorialStatus, string> = {
  DRAFT: "Nháp",
  PENDING_REVIEW: "Chờ duyệt",
  PENDING_PUBLISH: "Chờ xuất bản",
  PUBLISHED: "Đã xuất bản",
  REJECTED: "Bị từ chối",
}

const STATUS_BADGE_CLASSNAMES: Record<EditorialStatus, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700",
  PENDING_REVIEW: "bg-amber-100 text-amber-700",
  PENDING_PUBLISH: "bg-sky-100 text-sky-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
}

function buildPostsQuery(filters: PostsTabProps["filters"], page: number) {
  return `/admin?tab=posts${filters.query ? `&postsQ=${encodeURIComponent(filters.query)}` : ""}${filters.authorId ? `&postsAuthor=${encodeURIComponent(filters.authorId)}` : ""}${filters.status !== "all" ? `&postsStatus=${filters.status}` : ""}${filters.approval !== "all" ? `&postsApproval=${filters.approval}` : ""}${filters.fromDate ? `&postsFrom=${encodeURIComponent(filters.fromDate)}` : ""}${filters.toDate ? `&postsTo=${encodeURIComponent(filters.toDate)}` : ""}&postsPage=${page}`
}

function getTimelineLabel(post: PostRow) {
  if (post.editorialStatus === "PUBLISHED" && post.publishedAt) {
    return `Đăng: ${new Date(post.publishedAt).toLocaleString("vi-VN")}`
  }

  if (post.editorialStatus === "PENDING_PUBLISH" && post.approvedAt) {
    return `Duyệt: ${new Date(post.approvedAt).toLocaleString("vi-VN")}`
  }

  return `Cập nhật: ${new Date(post.updatedAt).toLocaleString("vi-VN")}`
}

function canEditRow(post: PostRow, props: Pick<PostsTabProps, "canEditDraft" | "canEditPendingReview" | "canEditPendingPublish" | "canEditPublished">) {
  if (post.editorialStatus === "DRAFT") {
    return props.canEditDraft
  }

  if (post.editorialStatus === "PENDING_REVIEW") {
    return props.canEditPendingReview
  }

  if (post.editorialStatus === "PENDING_PUBLISH") {
    return props.canEditPendingPublish
  }

  return props.canEditPublished
}

export function PostsTab({
  isAdmin,
  canSubmitPendingReview,
  canReviewPending,
  canPublishNow,
  canEditDraft,
  canEditPendingReview,
  canEditPendingPublish,
  canEditPublished,
  postsData,
  filters,
  postsPaginationItems,
  movePostToTrash,
  submitPostToPendingReview,
  promotePostToPendingPublish,
  approvePendingPost,
  rejectPendingPost,
  returnPostToDraft,
  returnPostToPendingReview,
  returnPostToPendingPublish,
}: PostsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kho bài viết</CardTitle>
        <CardDescription>
          Kho bài tổng hợp toàn bộ trạng thái biên tập. Tổng kết quả: {postsData.totalCount.toLocaleString("vi-VN")}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form method="get" className="mb-4 grid gap-2 lg:grid-cols-[minmax(360px,1fr)_minmax(0,2fr)_auto] lg:items-start">
          <input type="hidden" name="tab" value="posts" />
          <input type="hidden" name="postsPage" value="1" />
          <Input
            name="postsQ"
            defaultValue={filters.query}
            placeholder="Tìm theo tiêu đề, slug, mô tả, danh mục, tác giả..."
            className="w-full"
          />
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <Select name="postsStatus" defaultValue={filters.status} className="w-full">
              <option value="all">Tất cả trạng thái</option>
              <option value="draft">Nháp</option>
              <option value="pending-review">Chờ duyệt</option>
              <option value="pending-publish">Chờ xuất bản</option>
              <option value="published">Đã xuất bản</option>
              <option value="rejected">Bị từ chối</option>
            </Select>

            <Select name="postsApproval" defaultValue={filters.approval} className="w-full">
              <option value="all">Tất cả trạng thái duyệt</option>
              <option value="approved">Đã có người duyệt</option>
              <option value="unapproved">Chưa có người duyệt</option>
            </Select>

            {isAdmin ? (
              <Select name="postsAuthor" defaultValue={filters.authorId || "all"} className="w-full">
                <option value="all">Tất cả người viết</option>
                {postsData.filterOptions.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name} ({author.email})
                  </option>
                ))}
              </Select>
            ) : (
              <input type="hidden" name="postsAuthor" value="all" />
            )}

            <Input name="postsFrom" type="date" defaultValue={filters.fromDate} className="w-full" />
            <Input name="postsTo" type="date" defaultValue={filters.toDate} className="w-full" />
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button type="submit" variant="outline">Tìm kiếm</Button>
            <Link href="/admin?tab=posts">
              <Button type="button" variant="ghost">Xóa lọc</Button>
            </Link>
          </div>
        </form>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bài viết</TableHead>
              <TableHead>Tác giả • nguồn</TableHead>
              <TableHead>Người duyệt</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead className="text-right">Lượt xem</TableHead>
              <TableHead>Điều khiển</TableHead>
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
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{post.title}</p>
                        <Badge className={STATUS_BADGE_CLASSNAMES[post.editorialStatus]}>{STATUS_LABELS[post.editorialStatus]}</Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">/{post.category.slug}/{post.slug}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {post.isFeatured ? <Badge variant="outline">Nổi bật</Badge> : null}
                        {post.isTrending ? <Badge variant="outline">Xu hướng</Badge> : null}
                        {post.isPublished ? <Badge variant="outline">Public</Badge> : null}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-medium">{post.author?.name || "Không rõ"}</p>
                  <p className="text-muted-foreground text-xs">{post.author?.email || "-"}</p>
                  <p className="text-muted-foreground mt-1 text-xs">Nguồn: {post.category.name}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-medium">{post.approver?.name || "Không rõ"}</p>
                  <p className="text-muted-foreground text-xs">{post.approver?.email || "-"}</p>
                </TableCell>
                <TableCell className="text-sm">{getTimelineLabel(post)}</TableCell>
                <TableCell className="text-right font-medium">{post.views.toLocaleString("vi-VN")}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {canSubmitPendingReview && (post.editorialStatus === "DRAFT" || post.editorialStatus === "REJECTED") ? (
                      <ConfirmActionForm
                        action={submitPostToPendingReview}
                        fields={[{ name: "postId", value: post.id }]}
                        confirmMessage="Chuyển bài này lên chờ duyệt?"
                      >
                        <PendingSubmitButton type="submit" size="sm" variant="outline" pendingText="Đang chuyển...">Lên chờ duyệt</PendingSubmitButton>
                      </ConfirmActionForm>
                    ) : null}

                    {canReviewPending && post.editorialStatus === "PENDING_REVIEW" ? (
                      <ConfirmActionForm
                        action={promotePostToPendingPublish}
                        fields={[{ name: "postId", value: post.id }]}
                        confirmMessage="Chuyển bài này lên chờ xuất bản?"
                      >
                        <PendingSubmitButton type="submit" size="sm" pendingText="Đang chuyển...">Lên chờ xuất bản</PendingSubmitButton>
                      </ConfirmActionForm>
                    ) : null}

                    {canPublishNow && post.editorialStatus === "PENDING_REVIEW" ? (
                      <ConfirmActionForm
                        action={approvePendingPost}
                        fields={[{ name: "postId", value: post.id }]}
                        confirmMessage="Xuất bản ngay bài viết này?"
                      >
                        <PendingSubmitButton type="submit" size="sm" pendingText="Đang xuất bản...">Xuất bản ngay</PendingSubmitButton>
                      </ConfirmActionForm>
                    ) : null}

                    {canPublishNow && post.editorialStatus === "PENDING_PUBLISH" ? (
                      <ConfirmActionForm
                        action={approvePendingPost}
                        fields={[{ name: "postId", value: post.id }]}
                        confirmMessage="Xuất bản bài viết này?"
                      >
                        <PendingSubmitButton type="submit" size="sm" pendingText="Đang xuất bản...">Xuất bản</PendingSubmitButton>
                      </ConfirmActionForm>
                    ) : null}

                    {canReviewPending && (post.editorialStatus === "PENDING_REVIEW" || post.editorialStatus === "PENDING_PUBLISH") ? (
                      <ConfirmActionForm
                        action={rejectPendingPost}
                        fields={[{ name: "postId", value: post.id }]}
                        confirmMessage="Từ chối bài viết này?"
                      >
                        <PendingSubmitButton type="submit" size="sm" variant="destructive" pendingText="Đang từ chối...">Từ chối</PendingSubmitButton>
                      </ConfirmActionForm>
                    ) : null}

                    {canReviewPending && post.editorialStatus === "PENDING_PUBLISH" ? (
                      <ConfirmActionForm
                        action={returnPostToPendingReview}
                        fields={[{ name: "postId", value: post.id }]}
                        confirmMessage="Chuyển bài này lên chờ duyệt?"
                      >
                        <PendingSubmitButton type="submit" size="sm" variant="outline" pendingText="Đang chuyển...">Lên chờ duyệt</PendingSubmitButton>
                      </ConfirmActionForm>
                    ) : null}

                    {(canReviewPending || canPublishNow) && post.editorialStatus !== "DRAFT" ? (
                      <ConfirmActionForm
                        action={returnPostToDraft}
                        fields={[{ name: "postId", value: post.id }]}
                        confirmMessage="Trả bài này về kho?"
                      >
                        <PendingSubmitButton type="submit" size="sm" variant="outline" pendingText="Đang trả về...">Trả về kho</PendingSubmitButton>
                      </ConfirmActionForm>
                    ) : null}

                    {canPublishNow && post.editorialStatus === "PUBLISHED" ? (
                      <ConfirmActionForm
                        action={returnPostToPendingPublish}
                        fields={[{ name: "postId", value: post.id }]}
                        confirmMessage="Trả bài này về kho chờ xuất bản?"
                      >
                        <PendingSubmitButton type="submit" size="sm" variant="outline" pendingText="Đang trả về...">Trả về chờ xuất bản</PendingSubmitButton>
                      </ConfirmActionForm>
                    ) : null}

                    {canEditRow(post, { canEditDraft, canEditPendingReview, canEditPendingPublish, canEditPublished }) ? (
                      <Link href={`/admin/edit/${post.id}`}>
                        <Button type="button" size="sm" variant="secondary">Sửa bài</Button>
                      </Link>
                    ) : (
                      <Link href={`/admin/preview/${post.id}`} target="_blank" rel="noreferrer">
                        <Button type="button" size="sm" variant="outline">Xem trước</Button>
                      </Link>
                    )}

                    <a href={`/${post.category.slug}/${post.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button type="button" size="sm" variant="outline">Xem bài viết</Button>
                    </a>

                    <ConfirmActionForm
                      action={movePostToTrash}
                      fields={[{ name: "postId", value: post.id }, { name: "sourceTab", value: "posts" }]}
                      confirmMessage="Xóa bài viết này vào thùng rác?"
                    >
                      <PendingSubmitButton type="submit" size="sm" variant="destructive" pendingText="Đang xóa...">Xóa</PendingSubmitButton>
                    </ConfirmActionForm>
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
              <Link href={buildPostsQuery(filters, postsData.currentPage - 1)}>
                <Button type="button" size="sm" variant="outline">Trang trước</Button>
              </Link>
            ) : (
              <Button type="button" size="sm" variant="outline" disabled>Trang trước</Button>
            )}

            {postsData.currentPage < postsData.totalPages ? (
              <Link href={buildPostsQuery(filters, postsData.currentPage + 1)}>
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
                      href={buildPostsQuery(filters, item)}
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
