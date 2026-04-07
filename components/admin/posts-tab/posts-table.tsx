import Image from "next/image"
import { BookOpen, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

import { PostActionsCell } from "./post-actions-cell"
import { STATUS_CONFIG, getTimelineLabel } from "./types"
import type { PostActions, PostPermissions, PostRow } from "./types"

type PostsTableProps = {
  posts: PostRow[]
} & PostPermissions &
  PostActions

export function PostsTable({ posts, ...rest }: PostsTableProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <div className="rounded-full bg-zinc-100 p-4">
          <BookOpen className="size-8 text-zinc-300" />
        </div>
        <p className="text-sm font-medium text-zinc-500">
          Không tìm thấy bài viết phù hợp
        </p>
      </div>
    )
  }

  return (
    <div className="max-h-[calc(100vh-14rem)] overflow-x-auto overflow-y-auto rounded-xl border border-zinc-200">
      <table className="w-full caption-bottom text-sm">
        <TableHeader className="sticky top-0 z-20 bg-zinc-50 shadow-sm before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-zinc-200">
          <TableRow className="bg-transparent hover:bg-transparent">
            <TableHead className="w-[10%] py-2.5 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Ảnh
            </TableHead>
            <TableHead className="w-[45%] py-2.5 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Bài viết
            </TableHead>
            <TableHead className="w-[20%] py-2.5 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Nhân sự & Lịch sử
            </TableHead>
            <TableHead className="w-[8%] py-2.5 text-right text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Views
            </TableHead>
            <TableHead className="py-2.5 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Thao tác
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => {
            const cfg = STATUS_CONFIG[post.editorialStatus]
            return (
              <TableRow
                key={post.id}
                className={cn("align-top transition-colors", cfg.rowClass)}
              >
                {/* ── Column 1: Image ── */}
                <TableCell className="py-3">
                  {post.thumbnailUrl ? (
                    <Image
                      src={post.thumbnailUrl}
                      alt={post.title}
                      width={84}
                      height={60}
                      className="mt-0.5 h-[60px] w-[84px] shrink-0 rounded-md border border-zinc-200 object-cover"
                    />
                  ) : (
                    <div className="mt-0.5 flex h-[60px] w-[84px] shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-100 text-[10px] font-medium text-zinc-400">
                      No img
                    </div>
                  )}
                </TableCell>

                {/* ── Column 2: Post info (Badge, Title, Category, Excerpt, Tags) ── */}
                <TableCell className="py-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {/* Title + PenName badge */}
                    <div className="flex flex-wrap items-start gap-1.5">
                      {post.penName && (
                        <span className="inline-flex shrink-0 items-center rounded bg-emerald-600 px-1.5 py-0.5 text-[11px] font-medium text-white">
                          {post.penName}
                        </span>
                      )}
                      <p className="text-sm leading-snug font-semibold text-zinc-900">
                        {post.title}
                      </p>
                    </div>

                    {/* Category & Status */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500">
                      <span className="font-medium text-zinc-700 uppercase">
                        Trong mục:{" "}
                        <span className="text-rose-600">
                          {post.category.name}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                          cfg.badgeClass
                        )}
                      >
                        <span
                          className={cn("size-1.5 rounded-full", cfg.dot)}
                        />
                        {cfg.label}
                      </span>
                      {post.isFeatured && (
                        <Badge
                          variant="outline"
                          className="h-4 border-amber-300 px-1 py-0 text-[10px] text-amber-600"
                        >
                          Nổi bật
                        </Badge>
                      )}
                      {post.isTrending && (
                        <Badge
                          variant="outline"
                          className="h-4 border-rose-300 px-1 py-0 text-[10px] text-rose-600"
                        >
                          Xu hướng
                        </Badge>
                      )}
                    </div>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="line-clamp-2 text-[12px] text-zinc-600">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Tags */}
                    {post.seoKeywords && (
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[11px] font-medium text-zinc-700">
                          Từ khóa:
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {post.seoKeywords
                            .split(",")
                            .map((k) => k.trim())
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* ── Column 3: Personnel & History stack ── */}
                <TableCell className="py-3">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start justify-between">
                      <span className="w-12 text-zinc-500">Tạo:</span>
                      <span className="flex-1 text-right font-medium text-zinc-800">
                        {post.author?.name ?? "Không rõ"}
                      </span>
                    </div>
                    {post.lastEditor && (
                      <div className="mt-1 flex items-start justify-between">
                        <span className="w-12 text-zinc-500">Sửa:</span>
                        <span className="flex-1 text-right font-medium text-zinc-800">
                          {post.lastEditor.name}
                        </span>
                      </div>
                    )}
                    {post.approver && (
                      <div className="mt-1 flex items-start justify-between">
                        <span className="w-12 text-zinc-500">Duyệt:</span>
                        <span className="flex-1 text-right font-medium text-zinc-800">
                          {post.approver.name}
                        </span>
                      </div>
                    )}
                    <div className="my-1.5 h-px bg-zinc-200" />
                    <div className="flex items-center justify-end gap-1 text-[11px] font-medium text-amber-600">
                      <Clock className="size-3 shrink-0" />
                      {getTimelineLabel(post)}
                    </div>
                  </div>
                </TableCell>

                {/* ── Column 4: Views ── */}
                <TableCell className="py-3 text-right text-xs font-medium text-zinc-700 tabular-nums">
                  {post.views.toLocaleString("vi-VN")}
                </TableCell>

                {/* ── Column 5: Actions ── */}
                <TableCell className="py-3">
                  <PostActionsCell post={post} {...rest} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </table>
    </div>
  )
}
