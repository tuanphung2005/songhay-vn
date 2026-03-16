import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

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
import { getPostByCategoryAndSlug, getRelatedPosts, getTrendingPosts } from "@/lib/queries"

export const revalidate = 300

type PostPageProps = {
  params: Promise<{ category: string; slug: string }>
}

function normalizeArticleHtml(rawHtml: string) {
  return rawHtml
    .replace(/<span([^>]*)style="([^"]*)"([^>]*)>([\s\S]*?)<\/span>/gi, (_match, _before, styleValue, _after, content) => {
      let result = String(content)

      if (/text-decoration\s*:\s*underline/i.test(styleValue)) {
        result = `<u>${result}</u>`
      }

      if (/text-decoration\s*:\s*line-through/i.test(styleValue)) {
        result = `<s>${result}</s>`
      }

      return result
    })
    .replace(/\sstyle="([^"]*)"/gi, (_match, styleValue) => {
      const rules = String(styleValue)
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean)

      const keptRules: string[] = []

      for (const rule of rules) {
        const [rawProperty, rawValue] = rule.split(":")
        const property = rawProperty?.trim().toLowerCase()
        const value = rawValue?.trim().toLowerCase()

        if (!property || !value) {
          continue
        }

        if (property === "text-align" && ["left", "right", "center", "justify"].includes(value)) {
          keptRules.push(`text-align:${value}`)
        }

        if (property === "float" && ["left", "right", "none"].includes(value)) {
          keptRules.push(`float:${value}`)
        }

        if (
          ["width", "max-width", "height"].includes(property) &&
          /^(auto|\d+(\.\d+)?(px|%))$/i.test(value)
        ) {
          keptRules.push(`${property}:${value}`)
        }
      }

      return keptRules.length ? ` style="${keptRules.join(";")}"` : ""
    })
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?\s*>)*<\/p>/gi, "")
    .trim()
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { category, slug } = await params
  const post = await getPostByCategoryAndSlug(category, slug)

  if (!post) {
    return {
      title: "Không tìm thấy bài viết",
    }
  }

  const title = post.seoTitle || post.title
  const description = post.seoDescription || post.excerpt

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: post.ogImage || post.thumbnailUrl ? [post.ogImage || post.thumbnailUrl || ""] : [],
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { category, slug } = await params
  const post = await getPostByCategoryAndSlug(category, slug)

  if (!post) {
    notFound()
  }

  const article = post!

  const [relatedPosts, trendingPosts] = await Promise.all([
    getRelatedPosts(article.id, article.categoryId),
    getTrendingPosts(),
  ])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://songhay.vn"
  const fullUrl = `${siteUrl}/${article.category.slug}/${article.slug}`
  const articleHtml = normalizeArticleHtml(article.content)
  const articleImage = article.ogImage || article.thumbnailUrl || `${siteUrl}/placeholder-news.svg`

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
        url: `${siteUrl}/placeholder-news.svg`,
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
            className="prose prose-zinc max-w-none text-zinc-800 [&:after]:block [&:after]:clear-both [&:after]:content-[''] [&_h1]:text-3xl [&_h1]:font-black [&_h1]:leading-tight [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-bold [&_u]:underline [&_s]:line-through [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:object-contain [&_img]:rounded-md"
            dangerouslySetInnerHTML={{ __html: articleHtml }}
          />

          <AdPlaceholder label="In-article ad (Google AdSense)" className="min-h-24" />

          {article.videoEmbedUrl ? (
            <div className="overflow-hidden border border-zinc-200">
              <iframe
                src={article.videoEmbedUrl}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}

          <SocialShare title={article.title} url={fullUrl} />

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

          <section className="space-y-4">
            <h2 className="text-2xl font-extrabold">Related posts</h2>
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
