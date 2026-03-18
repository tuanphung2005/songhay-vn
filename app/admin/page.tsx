import Link from "next/link"
import type { Metadata } from "next"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Clock3,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  LibraryBig,
  MessageSquareMore,
  Newspaper,
  PenSquare,
  ShieldCheck,
  Trash2,
  UserSquare2,
} from "lucide-react"

import {
  approvePendingPost,
  createCategory,
  createPost,
  deleteCategory,
  deletePostPermanently,
  moderateComment,
  movePostToTrash,
  rejectPendingPost,
  reorderCategory,
  restorePostFromTrash,
  updatePasswordMock,
  updateCategory,
} from "@/app/admin/actions"
import { type AdminTab, getAdminPageData } from "@/app/admin/data"
import { AdminActionToast } from "@/components/admin/action-toast"
import { CategoriesTab } from "@/components/admin/categories-tab"
import { CommentsTab } from "@/components/admin/comments-tab"
import { MediaLibraryTab } from "@/components/admin/media-library-tab"
import { OverviewTab } from "@/components/admin/overview-tab"
import { PendingPostsTab } from "@/components/admin/pending-posts-tab"
import { PersonalArchiveTab } from "@/components/admin/personal-archive-tab"
import { PostsTab } from "@/components/admin/posts-tab"
import { SettingsPasswordTab } from "@/components/admin/settings-password-tab"
import { TrashTab } from "@/components/admin/trash-tab"
import { WriteTab } from "@/components/admin/write-tab"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireCmsUser } from "@/lib/auth"

export const revalidate = 0
export const metadata: Metadata = {
  title: "CMS Admin",
  robots: {
    index: false,
    follow: false,
  },
}

type NavLeaf = {
  key: AdminTab
  label: string
  description: string
  icon: LucideIcon
  adminOnly?: boolean
}

const OVERVIEW_TAB: NavLeaf = {
  key: "overview",
  label: "Tổng quan",
  description: "Bức tranh tổng quan trạng thái CMS",
  icon: LayoutDashboard,
}

const CONTENT_MANAGEMENT_TABS: NavLeaf[] = [
  { key: "write", label: "Viết bài mới", description: "Soạn nội dung và gửi duyệt/xuất bản", icon: PenSquare },
  { key: "pending-posts", label: "Kho bài chờ duyệt", description: "Admin duyệt, CTV theo dõi trạng thái", icon: Clock3 },
  { key: "media-library", label: "Kho dữ liệu", description: "Tái sử dụng ảnh/video đã upload", icon: LibraryBig },
  { key: "personal-archive", label: "Lưu trữ cá nhân", description: "Bài viết theo tài khoản đăng nhập", icon: UserSquare2 },
  { key: "posts", label: "Kho bài", description: "Kho bài đã xuất bản", icon: Newspaper },
  { key: "trash", label: "Thùng rác", description: "Khôi phục hoặc xóa vĩnh viễn", icon: Trash2 },
]

const SETTINGS_TABS: NavLeaf[] = [
  { key: "settings-password", label: "Đổi mật khẩu", description: "Mock UI đổi mật khẩu", icon: KeyRound },
  { key: "categories", label: "Chuyên mục", description: "Quản lý cấu trúc chuyên mục", icon: FolderKanban, adminOnly: true },
  { key: "comments", label: "Bình luận", description: "Duyệt và kiểm soát thảo luận", icon: MessageSquareMore, adminOnly: true },
]

