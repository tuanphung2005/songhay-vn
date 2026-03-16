import type { LucideIcon } from "lucide-react"
import Link from "next/link"

import { OverviewActivityChart } from "@/components/admin/overview-activity-chart"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type OverviewStat = {
  key: string
  label: string
  value: number
  note: string
  icon: LucideIcon
  tone: string
}

type OverviewAnalytics = {
  daily: Array<{ label: string; views: number; comments: number; posts: number }>
  todayViews: number
  todayComments: number
  todayApprovedComments: number
  todayTopPosts: Array<{ id: string; title: string; slug: string; views: number; category: { slug: string } }>
}

type OverviewTabProps = {
  overviewStats: OverviewStat[]
  overviewAnalytics: OverviewAnalytics
}

export function OverviewTab({ overviewStats, overviewAnalytics }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((item) => {
          const ItemIcon = item.icon
          return (
            <Card key={item.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{item.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className={cn("text-3xl font-black", item.tone)}>{item.value}</p>
                    <p className="text-muted-foreground text-sm">{item.note}</p>
                  </div>
                  <div className="rounded-md border bg-zinc-50 p-2">
                    <ItemIcon className={cn("size-5", item.tone)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ 7 ngày gần nhất</CardTitle>
            <CardDescription>So sánh tổng view bài xuất bản theo ngày và số comment phát sinh.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <OverviewActivityChart data={overviewAnalytics.daily} />
            <p className="text-muted-foreground text-xs">
              Dữ liệu gồm: tổng view hiện tại của các bài xuất bản từng ngày và số comment tạo trong ngày.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tổng quan hôm nay</CardTitle>
            <CardDescription>Số liệu realtime cho nội dung mới và tương tác.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-md border px-3 py-2">
                <p className="text-muted-foreground text-xs">View từ bài đăng hôm nay</p>
                <p className="text-lg font-bold text-emerald-600">{overviewAnalytics.todayViews.toLocaleString("vi-VN")}</p>
              </div>
              <div className="rounded-md border px-3 py-2">
                <p className="text-muted-foreground text-xs">Comment mới hôm nay</p>
                <p className="text-lg font-bold text-sky-600">{overviewAnalytics.todayComments.toLocaleString("vi-VN")}</p>
              </div>
              <div className="rounded-md border px-3 py-2">
                <p className="text-muted-foreground text-xs">Comment đã duyệt hôm nay</p>
                <p className="text-lg font-bold text-violet-600">{overviewAnalytics.todayApprovedComments.toLocaleString("vi-VN")}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Top bài xuất bản hôm nay theo view</p>
              {overviewAnalytics.todayTopPosts.length === 0 ? (
                <p className="text-muted-foreground text-sm">Hôm nay chưa có bài xuất bản mới.</p>
              ) : (
                overviewAnalytics.todayTopPosts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <Link href={`/${post.category.slug}/${post.slug}`} className="line-clamp-1 pr-3 font-medium hover:text-rose-600">
                      {post.title}
                    </Link>
                    <Badge variant="outline">{post.views.toLocaleString("vi-VN")} view</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
