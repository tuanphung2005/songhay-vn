import type { Metadata } from "next"
import {
  Activity,
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
  Users,
} from "lucide-react"

import {
  addForbiddenKeyword,
  addSeoKeyword,
  approvePendingPost,
  createSubordinateAccount,
  createCategory,
  createPost,
  deleteCategory,
  deleteForbiddenKeyword,
  deletePostPermanently,
  deleteSeoKeyword,
  moderateComment,
  movePostToTrash,
  promotePostToPendingPublish,
  rejectPendingPost,
  reorderCategory,
  restorePostFromTrash,
  returnPostToDraft,
  returnPostToPendingPublish,
  returnPostToPendingReview,
  submitPostToPendingReview,
  updateCategory,
  updatePasswordMock,
  updateRolePermissions,
  updateUserRole,
  deleteUser,
} from "@/app/admin/actions"
import { type AdminTab, getAdminPageData } from "@/app/admin/data"
import {
  getVisibleTabs,
  OVERVIEW_TAB,
  parseAdminSearchParams,
  type NavCountKey,
  type NavIconName,
} from "@/app/admin/page-helpers"
import { AdminActionToast } from "@/components/admin/action-toast"
import { AdminNavButton } from "@/components/admin/admin-nav-button"
import { CategoriesTab } from "@/components/admin/categories-tab"
import { CommentsTab } from "@/components/admin/comments-tab"
import { MediaLibraryTab } from "@/components/admin/media-library-tab"
import { OverviewTab } from "@/components/admin/overview-tab"
import { PersonalArchiveTab } from "@/components/admin/personal-archive-tab"
import { PostsTab } from "@/components/admin/posts-tab"
import { SettingsModerationTab } from "@/components/admin/settings-moderation-tab"
import { SettingsPasswordTab } from "@/components/admin/settings-password-tab"
import { SettingsPermissionsTab } from "@/components/admin/settings-permissions-tab"
import { SettingsUsersTab } from "@/components/admin/settings-users-tab"
import { TrashTab } from "@/components/admin/trash-tab"
import { WriteTab } from "@/components/admin/write-tab"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { requireCmsUser } from "@/lib/auth"
import {
  can,
  canApprovePendingReview,
  canCreateSubordinateAccount,
  canEditByStatus,
  canPublishNow,
  canSubmitPendingPublish,
  canViewAllPosts,
  ROLE_LABELS_VI,
} from "@/lib/permissions"

export const revalidate = 0
export const metadata: Metadata = {
  title: "CMS Admin",
  robots: {
    index: false,
    follow: false,
  },
}

const navIcons: Record<NavIconName, typeof LayoutDashboard> = {
  layoutDashboard: LayoutDashboard,
  penSquare: PenSquare,
  libraryBig: LibraryBig,
  userSquare2: UserSquare2,
  newspaper: Newspaper,
  trash2: Trash2,
  keyRound: KeyRound,
  messageSquareMore: MessageSquareMore,
  folderKanban: FolderKanban,
  shieldCheck: ShieldCheck,
  users: Users,
}

