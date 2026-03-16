import Link from "next/link"
import type { Metadata } from "next"
import type { LucideIcon } from "lucide-react"
import { Activity, FolderKanban, LayoutDashboard, MessageSquareMore, Newspaper, PenSquare, ShieldCheck, Trash2 } from "lucide-react"

import {
  createCategory,
  createPost,
  deleteCategory,
  deletePostPermanently,
  moderateComment,
  movePostToTrash,
  reorderCategory,
  restorePostFromTrash,
  updateCategory,
  updatePostFlags,
} from "@/app/admin/actions"
import { type AdminTab, getAdminPageData } from "@/app/admin/data"
import { AdminActionToast } from "@/components/admin/action-toast"
import { CategoriesTab } from "@/components/admin/categories-tab"
import { CommentsTab } from "@/components/admin/comments-tab"
import { OverviewTab } from "@/components/admin/overview-tab"
import { PostsTab } from "@/components/admin/posts-tab"
import { TrashTab } from "@/components/admin/trash-tab"
import { WriteTab } from "@/components/admin/write-tab"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdminUser } from "@/lib/auth"

export const revalidate = 0
export const metadata: Metadata = {
  title: "CMS Admin",
  robots: {
    index: false,
    follow: false,
  },
}

const ADMIN_TABS: Array<{ key: AdminTab; label: string; description: string; icon: LucideIcon }> = [
  { key: "overview", label: "Tổng quan", description: "Bức tranh tổng quan trạng thái CMS", icon: LayoutDashboard },
  { key: "write", label: "Viết bài", description: "Soạn và xuất bản nội dung mới", icon: PenSquare },
  { key: "categories", label: "Chuyên mục", description: "Quản lý cấu trúc chuyên mục", icon: FolderKanban },
  { key: "comments", label: "Bình luận", description: "Duyệt và kiểm soát thảo luận", icon: MessageSquareMore },
  { key: "posts", label: "Kho bài", description: "Chỉnh sửa và tối ưu nội dung", icon: Newspaper },
  { key: "trash", label: "Thùng rác", description: "Khôi phục hoặc xóa vĩnh viễn", icon: Trash2 },
]

