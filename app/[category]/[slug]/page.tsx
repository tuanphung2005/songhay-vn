import { Suspense } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"

import { AdPlaceholder } from "@/components/news/ad-placeholder"
const RecommendedForYou = dynamic(
  () => import("@/components/news/recommended-for-you").then((mod) => mod.RecommendedForYou),
  { loading: () => <div className="h-60 animate-pulse rounded-lg bg-zinc-100" /> }
)
const VideoMostWatched = dynamic(
  () => import("@/components/news/video-most-watched").then((mod) => mod.VideoMostWatched),
  { loading: () => <div className="h-80 animate-pulse rounded-lg bg-zinc-100" /> }
)
import { ClientSideWidgets } from "@/components/news/client-side-widgets"
import { CommentForm } from "@/components/news/comment-form"
import { MostRead } from "@/components/news/most-read"
import { PostCard } from "@/components/news/post-card"
import { JsonLd } from "@/components/seo/json-ld"
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd"
import { SocialShare } from "@/components/news/social-share"
import { ViewTracker } from "@/components/news/view-tracker"
import { SiteMainContainer } from "@/components/news/site-main-container"
import { SiteFooter } from "@/components/news/site-footer"
import { SiteHeader } from "@/components/news/site-header"
import { SectionHeading } from "@/components/news/section-heading"
import {
  getPostByCategoryAndSlug,
  getRelatedPosts,
  getTrendingPosts,
  getMostWatchedVideos,
  getRecommendedPosts,
  getLatestPostsForSsg,
  getNavCategories,
  type PostWithCategoryAndComments,
} from "@/lib/queries"
import {
  injectInlineAdAfterSecondParagraph,
  normalizeArticleHtml,
} from "@/lib/html"
import { buildAutoSeoDescription, buildAutoSeoTitle } from "@/lib/post-seo"
import { DEFAULT_OG_IMAGE_PATH, getSiteUrl, toAbsoluteUrl } from "@/lib/seo"

export const revalidate = 3600

const getPost = cache(async (category: string, slug: string) =>
  getPostByCategoryAndSlug(category, slug)
)

type PostPageProps = {
  params: Promise<{ category: string; slug: string }>
}

export async function generateStaticParams() {
  const latestPosts = await getLatestPostsForSsg(50)
  return latestPosts.map((post) => ({
    category: post.category.slug,
    slug: post.slug,
  }))
}