type AdminPageProps = {
  searchParams?: Promise<{
    tab?: string
    moved?: string
    direction?: string
    postsQ?: string
    postsAuthor?: string
    postsApproval?: string
    postsFrom?: string
    postsTo?: string
    postsPage?: string
    personalQ?: string
    personalStatus?: string
    personalFrom?: string
    personalTo?: string
    personalPage?: string
    trashQ?: string
    trashAuthor?: string
    trashFrom?: string
    trashTo?: string
    trashPage?: string
  }>
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const currentUser = await requireCmsUser()
  const isAdmin = currentUser.role === "ADMIN"

  const contentTabs = CONTENT_MANAGEMENT_TABS.filter((item) => (item.adminOnly ? isAdmin : true))
  const settingsTabs = SETTINGS_TABS.filter((item) => (item.adminOnly ? isAdmin : true))
  const visibleTabs: NavLeaf[] = [OVERVIEW_TAB, ...contentTabs, ...settingsTabs]

  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const tabFromQuery = resolvedSearchParams?.tab
  const movedCategoryId = resolvedSearchParams?.moved
  const movedDirection = resolvedSearchParams?.direction

  const postsQuery = (resolvedSearchParams?.postsQ || "").trim().slice(0, 120)
  const postsAuthorRaw = (resolvedSearchParams?.postsAuthor || "").trim()
  const postsAuthor = postsAuthorRaw === "all" ? "" : postsAuthorRaw
  const postsApproval = ["all", "approved", "unapproved"].includes(resolvedSearchParams?.postsApproval || "")
    ? (resolvedSearchParams?.postsApproval as "all" | "approved" | "unapproved")
    : "all"
  const postsFrom = (resolvedSearchParams?.postsFrom || "").trim()
  const postsTo = (resolvedSearchParams?.postsTo || "").trim()
  const rawPostsPage = Number.parseInt(resolvedSearchParams?.postsPage || "1", 10)
  const requestedPostsPage = Number.isFinite(rawPostsPage) && rawPostsPage > 0 ? rawPostsPage : 1

  const personalQuery = (resolvedSearchParams?.personalQ || "").trim().slice(0, 120)
  const personalStatus = ["all", "draft", "pending", "published", "rejected"].includes(resolvedSearchParams?.personalStatus || "")
    ? (resolvedSearchParams?.personalStatus as "all" | "draft" | "pending" | "published" | "rejected")
    : "all"
  const personalFrom = (resolvedSearchParams?.personalFrom || "").trim()
  const personalTo = (resolvedSearchParams?.personalTo || "").trim()
  const rawPersonalPage = Number.parseInt(resolvedSearchParams?.personalPage || "1", 10)
  const requestedPersonalPage = Number.isFinite(rawPersonalPage) && rawPersonalPage > 0 ? rawPersonalPage : 1

  const trashQuery = (resolvedSearchParams?.trashQ || "").trim().slice(0, 120)
  const trashAuthorRaw = (resolvedSearchParams?.trashAuthor || "").trim()
  const trashAuthor = trashAuthorRaw === "all" ? "" : trashAuthorRaw
  const trashFrom = (resolvedSearchParams?.trashFrom || "").trim()
  const trashTo = (resolvedSearchParams?.trashTo || "").trim()
  const rawTrashPage = Number.parseInt(resolvedSearchParams?.trashPage || "1", 10)
  const requestedTrashPage = Number.isFinite(rawTrashPage) && rawTrashPage > 0 ? rawTrashPage : 1

  const postsFilters = {
    query: postsQuery,
    authorId: postsAuthor,
    approval: postsApproval,
    fromDate: postsFrom,
    toDate: postsTo,
    requestedPage: requestedPostsPage,
  } as const

  const personalArchiveFilters = {
    query: personalQuery,
    status: personalStatus,
    fromDate: personalFrom,
    toDate: personalTo,
    requestedPage: requestedPersonalPage,
  } as const

  const trashFilters = {
    query: trashQuery,
    authorId: trashAuthor,
    fromDate: trashFrom,
    toDate: trashTo,
    requestedPage: requestedTrashPage,
  } as const

  const activeTab: AdminTab = visibleTabs.some((item) => item.key === tabFromQuery)
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
    pendingPostsData,
    personalPostsData,
    mediaLibraryData,
    trashedPosts,
    pendingComments,
    overviewAnalytics,
  } = await getAdminPageData({
    activeTab,
    postsFilters,
    personalArchiveFilters,
    trashFilters,
    currentUser: {
      id: currentUser.id,
      role: currentUser.role,
    },
  })

  const activeTabMeta = visibleTabs.find((item) => item.key === activeTab) || visibleTabs[0]
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
            {isAdmin ? "Quyền quản trị" : "Quyền cộng tác viên"}
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
            <CardContent className="space-y-3">
              <Button
                asChild
                className="h-10 w-full justify-start gap-2.5"
                variant={activeTab === OVERVIEW_TAB.key ? "secondary" : "ghost"}
              >
                <Link href={`/admin?tab=${OVERVIEW_TAB.key}`}>
                  <OVERVIEW_TAB.icon className="size-4" />
                  {OVERVIEW_TAB.label}
                </Link>
              </Button>

              <div className="space-y-1.5 rounded-md border p-2">
                <p className="text-muted-foreground px-2 text-[11px] font-semibold uppercase tracking-[0.12em]">Quản lý tin</p>
                {contentTabs.map((tab) => {
                  const TabIcon = tab.icon
                  return (
                    <Button
                      key={tab.key}
                      asChild
                      className="h-9 w-full justify-start gap-2.5"
                      variant={activeTab === tab.key ? "secondary" : "ghost"}
                    >
                      <Link href={`/admin?tab=${tab.key}`}>
                        <TabIcon className="size-4" />
                        {tab.label}
                      </Link>
                    </Button>
                  )
                })}
              </div>

              <div className="space-y-1.5 rounded-md border p-2">
                <p className="text-muted-foreground px-2 text-[11px] font-semibold uppercase tracking-[0.12em]">Settings</p>
                {settingsTabs.map((tab) => {
                  const TabIcon = tab.icon
                  return (
                    <Button
                      key={tab.key}
                      asChild
                      className="h-9 w-full justify-start gap-2.5"
                      variant={activeTab === tab.key ? "secondary" : "ghost"}
                    >
                      <Link href={`/admin?tab=${tab.key}`}>
                        <TabIcon className="size-4" />
                        {tab.label}
                      </Link>
                    </Button>
                  )
                })}
              </div>
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
          {activeTab === "write" ? <WriteTab isAdmin={isAdmin} categoriesForWrite={categoriesForWrite} mediaAssets={mediaLibraryData} createPost={createPost} /> : null}
          {activeTab === "pending-posts" ? <PendingPostsTab isAdmin={isAdmin} rows={pendingPostsData} approvePendingPost={approvePendingPost} rejectPendingPost={rejectPendingPost} /> : null}
          {activeTab === "media-library" ? <MediaLibraryTab isAdmin={isAdmin} rows={mediaLibraryData} /> : null}
          {activeTab === "personal-archive" ? <PersonalArchiveTab isAdmin={isAdmin} data={personalPostsData} filters={personalArchiveFilters} movePostToTrash={movePostToTrash} /> : null}
          {activeTab === "comments" ? <CommentsTab pendingComments={pendingComments} moderateComment={moderateComment} /> : null}
          {activeTab === "posts" ? <PostsTab isAdmin={isAdmin} postsData={postsData} filters={postsFilters} postsPaginationItems={postsPaginationItems} movePostToTrash={movePostToTrash} /> : null}
          {activeTab === "trash" ? <TrashTab isAdmin={isAdmin} data={trashedPosts} filters={trashFilters} restorePostFromTrash={restorePostFromTrash} deletePostPermanently={deletePostPermanently} /> : null}
          {activeTab === "settings-password" ? <SettingsPasswordTab updatePasswordMock={updatePasswordMock} /> : null}
        </section>
      </div>
    </main>
  )
}
