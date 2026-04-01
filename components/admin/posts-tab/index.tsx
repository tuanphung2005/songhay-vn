import Link from "next/link"
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"

import { PostsFilterBar } from "./post-filter-bar"
import { PostsTable } from "./posts-table"
import { buildPostsQuery } from "./types"
import type { PostActions, PostPermissions, PostsData, PostsFilters } from "./types"

type PostsTabProps = {
  postsData: PostsData
  filters: PostsFilters
  postsPaginationItems: Array<number | "ellipsis">
} & PostPermissions &
  PostActions

export function PostsTab({
  isAdmin,
  canSubmitPendingReview,
  canSubmitPendingPublish,
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
  const hasActiveFilters = Boolean(
    filters.query ||
      filters.authorId ||
      filters.status !== "all" ||
      filters.approval !== "all" ||
      filters.fromDate ||
      filters.toDate
  )

  const permissions: PostPermissions = {
    isAdmin,
    canSubmitPendingReview,
    canSubmitPendingPublish,
    canReviewPending,
    canPublishNow,
    canEditDraft,
    canEditPendingReview,
    canEditPendingPublish,
    canEditPublished,
  }

  const actions: PostActions = {
    movePostToTrash,
    submitPostToPendingReview,
    promotePostToPendingPublish,
    approvePendingPost,
    rejectPendingPost,
    returnPostToDraft,
    returnPostToPendingReview,
    returnPostToPendingPublish,
  }

  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-4 text-zinc-500" />
              Kho bài viết
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {postsData.totalCount.toLocaleString("vi-VN")} bài · Trang{" "}
              {postsData.currentPage}/{postsData.totalPages}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filter bar */}
        <PostsFilterBar
          filters={filters}
          filterOptions={postsData.filterOptions}
          isAdmin={isAdmin}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Table */}
        <PostsTable posts={postsData.posts} {...permissions} {...actions} />

        {/* Pagination */}
        {postsData.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3">
            <p className="text-xs text-zinc-500">
              Trang {postsData.currentPage}/{postsData.totalPages} ·{" "}
              {postsData.totalCount.toLocaleString("vi-VN")} bài
            </p>

            <div className="flex items-center gap-1">
              {postsData.currentPage > 1 ? (
                <Link href={buildPostsQuery(filters, postsData.currentPage - 1)}>
                  <Button size="icon" variant="outline" className="size-7">
                    <ChevronLeft className="size-3.5" />
                  </Button>
                </Link>
              ) : (
                <Button size="icon" variant="outline" className="size-7" disabled>
                  <ChevronLeft className="size-3.5" />
                </Button>
              )}

              <Pagination className="justify-start">
                <PaginationContent className="gap-0.5">
                  {postsPaginationItems.map((item, idx) => (
                    <PaginationItem key={`pg-${idx}-${String(item)}`}>
                      {item === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href={buildPostsQuery(filters, item)}
                          isActive={item === postsData.currentPage}
                          className="size-7 text-xs"
                        >
                          {item}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                </PaginationContent>
              </Pagination>

              {postsData.currentPage < postsData.totalPages ? (
                <Link href={buildPostsQuery(filters, postsData.currentPage + 1)}>
                  <Button size="icon" variant="outline" className="size-7">
                    <ChevronRight className="size-3.5" />
                  </Button>
                </Link>
              ) : (
                <Button size="icon" variant="outline" className="size-7" disabled>
                  <ChevronRight className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