type AdminPageProps = {
  searchParams?: Promise<{
    tab?: string
    overviewRange?: string
    moved?: string
    direction?: string
    postsQ?: string
    postsAuthor?: string
    postsStatus?: string
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
  const canSeeAllPosts = canViewAllPosts(currentUser.role)
  const canManageSettings = can(currentUser.role, "create-category")

  const { contentTabs, settingsTabs, visibleTabs } = getVisibleTabs({
    canManageSettings,
  })

  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const { tabFromQuery, overviewRange, movedCategoryId, movedDirection, postsFilters, personalArchiveFilters, trashFilters } = parseAdminSearchParams(resolvedSearchParams)

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
    seoKeywordOptions,
    postsData,
    postsPaginationItems,
    personalPostsData,
    mediaLibraryData,
    trashedPosts,
    pendingComments,
    overviewAnalytics,
    moderationSettings,
    usersData,
    permissionsMatrix,
  } = await getAdminPageData({
    activeTab,
    overviewRange: overviewRange === "30d" ? "30d" : "7d",
    postsFilters,
    personalArchiveFilters,
    trashFilters,
    currentUser: {
      id: currentUser.id,
      role: currentUser.role,
    },
  })

  const activeTabMeta = visibleTabs.find((item) => item.key === activeTab) || visibleTabs[0]
  const ActiveTabIcon = navIcons[activeTabMeta.iconName]
  const navCountByKey: Record<NavCountKey, number> = {
    postCount,
    categoryCount,
    pendingCommentCount,
    trashedPostCount,
  }

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
        <div className="flex w-full items-center justify-between px-4 py-4 md:px-6 xl:px-8">
          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em]">Songhay CMS</p>
            <h1 className="mt-1 text-xl font-black text-zinc-900 md:text-2xl">Bảng điều khiển quản trị</h1>
          </div>
          <Badge variant="secondary" className="hidden h-7 items-center gap-1.5 px-3 md:inline-flex">
            <ShieldCheck className="size-3.5" />
            {ROLE_LABELS_VI[currentUser.role]}
          </Badge>
        </div>
      </header>

      <div className="grid w-full gap-4 p-4 md:grid-cols-[280px_1fr] md:p-6 xl:gap-6 xl:px-8">
        <aside className="space-y-4 md:sticky md:top-24 md:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Điều hướng CMS</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[70dvh] px-4 pb-4 md:max-h-[calc(100dvh-8rem)]">
                <div className="space-y-3">
                  <div className="space-y-1.5 pt-4">
                    <p className="text-muted-foreground px-2 text-[11px] font-semibold uppercase tracking-[0.12em]">Tổng quan</p>
                    <AdminNavButton tab={OVERVIEW_TAB} activeTab={activeTab} />
                  </div>

                  <Separator />

                  <div className="space-y-1.5">
                    <p className="text-muted-foreground px-2 text-[11px] font-semibold uppercase tracking-[0.12em]">Quản lý tin</p>
                    {contentTabs.map((tab) => (
                      <AdminNavButton key={tab.key} tab={tab} activeTab={activeTab} count={tab.countKey ? navCountByKey[tab.countKey] : undefined} />
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-1.5">
                    <p className="text-muted-foreground px-2 text-[11px] font-semibold uppercase tracking-[0.12em]">Cài đặt</p>
                    {settingsTabs.map((tab) => (
                      <AdminNavButton key={tab.key} tab={tab} activeTab={activeTab} count={tab.countKey ? navCountByKey[tab.countKey] : undefined} />
                    ))}
                  </div>
                </div>
              </ScrollArea>
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
          {activeTab === "write" ? <WriteTab canPublishNow={canPublishNow(currentUser.role)} canSubmitPendingPublish={canSubmitPendingPublish(currentUser.role)} categoriesForWrite={categoriesForWrite} seoKeywordOptions={seoKeywordOptions} mediaAssets={mediaLibraryData} currentUserId={currentUser.id} createPost={createPost} /> : null}
          {activeTab === "media-library" ? <MediaLibraryTab isAdmin={canSeeAllPosts} rows={mediaLibraryData} /> : null}
          {activeTab === "personal-archive" ? <PersonalArchiveTab isAdmin={canSeeAllPosts} data={personalPostsData} filters={personalArchiveFilters} movePostToTrash={movePostToTrash} /> : null}
          {activeTab === "comments" ? <CommentsTab pendingComments={pendingComments} moderateComment={moderateComment} /> : null}
          {activeTab === "settings-moderation" ? <SettingsModerationTab forbiddenKeywords={moderationSettings.forbiddenKeywords} seoKeywords={moderationSettings.seoKeywords} addForbiddenKeyword={addForbiddenKeyword} deleteForbiddenKeyword={deleteForbiddenKeyword} addSeoKeyword={addSeoKeyword} deleteSeoKeyword={deleteSeoKeyword} /> : null}
          {activeTab === "posts" ? (
            <PostsTab
              isAdmin={canSeeAllPosts}
              canSubmitPendingReview={can(currentUser.role, "submit-pending-review")}
              canSubmitPendingPublish={canSubmitPendingPublish(currentUser.role)}
              canReviewPending={canApprovePendingReview(currentUser.role)}
              canPublishNow={canPublishNow(currentUser.role)}
              canEditDraft={canEditByStatus(currentUser.role, "DRAFT")}
              canEditPendingReview={canEditByStatus(currentUser.role, "PENDING_REVIEW")}
              canEditPendingPublish={canEditByStatus(currentUser.role, "PENDING_PUBLISH")}
              canEditPublished={canEditByStatus(currentUser.role, "PUBLISHED")}
              postsData={postsData}
              filters={postsFilters}
              postsPaginationItems={postsPaginationItems}
              movePostToTrash={movePostToTrash}
              submitPostToPendingReview={submitPostToPendingReview}
              promotePostToPendingPublish={promotePostToPendingPublish}
              approvePendingPost={approvePendingPost}
              rejectPendingPost={rejectPendingPost}
              returnPostToDraft={returnPostToDraft}
              returnPostToPendingReview={returnPostToPendingReview}
              returnPostToPendingPublish={returnPostToPendingPublish}
            />
          ) : null}
          {activeTab === "trash" ? <TrashTab isAdmin={canSeeAllPosts} data={trashedPosts} filters={trashFilters} restorePostFromTrash={restorePostFromTrash} deletePostPermanently={deletePostPermanently} /> : null}
          {activeTab === "settings-password" ? <SettingsPasswordTab updatePasswordMock={updatePasswordMock} createSubordinateAccount={createSubordinateAccount} canCreateSubordinateAccount={canCreateSubordinateAccount(currentUser.role)} /> : null}
          {activeTab === "settings-permissions" ? <SettingsPermissionsTab permissionsMatrix={permissionsMatrix} updateRolePermissions={updateRolePermissions} /> : null}
          {activeTab === "settings-users" ? <SettingsUsersTab users={usersData} currentUserId={currentUser.id} updateUserRole={updateUserRole} deleteUser={deleteUser} /> : null}
        </section>
      </div>
    </main>
  )
}
