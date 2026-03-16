import Link from "next/link"
import type { Metadata } from "next"

import { AdPlaceholder } from "@/components/news/ad-placeholder"
import { AiWeatherWidget } from "@/components/news/ai-weather-widget"
import { DontMissWidget } from "@/components/news/dont-miss-widget"
import { LunarCalendarWidget } from "@/components/news/lunar-calendar-widget"
import { MostRead } from "@/components/news/most-read"
import { PostCard } from "@/components/news/post-card"
import { SectionHeading } from "@/components/news/section-heading"
import { SiteFooter } from "@/components/news/site-footer"
import { SiteHeader } from "@/components/news/site-header"
import { JsonLd } from "@/components/seo/json-ld"
import { getHomepageData, getNavCategories, getTrendingPosts } from "@/lib/queries"
import { DEFAULT_OG_IMAGE_PATH, getSiteUrl, SITE_NAME, toAbsoluteUrl } from "@/lib/seo"

export const revalidate = 300

const siteUrl = getSiteUrl()
const canonicalUrl = siteUrl
const defaultOgImage = toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH)
const homeDescription = "Tin tức và tiện ích mỗi ngày: sống khỏe, mẹo hay, đời sống, góc stress, tử vi, video."

export const metadata: Metadata = {
  title: `${SITE_NAME} | Kho tàng điều hay`,
  description: homeDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} | Kho tàng điều hay`,
    description: homeDescription,
    type: "website",
    url: canonicalUrl,
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Kho tàng điều hay`,
    description: homeDescription,
    images: [defaultOgImage],
  },
}

export default async function HomePage() {
  const [{ featuredPosts, latest, mostRead }, trendingPosts, navCategories] = await Promise.all([
    getHomepageData(),
    getTrendingPosts(),
    getNavCategories(),
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

  const categoryBlocks = navCategories.filter((category) =>
    ["song-khoe", "meo-hay", "doi-song", "goc-stress", "tu-vi", "video"].includes(category.slug)
  )
    .map((category) => groupedByCategory[category.slug])
    .filter((items): items is typeof latest => Boolean(items && items.length > 0))

  const homepageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: `${SITE_NAME} | Kho tàng điều hay`,
    description: homeDescription,
    inLanguage: "vi-VN",
    isPartOf: {
      "@id": `${siteUrl}#website`,
    },
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <JsonLd data={homepageJsonLd} />
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 md:px-6">
        <AdPlaceholder label="Top banner (Google AdSense)" className="min-h-20" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-8">
            <section className="space-y-4">
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
                {heroMini.map((post) => (
                  <Link
                    key={post.id}
                    href={`/${post.category.slug}/${post.slug}`}
                    className="text-sm font-bold text-zinc-800 transition hover:text-rose-600"
                  >
                    {post.title}
                  </Link>
                ))}
              </div>

              <section className="space-y-4">
                <SectionHeading title="Đừng bỏ lỡ!" />
                <DontMissWidget />
              </section>
            </section>

            <section className="space-y-4">
              <SectionHeading title="Tin đọc nhiều" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
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
                const [first] = items
                return (
                  <div key={first.category.slug} className="space-y-4">
                    <SectionHeading title={first.category.name} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      {items.slice(0, 4).map((post, index) => (
                        <PostCard
                          key={post.id}
                          href={`/${post.category.slug}/${post.slug}`}
                          title={post.title}
                          excerpt={post.excerpt}
                          imageUrl={post.thumbnailUrl}
                          date={post.publishedAt}
                          categoryName={post.category.name}
                          compact={index > 1}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </section>
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
            <LunarCalendarWidget />
            <AiWeatherWidget />
          </aside>
        </div>
      </main>

      <nav className="bg-red-700">
        <ul className="mx-auto flex w-full max-w-7xl min-w-max items-center gap-8 overflow-x-auto px-4 py-3 text-xl font-bold text-white md:px-6">
          {navCategories.map((item) => (
            <li key={`bottom-${item.slug}`}>
              <Link
                href={`/${item.slug}`}
                className="border-b-2 border-transparent pb-1 leading-none transition hover:border-white/90 hover:text-white/90"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <SiteFooter />

      <div className="mx-auto w-full max-w-7xl px-4 pb-8 md:px-6">
        <AdPlaceholder label="Bottom page ad (Google AdSense)" className="min-h-24" />
      </div>
    </div>
  )
}
