import { Suspense, type ReactNode } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"

import { AdPlaceholder } from "@/components/news/ad-placeholder"
import { ClientSideWidgets } from "@/components/news/client-side-widgets"
import { CommentForm } from "@/components/news/comment-form"
import { MostRead } from "@/components/news/most-read"
import { PostCard } from "@/components/news/post-card"
import { SocialShare } from "@/components/news/social-share"
import { ViewTracker } from "@/components/news/view-tracker"
import { SiteMainContainer } from "@/components/news/site-main-container"
import { SiteFooter } from "@/components/news/site-footer"
import { SiteHeader } from "@/components/news/site-header"
import { SectionHeading } from "@/components/news/section-heading"
import type { PostListItem as PostCardListItem } from "@/components/news/post-card-list"
import type { CategoryWithChildren } from "@/lib/queries"

type ArticleListItem = {
  id: string
  title: string
  excerpt: string
  slug: string
  thumbnailUrl: string | null
  publishedAt: Date | string | null
  category: {
    slug: string
    name?: string
  }
}

type TrendingListItem = ArticleListItem & {
  views: number
  category: {
    slug: string
    name: string
  }
}

type VideoListItem = {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  views: number
  category: {
    slug: string
  }
}

const RecommendedForYou = dynamic(
  () =>
    import("@/components/news/recommended-for-you").then(
      (mod) => mod.RecommendedForYou
    ),
  { loading: () => <div className="h-60 animate-pulse rounded-lg bg-zinc-100" /> }
)

const VideoMostWatched = dynamic(
  () =>
    import("@/components/news/video-most-watched").then(
      (mod) => mod.VideoMostWatched
    ),
  { loading: () => <div className="h-80 animate-pulse rounded-lg bg-zinc-100" /> }
)

type ArticlePageShellProps = {
  navCategories: CategoryWithChildren[]
  article: {
    id: string
    title: string
    excerpt: string
    penName: string | null
    thumbnailUrl: string | null
    videoEmbedUrl: string | null
    category: {
      name: string
      slug: string
    }
    comments: Array<{
      id: string
      authorName: string
      content: string
    }>
  }
  articleHtml: string
  fullUrl: string
  trendingPosts: TrendingListItem[]
  relatedPosts: ArticleListItem[]
  recommendedPosts: PostCardListItem[]
  mostWatchedVideos: VideoListItem[]
  dateValue: Date | string | null
  topBanner?: ReactNode
  metadataNodes?: ReactNode
  showViewTracker?: boolean
  showSocialShare?: boolean
  showAds?: boolean
  commentFormMode?: "live" | "preview" | "hidden"
}

function renderCommentForm(
  mode: ArticlePageShellProps["commentFormMode"],
  postId: string
) {
  if (mode === "live") {
    return <CommentForm postId={postId} currentUser={null} />
  }

  if (mode === "preview") {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-sm text-zinc-700">
        Bản xem trước dùng layout bài báo thật, nhưng chưa mở gửi bình luận.
      </div>
    )
  }

  return null
}

function toDateValue(value: Date | string | null) {
  return value ? new Date(value) : null
}

