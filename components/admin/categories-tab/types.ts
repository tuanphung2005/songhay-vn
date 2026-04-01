export type CategoryManageRow = {
  id: string
  slug: string
  name: string
  parentId: string | null
  parent: {
    name: string
    slug: string
  } | null
  description: string | null
  sortOrder: number
  _count: {
    posts: number
  }
}

export type CategoryActions = {
  updateCategory: (formData: FormData) => Promise<void>
  reorderCategory: (formData: FormData) => Promise<void>
  deleteCategory: (formData: FormData) => Promise<void>
}
