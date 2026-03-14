import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PostCard } from "@/components/news/post-card"
import { SectionHeading } from "@/components/news/section-heading"
import { SiteFooter } from "@/components/news/site-footer"
import { SiteHeader } from "@/components/news/site-header"
import { getCategoryBySlug, getPostsByCategory } from "@/lib/queries"

export const revalidate = 300

type CategoryPageProps = {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params
  const foundCategory = await getCategoryBySlug(category)

  if (!foundCategory) {
    return { title: "Không tìm thấy chuyên mục" }
  }

  const title = `${foundCategory.name} | Songhay.vn`
  const description = foundCategory.description || `Khám phá bài viết mới nhất thuộc chuyên mục ${foundCategory.name}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params
  const [foundCategory, posts] = await Promise.all([
    getCategoryBySlug(category),
    getPostsByCategory(category),
  ])

  if (!foundCategory) {
    notFound()
  }

  const currentCategory = foundCategory!

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:px-6">
        <SectionHeading title={currentCategory.name} />
        {posts.length === 0 ? (
          <p className="text-zinc-600">Chuyên mục này chưa có bài viết.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
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
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