export function ArticlePageShell({
  navCategories,
  article,
  articleHtml,
  fullUrl,
  trendingPosts,
  relatedPosts,
  recommendedPosts,
  mostWatchedVideos,
  dateValue,
  topBanner,
  metadataNodes,
  showViewTracker = false,
  showSocialShare = true,
  showAds = true,
  commentFormMode = "live",
}: ArticlePageShellProps) {
  return (
    <div className="min-h-screen bg-white">
      {topBanner}
      <SiteHeader navCategories={navCategories} />
      {showViewTracker ? <ViewTracker postId={article.id} /> : null}

      <SiteMainContainer className="grid gap-8 py-8 md:grid-cols-[1fr_320px]">
        <div className="relative">
          {showSocialShare ? (
            <div className="absolute -left-20 top-0 hidden h-full lg:block">
              <SocialShare
                title={article.title}
                url={fullUrl}
                variant="sidebar"
              />
            </div>
          ) : null}

          <article className="mx-auto flex w-full max-w-xl flex-col gap-6 font-serif">
            {metadataNodes}
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
              {showAds ? (
                <AdPlaceholder label="Dưới tiêu đề (Google AdSense)" />
              ) : null}
              <p className="text-xl font-bold leading-relaxed text-zinc-950">
                {article.excerpt.trim()}
              </p>
              <p className="text-sm text-black">
                {dateValue ? new Date(dateValue).toLocaleString("vi-VN") : ""}
              </p>
            </header>

            <Image
              src={article.thumbnailUrl || "/placeholder-news.svg"}
              alt={article.title}
              width={1200}
              height={700}
              className="aspect-[12/7] h-auto w-full border border-zinc-200 object-cover"
              priority
            />

            {showAds ? (
              <AdPlaceholder label="Sau ảnh bài viết (Google AdSense)" />
            ) : null}

            <div
              className="article-content ck-content max-w-none text-black"
              dangerouslySetInnerHTML={{ __html: articleHtml }}
            />

            {article.penName ? (
              <div className="mt-4 text-right text-zinc-900">
                {article.penName}
              </div>
            ) : null}

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

            {showAds ? (
              <AdPlaceholder label="Sau video nội dung (Google AdSense)" />
            ) : null}

            {showSocialShare ? (
              <SocialShare title={article.title} url={fullUrl} />
            ) : null}

            {showAds ? (
              <AdPlaceholder label="Sau bài viết (Google AdSense)" />
            ) : null}

            <section className="space-y-3 border border-zinc-200 bg-zinc-50 p-4">
              <h2 className="text-xl font-bold">Bình luận gần đây</h2>
              {article.comments.length === 0 ? (
                <p className="text-sm text-black">
                  Chưa có bình luận hiển thị.
                </p>
              ) : (
                article.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border border-zinc-200 bg-white p-3"
                  >
                    <p className="text-sm font-semibold">{comment.authorName}</p>
                    <p className="text-sm text-black">{comment.content}</p>
                  </div>
                ))
              )}
            </section>

            {showAds ? (
              <AdPlaceholder label="Trước form bình luận (Google AdSense)" />
            ) : null}

            {renderCommentForm(commentFormMode, article.id)}

            <Suspense
              fallback={<div className="h-60 animate-pulse rounded-lg bg-zinc-100" />}
            >
              <RecommendedForYou posts={recommendedPosts} />
            </Suspense>

            {showAds ? (
              <AdPlaceholder label="Giữa các cụm liên quan (Google AdSense)" />
            ) : null}

            <Suspense
              fallback={<div className="h-80 animate-pulse rounded-lg bg-zinc-100" />}
            >
              <VideoMostWatched posts={mostWatchedVideos} />
            </Suspense>

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
                    date={toDateValue(trending.publishedAt)}
                    categoryName={trending.category.name}
                    compact
                  />
                ))}
              </div>
            </section>

            {showAds ? (
              <AdPlaceholder
                label="Sau cụm đọc nhiều (Google AdSense)"
                className="min-h-24"
              />
            ) : null}

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
                    date={toDateValue(related.publishedAt)}
                    compact
                  />
                ))}
              </div>
            </section>
          </article>
        </div>

        <aside className="flex flex-col gap-4">
          {showAds ? (
            <>
              <AdPlaceholder
                label="Sidebar (Google AdSense)"
                className="min-h-44"
              />
              <AdPlaceholder
                label="Sidebar thứ 2 (Google AdSense)"
                className="min-h-40"
              />
            </>
          ) : null}

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

          {showAds ? (
            <AdPlaceholder
              label="Sidebar giữa tiện ích (Google AdSense)"
              className="min-h-40"
            />
          ) : null}

          <ClientSideWidgets />

          {showAds ? (
            <AdPlaceholder
              label="Sidebar cuối bài (Google AdSense)"
              className="min-h-40"
            />
          ) : null}
        </aside>
      </SiteMainContainer>

      <SiteFooter navCategories={navCategories} />
    </div>
  )
}
