import Link from "next/link"
import type { Metadata } from "next"

import { AdPlaceholder } from "@/components/news/ad-placeholder"
import { PostCard } from "@/components/news/post-card"
import { SectionHeading } from "@/components/news/section-heading"
import { SiteFooter } from "@/components/news/site-footer"
import { SiteHeader } from "@/components/news/site-header"
import { getNavCategories, getPublishedSearchResults, type SearchResultItem } from "@/lib/queries"

export const revalidate = 3600

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string
    page?: string
  }>
}

function toPositiveInt(value?: string) {
  const parsed = Number.parseInt(value || "", 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1
  }
  return parsed
}

function normalizeQuery(value?: string) {
  return (value || "").trim().replace(/\s+/g, " ")
}

function buildSearchHref(query: string, page: number) {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
  })

  return `/search?${params.toString()}`
}

function toMetadataTitle(query: string) {
  if (query.length <= 60) {
    return `Tìm kiếm: ${query} | Songhay.vn`
  }

  return `Tìm kiếm: ${query.slice(0, 57)}... | Songhay.vn`
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const query = normalizeQuery(resolvedSearchParams?.q)

  return {
    title: query ? toMetadataTitle(query) : "Tìm kiếm | Songhay.vn",
    description: query
      ? `Kết quả tìm kiếm bài viết cho từ khóa: ${query}.`
      : "Tìm kiếm bài viết mới nhất trên Songhay.vn.",
    alternates: {
      canonical: "/search",
    },
    robots: {
      index: false,
      follow: true,
    },
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const query = normalizeQuery(resolvedSearchParams?.q)
  const page = toPositiveInt(resolvedSearchParams?.page)
  
  const [result, navCategories] = await Promise.all([
    query
      ? getPublishedSearchResults(query, page, 12)
      : Promise.resolve({
          query: "",
          items: [],
          totalCount: 0,
          page: 1,
          pageSize: 12,
          totalPages: 0,
        }),
    getNavCategories(),
  ])

  const hasPagination = query.length > 0 && result.totalPages > 1

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader navCategories={navCategories} defaultSearchQuery={query} />

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:px-6">
        <AdPlaceholder label="Top trang tìm kiếm (Google AdSense)" className="min-h-20" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="space-y-6">
            <SectionHeading title="Tìm kiếm" />

            {query ? (
              <p className="text-sm text-zinc-600">
                {result.totalCount > 0
                  ? `Tìm thấy ${result.totalCount} kết quả cho từ khóa "${query}".`
                  : `Không tìm thấy bài viết nào cho từ khóa "${query}".`}
              </p>
            ) : (
              <p className="text-sm text-zinc-600">Nhập từ khóa để tìm bài viết đã xuất bản.</p>
            )}

            {result.items.length > 0 ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {result.items.map((post: SearchResultItem) => (
                    <PostCard
                      key={post.id}
                      href={`/${post.category.slug}/${post.slug}`}
                      title={post.title}
                      excerpt={post.excerpt}
                      imageUrl={post.thumbnailUrl}
                      date={post.publishedAt}
                      categoryName={post.category.name}
                    />
                  ))}
                </div>

                <AdPlaceholder label="Giữa kết quả tìm kiếm (Google AdSense)" className="min-h-24" />
              </>
            ) : null}

            {hasPagination ? (
              <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                <div className="text-sm text-zinc-600">
                  Trang {result.page}/{result.totalPages}
                </div>

                <div className="flex items-center gap-2">
                  {result.page > 1 ? (
                    <Link
                      href={buildSearchHref(result.query, result.page - 1)}
                      className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      Trước
                    </Link>
                  ) : (
                    <span className="rounded-md border border-zinc-100 px-3 py-1.5 text-sm text-zinc-400">Trước</span>
                  )}

                  {result.page < result.totalPages ? (
                    <Link
                      href={buildSearchHref(result.query, result.page + 1)}
                      className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      Sau
                    </Link>
                  ) : (
                    <span className="rounded-md border border-zinc-100 px-3 py-1.5 text-sm text-zinc-400">Sau</span>
                  )}
                </div>
              </nav>
            ) : null}

            <AdPlaceholder label="Cuối trang tìm kiếm (Google AdSense)" className="min-h-24" />
          </section>

          <aside className="space-y-4">
            <AdPlaceholder label="Sidebar tìm kiếm trên (Google AdSense)" className="min-h-40" />
            <AdPlaceholder label="Sidebar tìm kiếm dưới (Google AdSense)" className="min-h-40" />
          </aside>
        </div>
      </main>

      <SiteFooter navCategories={navCategories} />
    </div>
  )
}
