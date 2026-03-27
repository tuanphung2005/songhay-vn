import {
  getAdminSnapshot,
  getCategoriesForManage,
  getCategoriesForWrite,
  getMediaLibraryData,
  getOverviewAnalytics,
  getPendingComments,
  getPersonalPostsData,
  getPostsData,
  getTrashedPostsData,
  getUsersData,
  getRolePermissionsData,
} from "@/app/admin/data-loaders/index"
import { buildPaginationItems } from "@/app/admin/data-helpers"
import type { GetAdminPageDataInput } from "@/app/admin/data-types"

export type { AdminTab } from "@/app/admin/data-types"

export async function getAdminPageData({
  activeTab,
  postsFilters,
  personalArchiveFilters,
  trashFilters,
  currentUser,
}: GetAdminPageDataInput) {
  const {
    postCount,
    categoryCount,
    pendingCommentCount,
    trashedPostCount,
    totalPostViews,
  } = await getAdminSnapshot()

  const [
    categoriesForManage,
    categoriesForWrite,
    postsData,
    personalPostsData,
    mediaLibraryData,
    trashedPosts,
    pendingComments,
    overviewAnalytics,
    usersData,
    permissionsMatrix,
  ] = await Promise.all([
    getCategoriesForManage(activeTab),
    getCategoriesForWrite(activeTab),
    getPostsData(activeTab, postsFilters, currentUser),
    getPersonalPostsData(activeTab, personalArchiveFilters, currentUser),
    getMediaLibraryData(activeTab),
    getTrashedPostsData(activeTab, trashFilters, currentUser),
    getPendingComments(activeTab),
    getOverviewAnalytics(activeTab),
    getUsersData(activeTab),
    getRolePermissionsData(activeTab),
  ])

  const postsPaginationItems = buildPaginationItems(postsData.currentPage, postsData.totalPages)

  return {
    postCount,
    categoryCount,
    pendingCommentCount,
    trashedPostCount,
    totalPostViews,
    categoriesForManage,
    categoriesForWrite,
    postsData,
    postsPaginationItems,
    postsFilters,
    personalPostsData,
    personalArchiveFilters,
    mediaLibraryData,
    trashedPosts,
    trashFilters,
    pendingComments,
    overviewAnalytics,
    usersData,
    permissionsMatrix,
  }
}
