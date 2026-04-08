import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

import { AdPlaceholder } from "@/components/news/ad-placeholder"
import { AiWeatherWidget } from "@/components/news/ai-weather-widget"
import { DontMissWidget } from "@/components/news/dont-miss-widget"
import { LunarCalendarWidget } from "@/components/news/lunar-calendar-widget"
import { MostRead } from "@/components/news/most-read"
import { PostCard } from "@/components/news/post-card"
import { SectionHeading } from "@/components/news/section-heading"
import { RecommendedForYou } from "@/components/news/recommended-for-you"
import { VideoMostWatched } from "@/components/news/video-most-watched"
import { SiteFooter } from "@/components/news/site-footer"
import { SiteHeader } from "@/components/news/site-header"
import { JsonLd } from "@/components/seo/json-ld"
import { getHomepageData, getNavCategories } from "@/lib/queries"
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
  const [
    { latest, mostRead, recommended, mostWatched, heroSlots = [] },
    navCategories,
  ] = await Promise.all([
    getHomepageData(),
    getNavCategories(),
  ])

  const heroPost = heroSlots[0]
  const heroMini = heroSlots.slice(1, 4)

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
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <JsonLd data={homepageJsonLd} />
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1100px] space-y-6 px-4 py-5 md:px-6 md:py-6">
        <AdPlaceholder label="Top banner (Google AdSense)" className="min-h-20" />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6">
        {/* ── MAGAZINE HERO SECTION ─────────────────────────────────── */}
        <section className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Featured (2/3 width) */}
            <div className="lg:col-span-2">
              {heroSlots[0] && (
                <PostCard
                  href={`/${heroSlots[0].category.slug}/${heroSlots[0].slug}`}
                  title={heroSlots[0].title}
                  excerpt={heroSlots[0].excerpt}
                  imageUrl={heroSlots[0].thumbnailUrl}
                  date={heroSlots[0].publishedAt}
                  categoryName={heroSlots[0].category.name}
                  variant="overlay"
                  className="h-full"
                  commentCount={heroSlots[0]._count.comments}
                />
              )}
            </div>

            {/* Sidebar Posts (1/3 width stacked) */}
            <div className="flex flex-col gap-6 lg:col-span-1">
              {heroSlots.slice(1, 3).map((post) => (
                <PostCard
                  key={post.id}
                  href={`/${post.category.slug}/${post.slug}`}
                  title={post.title}
                  imageUrl={post.thumbnailUrl}
                  date={post.publishedAt}
                  categoryName={post.category.name}
                  showExcerpt={false}
                  commentCount={post._count.comments}
                  className="lg:flex-col"
                  variant="horizontal"
                />
              ))}
            </div>
          </div>

          {/* Bottom Row (3 items) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:gap-6">
            {heroSlots.slice(3, 6).map((post) => (
              <PostCard
                key={post.id}
                href={`/${post.category.slug}/${post.slug}`}
                title={post.title}
                imageUrl={post.thumbnailUrl}
                date={post.publishedAt}
                categoryName={post.category.name}
                showExcerpt={false}
                aspectRatio="video"
                commentCount={post._count.comments}
                className="lg:flex-col"
                variant="horizontal"
              />
            ))}
          </div>
        </section>

              <AdPlaceholder label="Sau cụm nổi bật (Google AdSense)" className="min-h-20" />

              <section className="space-y-3">
                <SectionHeading title="Đừng bỏ lỡ!" />
                <DontMissWidget />
              </section>

            <section className="space-y-4">
              <SectionHeading title="Tin mới nhất" />
              <div className="flex flex-col border-t border-zinc-200">
                {latest.slice(0, 10).map((post) => (
                  <div key={post.id} className="border-b border-zinc-200 py-6 last:border-b-0">
                    <PostCard
                      href={`/${post.category.slug}/${post.slug}`}
                      title={post.title}
                      excerpt={post.excerpt}
                      imageUrl={post.thumbnailUrl}
                      date={post.publishedAt}
                      categoryName={post.category.name}
                      variant="horizontal"
                      commentCount={post._count.comments}
                    />
                  </div>
                ))}
              </div>
            </section>

            <AdPlaceholder label="Sau cụm tin mới (Google AdSense)" className="min-h-20" />

            <AdPlaceholder label="Giữa các cụm nội dung (Google AdSense)" className="min-h-20" />

            {/* Engagement Sections */}
            <RecommendedForYou posts={recommended} />
            <AdPlaceholder label="Giữa đề xuất và video (Google AdSense)" className="min-h-20" />
            <VideoMostWatched posts={mostWatched} />

            <section className="space-y-6 pt-6 border-t border-zinc-200">
              {categoryBlocks.map((items, index) => {
                const [first] = items
                return (
                  <div key={first.category.slug} className="space-y-4">
                    <SectionHeading title={first.category.name} />
                    <div className="flex flex-col border-t border-zinc-200">
                      {items.slice(0, 4).map((post) => (
                        <div key={post.id} className="border-b border-zinc-200 py-6 last:border-b-0">
                          <PostCard
                            href={`/${post.category.slug}/${post.slug}`}
                            title={post.title}
                            excerpt={post.excerpt}
                            imageUrl={post.thumbnailUrl}
                            date={post.publishedAt}
                            categoryName={post.category.name}
                            variant="horizontal"
                            commentCount={post._count.comments}
                          />
                        </div>
                      ))}
                    </div>
                    {(index + 1) % 2 === 0 ? (
                      <AdPlaceholder label="Giữa các cụm chuyên mục (Google AdSense)" className="min-h-24" />
                    ) : null}
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
            <AdPlaceholder label="Sidebar giữa widgets (Google AdSense)" className="min-h-40" />
            <LunarCalendarWidget />
            <AiWeatherWidget />
            <AdPlaceholder label="Sidebar cuối trang chủ (Google AdSense)" className="min-h-40" />
          </aside>
        </div>
      </main>

      <nav className="bg-red-700">
        <ul className="mx-auto grid w-full max-w-[1200px] grid-cols-2 gap-x-3 gap-y-2 px-4 py-4 text-base font-bold text-white md:flex md:min-w-max md:items-center md:gap-6 md:overflow-x-auto md:px-6 md:py-3">
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
