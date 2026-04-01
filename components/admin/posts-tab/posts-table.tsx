import Image from "next/image"
import { BookOpen, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
        <p className="text-sm font-medium text-zinc-500">Không tìm thấy bài viết phù hợp</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50 hover:bg-zinc-50">
            <TableHead className="w-[38%] py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Bài viết
            </TableHead>
            <TableHead className="w-[12%] py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Tác giả
            </TableHead>
            <TableHead className="w-[12%] py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Người sửa
            </TableHead>
            <TableHead className="w-[12%] py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Người duyệt
            </TableHead>
            <TableHead className="w-[12%] py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Thời gian
            </TableHead>
            <TableHead className="w-[6%] py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Views
            </TableHead>
            <TableHead className="py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
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
                {/* ── Post info ── */}
                <TableCell className="py-3">
                  <div className="flex items-start gap-2.5">
                    {/* Thumbnail */}
                    {post.thumbnailUrl ? (
                      <Image
                        src={post.thumbnailUrl}
                        alt={post.title}
                        width={60}
                        height={45}
                        className="mt-0.5 h-[45px] w-[60px] shrink-0 rounded-md border border-zinc-200 object-cover"
                      />
                    ) : (
                      <div className="mt-0.5 flex h-[45px] w-[60px] shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-100 text-[10px] font-medium text-zinc-400">
                        No img
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Title + status badge */}
                      <div className="flex flex-wrap items-start gap-1.5">
                        <p className="text-sm font-semibold leading-snug text-zinc-900">
                          {post.title}
                        </p>
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                            cfg.badgeClass
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                          {cfg.label}
                        </span>
                      </div>

                      {/* Slug + category + flags */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-400">
                        <span className="font-mono">
                          /{post.category.slug}/{post.slug}
                        </span>
                        <span className="rounded bg-zinc-100 px-1.5 py-px text-zinc-500">
                          {post.category.name}
                        </span>
                        {post.isFeatured && (
                          <Badge variant="outline" className="h-4 px-1 py-0 text-[10px] border-amber-300 text-amber-600">
                            Nổi bật
                          </Badge>
                        )}
                        {post.isTrending && (
                          <Badge variant="outline" className="h-4 px-1 py-0 text-[10px] border-rose-300 text-rose-600">
                            Xu hướng
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* ── Author ── */}
                <TableCell className="py-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-zinc-800">
                      {post.author?.name ?? "Không rõ"}
                    </p>
                    <p className="truncate text-[11px] text-zinc-400">
                      {post.author?.email ?? "—"}
                    </p>
                  </div>
                </TableCell>

                {/* ── Last Editor ── */}
                <TableCell className="py-3">
                  {post.lastEditor ? (
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-zinc-800">
                        {post.lastEditor.name}
                      </p>
                      <p className="truncate text-[11px] text-zinc-400">
                        {post.lastEditor.email}
                      </p>
                      <span className="inline-block rounded bg-amber-50 px-1 py-px text-[10px] font-medium text-amber-700">
                        Đã sửa
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] italic text-zinc-300">Chưa có</span>
                  )}
                </TableCell>

                {/* ── Approver / Editor ── */}
                <TableCell className="py-3">
                  {post.approver ? (
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-zinc-800">
                        {post.approver.name}
                      </p>
                      <p className="truncate text-[11px] text-zinc-400">
                        {post.approver.email}
                      </p>
                      <span className="inline-block rounded bg-emerald-50 px-1 py-px text-[10px] font-medium text-emerald-600">
                        Đã duyệt
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] italic text-zinc-300">Chưa có</span>
                  )}
                </TableCell>

                {/* ── Timeline ── */}
                <TableCell className="py-3">
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                    <Clock className="size-3 shrink-0 text-zinc-400" />
                    {getTimelineLabel(post)}
                  </div>
                </TableCell>

                {/* ── Views ── */}
                <TableCell className="py-3 text-right text-xs font-medium tabular-nums text-zinc-700">
                  {post.views.toLocaleString("vi-VN")}
                </TableCell>

                {/* ── Actions ── */}
                <TableCell className="py-3">
                  <PostActionsCell post={post} {...rest} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
