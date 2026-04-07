"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

type HistoryTabProps = {
  historyLogs: Array<{
    id: string
    postId: string
    actorId: string
    actionType: string
    fromStatus: string | null
    toStatus: string | null
    snapshotTitle: string | null
    createdAt: Date
    post: {
      id: string
      title: string
      slug: string
      category: { slug: string }
    }
    actor: {
      id: string
      name: string
      email: string
    }
  }>
}

export function HistoryTab({ historyLogs }: HistoryTabProps) {
  if (historyLogs.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border bg-white text-zinc-500">
        Chưa có dữ liệu lịch sử.
      </div>
    )
  }

  function getActionLabel(type: string) {
    switch (type) {
      case "CREATED":
        return <Badge variant="default" className="bg-emerald-600">Tạo mới</Badge>
      case "UPDATED":
        return <Badge variant="secondary">Cập nhật</Badge>
      case "STATUS_CHANGED":
        return <Badge variant="default" className="bg-blue-600">Đổi trạng thái</Badge>
      case "TRASHED":
        return <Badge variant="default" className="bg-red-600">Vào thùng rác</Badge>
      case "RESTORED":
        return <Badge variant="outline">Khôi phục</Badge>
      case "DELETED":
        return <Badge variant="default" className="bg-red-600">Xóa vĩnh viễn</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  function getStatusLabel(status: string | null) {
    if (!status) return "N/A"
    switch (status) {
      case "DRAFT":
        return "Bản nháp"
      case "PENDING_REVIEW":
        return "Chờ duyệt"
      case "PENDING_PUBLISH":
        return "Chờ xuất bản"
      case "PUBLISHED":
        return "Đã xuất bản"
      case "REJECTED":
        return "Bị trả lại"
      default:
        return status
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lịch sử tác động</h2>
          <p className="text-sm text-muted-foreground">
            Lưu vết 100 hành động biên tập gần nhất trên toàn hệ thống.
          </p>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Thời gian</TableHead>
              <TableHead>Người thực hiện</TableHead>
              <TableHead>Hành động</TableHead>
              <TableHead>Bài viết</TableHead>
              <TableHead>Thay đổi trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historyLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium text-xs text-zinc-500">
                  {format(new Date(log.createdAt), "HH:mm dd/MM/yyyy", { locale: vi })}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{log.actor.name}</span>
                    <span className="text-xs text-zinc-500">{log.actor.email}</span>
                  </div>
                </TableCell>
                <TableCell>{getActionLabel(log.actionType)}</TableCell>
                <TableCell>
                  <div className="max-w-[250px] truncate text-sm" title={log.post?.title || log.snapshotTitle || "Bài viết đã bị xóa"}>
                    {log.post ? (
                      <a
                        href={`/admin/edit/${log.post.id}`}
                        className="text-blue-600 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {log.post.title}
                      </a>
                    ) : (
                      log.snapshotTitle || "Bài viết đã bị xóa"
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-zinc-600">
                  {log.fromStatus || log.toStatus ? (
                    <div className="flex items-center gap-1.5">
                      {log.fromStatus && (
                        <span className="line-through opacity-70">{getStatusLabel(log.fromStatus)}</span>
                      )}
                      {log.fromStatus && log.toStatus && <span>→</span>}
                      {log.toStatus && (
                        <span className="font-medium text-zinc-900">{getStatusLabel(log.toStatus)}</span>
                      )}
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}