type AdminPageProps = {
  searchParams?: Promise<{ tab?: string; moved?: string; direction?: string; q?: string; page?: string }>
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireAdminUser()

  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const tabFromQuery = resolvedSearchParams?.tab
  const movedCategoryId = resolvedSearchParams?.moved
  const movedDirection = resolvedSearchParams?.direction
  const postsQuery = (resolvedSearchParams?.q || "").trim().slice(0, 120)
  const rawPostsPage = Number.parseInt(resolvedSearchParams?.page || "1", 10)
  const requestedPostsPage = Number.isFinite(rawPostsPage) && rawPostsPage > 0 ? rawPostsPage : 1

  const activeTab: AdminTab = ADMIN_TABS.some((item) => item.key === tabFromQuery)
    ? (tabFromQuery as AdminTab)
    : "overview"

  const {
    postCount,
    categoryCount,
    pendingCommentCount,
    trashedPostCount,
    totalPostViews,
    categoriesForManage,
    categoriesForWrite,
    postsData,
    postsPaginationItems,
    trashedPosts,
    pendingComments,
    overviewAnalytics,
  } = await getAdminPageData({
    activeTab,
    postsQuery,
    requestedPostsPage,
  })

  const activeTabMeta = ADMIN_TABS.find((item) => item.key === activeTab) || ADMIN_TABS[0]
  const ActiveTabIcon = activeTabMeta.icon

  const overviewStats = [
    {
      key: "posts",
      label: "Bài viết",
      value: postCount,
      note: "Bài gần nhất trong hệ thống",
      icon: Newspaper,
      tone: "text-sky-600",
    },
    {
      key: "categories",
      label: "Chuyên mục",
      value: categoryCount,
      note: "Danh mục đang hoạt động",
      icon: FolderKanban,
      tone: "text-violet-600",
    },
    {
      key: "comments",
      label: "Comment chờ duyệt",
      value: pendingCommentCount,
      note: "Cần xử lý bởi admin",
      icon: MessageSquareMore,
      tone: pendingCommentCount > 0 ? "text-amber-600" : "text-zinc-900",
    },
    {
      key: "views",
      label: "Tổng lượt xem",
      value: totalPostViews,
      note: "Tổng view của các bài đã publish",
      icon: Activity,
      tone: "text-emerald-600",
    },
  ]

  return (
    <main className="min-h-screen bg-muted/30">
      <AdminActionToast />
      <header className="border-b bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em]">Songhay CMS</p>
            <h1 className="mt-1 text-xl font-black text-zinc-900 md:text-2xl">Bảng điều khiển quản trị</h1>
          </div>
          <Badge variant="secondary" className="hidden h-7 items-center gap-1.5 px-3 md:inline-flex">
            <ShieldCheck className="size-3.5" />
            Quyền quản trị
          </Badge>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-4 p-4 md:grid-cols-[280px_1fr] md:p-6">
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Điều hướng CMS</CardTitle>
              <CardDescription>Chuyển nhanh theo nghiệp vụ quản trị.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {ADMIN_TABS.map((tab) => {
                const TabIcon = tab.icon
                return (
                  <Button
                    key={tab.key}
                    asChild
                    className="h-10 w-full justify-start gap-2.5"
                    variant={activeTab === tab.key ? "secondary" : "ghost"}
                  >
                    <Link href={`/admin?tab=${tab.key}`}>
                      <TabIcon className="size-4" />
                      {tab.label}
                    </Link>
                  </Button>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Snapshot hệ thống</CardTitle>
              <CardDescription>Những chỉ số cần theo dõi mỗi ngày.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="flex items-center justify-between rounded-md border px-3 py-2"><span className="text-muted-foreground">Bài viết</span><span className="font-semibold">{postCount}</span></div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2"><span className="text-muted-foreground">Chuyên mục</span><span className="font-semibold">{categoryCount}</span></div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2"><span className="text-muted-foreground">Comment chờ duyệt</span><span className="font-semibold">{pendingCommentCount}</span></div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2"><span className="text-muted-foreground">Thùng rác</span><span className="font-semibold">{trashedPostCount}</span></div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2"><span className="text-muted-foreground">Tổng lượt xem</span><span className="font-semibold">{totalPostViews.toLocaleString("vi-VN")}</span></div>
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ActiveTabIcon className="size-5 text-zinc-700" />
                  {activeTabMeta.label}
                </CardTitle>
                <CardDescription>{activeTabMeta.description}</CardDescription>
              </div>
              <Badge variant="outline" className="hidden md:inline-flex">
                <Activity className="mr-1.5 size-3.5" />
                Live data
              </Badge>
            </CardHeader>
          </Card>

          {activeTab === "overview" ? <OverviewTab overviewStats={overviewStats} overviewAnalytics={overviewAnalytics} /> : null}
          {activeTab === "categories" ? <CategoriesTab categoriesForManage={categoriesForManage} movedCategoryId={movedCategoryId} movedDirection={movedDirection} createCategory={createCategory} updateCategory={updateCategory} reorderCategory={reorderCategory} deleteCategory={deleteCategory} /> : null}
          {activeTab === "write" ? <WriteTab categoriesForWrite={categoriesForWrite} createPost={createPost} /> : null}
          {activeTab === "comments" ? <CommentsTab pendingComments={pendingComments} moderateComment={moderateComment} /> : null}
          {activeTab === "posts" ? <PostsTab postsData={postsData} postsQuery={postsQuery} postsPaginationItems={postsPaginationItems} updatePostFlags={updatePostFlags} movePostToTrash={movePostToTrash} /> : null}
          {activeTab === "trash" ? <TrashTab trashedPosts={trashedPosts} restorePostFromTrash={restorePostFromTrash} deletePostPermanently={deletePostPermanently} /> : null}
        </section>
      </div>
    </main>
  )
}
