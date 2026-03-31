import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"

import { AdPlaceholder } from "@/components/news/ad-placeholder"
import { AiWeatherWidget } from "@/components/news/ai-weather-widget"
import { CommentForm } from "@/components/news/comment-form"
import { LunarCalendarWidget } from "@/components/news/lunar-calendar-widget"
import { MostRead } from "@/components/news/most-read"
import { PostCard } from "@/components/news/post-card"
import { JsonLd } from "@/components/seo/json-ld"
import { SocialShare } from "@/components/news/social-share"
import { ViewTracker } from "@/components/news/view-tracker"
import { SiteFooter } from "@/components/news/site-footer"
import { SiteHeader } from "@/components/news/site-header"
import { RecommendedForYou } from "@/components/news/recommended-for-you"
import { VideoMostWatched } from "@/components/news/video-most-watched"
import { SectionHeading } from "@/components/news/section-heading"
import { getPostByCategoryAndSlug, getRelatedPosts, getTrendingPosts, getMostWatchedVideos, getRecommendedPosts } from "@/lib/queries"
import { injectInlineAdAfterSecondParagraph, normalizeArticleHtml } from "@/lib/html"
import { DEFAULT_OG_IMAGE_PATH, getSiteUrl, toAbsoluteUrl } from "@/lib/seo"

export const revalidate = 300

const getPost = cache(async (category: string, slug: string) => getPostByCategoryAndSlug(category, slug))

type PostPageProps = {
  params: Promise<{ category: string; slug: string }>
}

// Shared logic in lib/html.ts

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { category, slug } = await params
  const post = await getPost(category, slug)
  const siteUrl = getSiteUrl()

  if (!post) {
    return {
      title: "Không tìm thấy bài viết",
    }
  }

  const title = post.seoTitle || post.title
  const description = post.seoDescription || post.excerpt
  const canonicalPath = `/${post.category.slug}/${post.slug}`
  const canonicalUrl = `${siteUrl}${canonicalPath}`
  const imageUrl = toAbsoluteUrl(post.ogImage || post.thumbnailUrl || DEFAULT_OG_IMAGE_PATH)

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalUrl,
      images: [imageUrl],
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      section: post.category.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { category, slug } = await params
  const post = await getPost(category, slug)

  if (!post) {
    notFound()
  }

  const article = post!

  const [relatedPosts, trendingPosts, mostWatchedVideos, recommendedPosts] = await Promise.all([
    getRelatedPosts(article.id, article.categoryId, 12),
    getTrendingPosts(),
    getMostWatchedVideos(8),
    getRecommendedPosts(article.id, article.categoryId, 12),
  ])

  const siteUrl = getSiteUrl()
  const fullUrl = `${siteUrl}/${article.category.slug}/${article.slug}`
  const articleHtml = injectInlineAdAfterSecondParagraph(
    normalizeArticleHtml(article.content),
    "Giữa bài viết (Google AdSense)"
  )
  const articleImage = toAbsoluteUrl(article.ogImage || article.thumbnailUrl || DEFAULT_OG_IMAGE_PATH)

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${fullUrl}#article`,
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    inLanguage: "vi-VN",
    articleSection: article.category.name,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": fullUrl,
    },
    image: [articleImage],
    author: {
      "@type": "Organization",
      "@id": `${siteUrl}#organization`,
      name: "Songhay.vn",
    },
    publisher: {
      "@id": `${siteUrl}#organization`,
      logo: {
        "@type": "ImageObject",
        url: toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH),
      },
    },
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang chu",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: article.category.name,
        item: `${siteUrl}/${article.category.slug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: fullUrl,
      },
    ],
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <ViewTracker postId={article.id} />

      <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 md:grid-cols-[1fr_320px] md:px-6">
        <article className="space-y-6">
          <JsonLd data={[articleJsonLd, breadcrumbJsonLd]} />
          <header className="space-y-3">
            <Link href={`/${article.category.slug}`} className="text-sm font-bold text-rose-600">
              {article.category.name}
            </Link>
            <h1 className="text-4xl font-black leading-tight text-zinc-900">{article.title}</h1>
            <AdPlaceholder label="Dưới tiêu đề (Google AdSense)" className="mx-auto min-h-20 max-w-2xl" />
            <p className="text-lg text-zinc-600">{article.excerpt}</p>
            <p className="text-sm text-zinc-500">{new Date(article.publishedAt).toLocaleString("vi-VN")}</p>
          </header>

          <Image
            src={article.thumbnailUrl || "/placeholder-news.svg"}
            alt={article.title}
            width={1280}
            height={720}
            className="h-auto w-full border border-zinc-200 object-cover"
            priority
          />

          <div
            className="article-content ck-content max-w-none text-zinc-800"
            dangerouslySetInnerHTML={{ __html: articleHtml }}
          />

          {article.videoEmbedUrl ? (
            <div className="overflow-hidden border border-zinc-200">
              <iframe
                src={article.videoEmbedUrl}
                title={`Video cho bài viết: ${article.title}`}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}

          <SocialShare title={article.title} url={fullUrl} />

          <AdPlaceholder label="Sau bài viết (Google AdSense)" className="min-h-24" />

          <section className="space-y-3 border border-zinc-200 bg-zinc-50 p-4">
            <h2 className="text-xl font-bold">Bình luận gần đây</h2>
            {article.comments.length === 0 ? (
              <p className="text-sm text-zinc-600">Chưa có bình luận hiển thị.</p>
            ) : (
              article.comments.map((comment) => (
                <div key={comment.id} className="border border-zinc-200 bg-white p-3">
                  <p className="text-sm font-semibold">{comment.authorName}</p>
                  <p className="text-sm text-zinc-700">{comment.content}</p>
                </div>
              ))
            )}
          </section>

          <CommentForm postId={article.id} currentUser={null} />

          <RecommendedForYou posts={recommendedPosts} />

          <VideoMostWatched posts={mostWatchedVideos} />

          <section className="space-y-4">
            <SectionHeading title="Đọc nhiều nhất" />
            <div className="grid gap-4 sm:grid-cols-2">
              {trendingPosts.slice(0, 10).map((trending) => (
                <PostCard
                  key={trending.id}
                  href={`/${trending.category.slug}/${trending.slug}`}
                  title={trending.title}
                  excerpt={trending.excerpt}
                  imageUrl={trending.thumbnailUrl}
                  date={trending.publishedAt}
                  categoryName={trending.category.name}
                  compact
                />
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeading title="Đọc thêm" />
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedPosts.map((related) => (
                <PostCard
                  key={related.id}
                  href={`/${related.category.slug}/${related.slug}`}
                  title={related.title}
                  excerpt={related.excerpt}
                  imageUrl={related.thumbnailUrl}
                  date={related.publishedAt}
                  compact
                />
              ))}
            </div>
          </section>
        </article>

        <aside className="space-y-4">
          <AdPlaceholder label="Sidebar (Google AdSense)" className="min-h-44" />
          <MostRead
            posts={trendingPosts.map((post) => ({
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
      </main>

      <SiteFooter />
    </div>
  )
}
