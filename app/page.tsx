import Link from "next/link"

import { AdPlaceholder } from "@/components/news/ad-placeholder"
import { BmiWidget } from "@/components/news/bmi-widget"
import { MostRead } from "@/components/news/most-read"
import { PostCard } from "@/components/news/post-card"
import { SectionHeading } from "@/components/news/section-heading"
import { SiteFooter } from "@/components/news/site-footer"
import { SiteHeader } from "@/components/news/site-header"
import { NAV_CATEGORIES } from "@/lib/categories"
import { getHomepageData, getTrendingPosts } from "@/lib/queries"

export const revalidate = 300

export default async function HomePage() {
  const [{ featuredPosts, latest, mostRead }, trendingPosts] = await Promise.all([
    getHomepageData(),
    getTrendingPosts(),
  ])

  const heroPost = featuredPosts[0]
  const heroMini = featuredPosts.slice(1, 4)

  const groupedByCategory = latest.reduce<Record<string, typeof latest>>((acc, post) => {
    const key = post.category.slug
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(post)
    return acc
  }, {})

  const categoryBlocks = NAV_CATEGORIES.filter((category) =>
    ["song-khoe", "meo-hay", "doi-song", "goc-stress", "tu-vi", "video"].includes(category.slug)
  )
    .map((category) => groupedByCategory[category.slug])
    .filter((items): items is typeof latest => Boolean(items && items.length > 0))

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 md:px-6">
        <AdPlaceholder label="Top banner (Google AdSense)" className="min-h-20" />

        <section className="grid gap-6 lg:grid-cols-[1fr_330px]">
          <div className="space-y-4">
            {heroPost ? (
              <article className="overflow-hidden border border-zinc-200 bg-white">
                <PostCard
                  href={`/${heroPost.category.slug}/${heroPost.slug}`}
                  title={heroPost.title}
                  excerpt={heroPost.excerpt}
                  imageUrl={heroPost.thumbnailUrl}
                  date={heroPost.publishedAt}
                  categoryName={heroPost.category.name}
                />
              </article>
            ) : null}

            <div className="grid gap-3 border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-3">
              {heroMini.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/${post.category.slug}/${post.slug}`}
                  className="text-sm font-bold text-zinc-800 transition hover:text-rose-600"
                >
                  Tit{index + 1}: {post.title}
                </Link>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <MostRead
              posts={mostRead.map((post) => ({
                id: post.id,
                title: post.title,
                thumbnailUrl: post.thumbnailUrl,
                views: post.views,
                slug: post.slug,
                categorySlug: post.category.slug,
              }))}
            />
            <AdPlaceholder label="Sidebar ad (Google AdSense)" />
            <BmiWidget />
          </aside>
        </section>

        <section className="space-y-4">
          <SectionHeading title="Trending posts" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trendingPosts.map((post) => (
              <PostCard
                key={post.id}
                href={`/${post.category.slug}/${post.slug}`}
                title={post.title}
                excerpt={post.excerpt}
                imageUrl={post.thumbnailUrl}
                date={post.publishedAt}
                categoryName={post.category.name}
                compact
              />
            ))}
          </div>
        </section>

        <AdPlaceholder label="Between sections ad (Google AdSense)" className="min-h-24" />

        <section className="space-y-8">
          {categoryBlocks.map((items) => {
            const [first, ...rest] = items
            return (
              <div key={first.category.slug} className="space-y-4">
                <SectionHeading title={first.category.name} />
                <div className="grid gap-4 lg:grid-cols-3">
                  <PostCard
                    href={`/${first.category.slug}/${first.slug}`}
                    title={first.title}
                    excerpt={first.excerpt}
                    imageUrl={first.thumbnailUrl}
                    date={first.publishedAt}
                    categoryName={first.category.name}
                  />
                  {rest.slice(0, 2).map((post) => (
                    <PostCard
                      key={post.id}
                      href={`/${post.category.slug}/${post.slug}`}
                      title={post.title}
                      excerpt={post.excerpt}
                      imageUrl={post.thumbnailUrl}
                      date={post.publishedAt}
                      compact
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
