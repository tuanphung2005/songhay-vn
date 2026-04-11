import type { PostCompact } from "./post"

export type SearchResultItem = PostCompact

export type PaginatedSearchResults = {
  query: string
  items: SearchResultItem[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}