// Shared logic in lib/html.ts

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { category, slug } = await params
  const post = await getPost(category, slug)
  const siteUrl = getSiteUrl()

  if (!post) {
    return {
      title: "Không tìm thấy bài viết",
    }
  }

  const title =
    post.seoTitle ||
    buildAutoSeoTitle({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
    }) ||
    post.title
  const description =
    post.seoDescription ||
    buildAutoSeoDescription({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
    }) ||
    post.excerpt
  const canonicalPath = `/${post.category.slug}/${post.slug}`
  const canonicalUrl = `${siteUrl}${canonicalPath}`
  const imageUrl = toAbsoluteUrl(
    post.ogImage || post.thumbnailUrl || DEFAULT_OG_IMAGE_PATH
  )

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
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
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
  const [post, navCategories] = await Promise.all([
    getPost(category, slug),
    getNavCategories(),
  ])

  if (!post) {
    notFound()
  }

  const article = post!

  const [relatedPosts, trendingPosts, mostWatchedVideos, recommendedPosts] =
    await Promise.all([
      getRelatedPosts(article.id, article.categoryId, 12),
      getTrendingPosts(),
      getMostWatchedVideos(8),
      getRecommendedPosts(article.id, article.categoryId, 12),
    ])

  const siteUrl = getSiteUrl()
  const fullUrl = `${siteUrl}/${article.category.slug}/${article.slug}`
  const articleHtml = injectInlineAdAfterSecondParagraph(
    normalizeArticleHtml(article.content)
  )
  const articleImage = toAbsoluteUrl(
    article.ogImage || article.thumbnailUrl || DEFAULT_OG_IMAGE_PATH
  )

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${fullUrl}#article`,
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt ? new Date(article.publishedAt).toISOString() : null,
    dateModified: article.updatedAt ? new Date(article.updatedAt).toISOString() : null,
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

  const breadcrumbItems = [
    { name: "Trang chủ", url: siteUrl },
    { name: article.category.name, url: `${siteUrl}/${article.category.slug}` },
    { name: article.title, url: fullUrl },
  ]

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader navCategories={navCategories} />
      <ViewTracker postId={article.id} />

      <SiteMainContainer className="grid gap-8 py-8 md:grid-cols-[1fr_320px]">
        <article className="flex flex-col gap-6">
          <JsonLd data={[articleJsonLd]} />
          <BreadcrumbJsonLd items={breadcrumbItems} />
          <header className="flex flex-col gap-3">
            <Link
              href={`/${article.category.slug}`}
              className="text-sm font-bold text-rose-600"
            >
              {article.category.name}
            </Link>
            <h1 className="text-4xl leading-tight font-black text-zinc-900">
              {article.title}
            </h1>
            <AdPlaceholder
              label="Dưới tiêu đề (Google AdSense)"
              className="mx-auto max-w-2xl"
            />
            <p className="text-lg text-zinc-600">{article.excerpt}</p>
            <p className="text-sm text-zinc-500">
              {new Date(article.publishedAt).toLocaleString("vi-VN")}
            </p>
          </header>

          <Image
            src={article.thumbnailUrl || "/placeholder-news.svg"}
            alt={article.title}
            width={1200}
            height={700}
            className="h-auto w-full border border-zinc-200 object-cover aspect-[12/7]"
            priority
          />

          <AdPlaceholder
            label="Sau ảnh bài viết (Google AdSense)"
          />

          <div
            className="article-content ck-content max-w-none text-zinc-800"
            dangerouslySetInnerHTML={{ __html: articleHtml }}
          />

          {article.penName && (
            <div className="mt-4 text-right text-zinc-900">
              {article.penName}
            </div>
          )}

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

          <AdPlaceholder
            label="Sau video nội dung (Google AdSense)"
          />

          <SocialShare title={article.title} url={fullUrl} />

          <AdPlaceholder
            label="Sau bài viết (Google AdSense)"
          />

          <section className="space-y-3 border border-zinc-200 bg-zinc-50 p-4">
            <h2 className="text-xl font-bold">Bình luận gần đây</h2>
            {article.comments.length === 0 ? (
              <p className="text-sm text-zinc-600">
                Chưa có bình luận hiển thị.
              </p>
            ) : (
              article.comments.map((comment: PostWithCategoryAndComments['comments'][number]) => (
                <div
                  key={comment.id}
                  className="border border-zinc-200 bg-white p-3"
                >
                  <p className="text-sm font-semibold">{comment.authorName}</p>
                  <p className="text-sm text-zinc-700">{comment.content}</p>
                </div>
              ))
            )}
          </section>

          <AdPlaceholder
            label="Trước form bình luận (Google AdSense)"
          />

          <CommentForm postId={article.id} currentUser={null} />

          <Suspense fallback={<div className="h-60 animate-pulse rounded-lg bg-zinc-100" />}>
            <RecommendedForYou posts={recommendedPosts} />
          </Suspense>
          <AdPlaceholder
            label="Giữa các cụm liên quan (Google AdSense)"
          />
          <Suspense fallback={<div className="h-80 animate-pulse rounded-lg bg-zinc-100" />}>
            <VideoMostWatched posts={mostWatchedVideos} />
          </Suspense>

          <section className="space-y-4">
            <SectionHeading title="Đọc nhiều nhất" />
            <div className="grid gap-4 sm:grid-cols-2">
              {trendingPosts.slice(0, 10).map((trending: PostWithCategoryAndComments) => (
                <PostCard
                  key={trending.id}
                  href={`/${trending.category.slug}/${trending.slug}`}
                  title={trending.title}
                  excerpt={trending.excerpt}
                  imageUrl={trending.thumbnailUrl}
                  date={trending.publishedAt}
                  categoryName={trending.category.name}
                  compact={true}
                />
              ))}
            </div>
          </section>

          <AdPlaceholder
            label="Sau cụm đọc nhiều (Google AdSense)"
            className="min-h-24"
          />

          <section className="space-y-4">
            <SectionHeading title="Đọc thêm" />
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedPosts.map((related: PostWithCategoryAndComments) => (
                <PostCard
                  key={related.id}
                  href={`/${related.category.slug}/${related.slug}`}
                  title={related.title}
                  excerpt={related.excerpt}
                  imageUrl={related.thumbnailUrl}
                  date={related.publishedAt}
                  compact={true}
                />
              ))}
            </div>
          </section>
        </article>

        <aside className="flex flex-col gap-4">
          <AdPlaceholder
            label="Sidebar (Google AdSense)"
            className="min-h-44"
          />
          <AdPlaceholder
            label="Sidebar thứ 2 (Google AdSense)"
            className="min-h-40"
          />
          <MostRead
            posts={trendingPosts.map((post: PostWithCategoryAndComments) => ({
              id: post.id,
              title: post.title,
              thumbnailUrl: post.thumbnailUrl,
              views: post.views,
              slug: post.slug,
              categorySlug: post.category.slug,
            }))}
          />
          <AdPlaceholder
            label="Sidebar giữa tiện ích (Google AdSense)"
            className="min-h-40"
          />
          <ClientSideWidgets />
          <AdPlaceholder
            label="Sidebar cuối bài (Google AdSense)"
            className="min-h-40"
          />
        </aside>
      </SiteMainContainer>

      <SiteFooter navCategories={navCategories} />
    </div>
  )
}
