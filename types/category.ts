export type CategoryWithChildren = {
  id: string
  name: string
  slug: string
  parentId: string | null
  children: {
    id: string
    name: string
    slug: string
    parentId: string | null
  }[]
}
