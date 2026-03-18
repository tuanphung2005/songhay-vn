/* eslint-disable @next/next/no-img-element */
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AdPlaceholder } from "@/components/news/ad-placeholder"
import { AiWeatherWidget } from "@/components/news/ai-weather-widget"
import { LunarCalendarWidget } from "@/components/news/lunar-calendar-widget"
import { MostRead } from "@/components/news/most-read"
import { PostCard } from "@/components/news/post-card"
import { SiteFooter } from "@/components/news/site-footer"
import { SiteHeader } from "@/components/news/site-header"
import { requireCmsUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTrendingPosts } from "@/lib/queries"

export const revalidate = 0
export const metadata: Metadata = {
  title: "Xem trước bài viết",
  robots: { index: false, follow: false },
}

type PreviewPageProps = {
  params: Promise<{ id: string }>
}

function normalizeArticleHtml(rawHtml: string) {
  return rawHtml
    .replace(/<span([^>]*)style="([^"]*)"([^>]*)>([\s\S]*?)<\/span>/gi, (_match, _before, styleValue, _after, content) => {
      let result = String(content)
      if (/text-decoration\s*:\s*underline/i.test(styleValue)) result = `<u>${result}</u>`
      if (/text-decoration\s*:\s*line-through/i.test(styleValue)) result = `<s>${result}</s>`
      return result
    })
    .replace(/\sstyle="([^"]*)"/gi, (_match, styleValue) => {
      const rules = String(styleValue).split(";").map((s) => s.trim()).filter(Boolean)
      const kept: string[] = []
      for (const rule of rules) {
        const [rawProp, rawVal] = rule.split(":")
        const p = rawProp?.trim().toLowerCase()
        const v = rawVal?.trim().toLowerCase()
        if (!p || !v) continue
        if (p === "text-align" && ["left", "right", "center", "justify"].includes(v)) kept.push(`text-align:${v}`)
        if (p === "float" && ["left", "right", "none"].includes(v)) kept.push(`float:${v}`)
        if (p === "color" && /^#[0-9a-f]{3,8}$|^rgb\([\d\s,.%]+\)$|^rgba\([\d\s,.%]+\)$|^[a-z-]+$/i.test(v)) kept.push(`color:${v}`)
        if (p === "background-color" && /^#[0-9a-f]{3,8}$|^rgb\([\d\s,.%]+\)$|^rgba\([\d\s,.%]+\)$|^[a-z-]+$/i.test(v)) kept.push(`background-color:${v}`)
        if (p === "font-size" && /^(\d+(\.\d+)?(px|em|rem|%)|small|medium|large|x-large|xx-large)$/i.test(v)) kept.push(`font-size:${v}`)
        if (p === "font-family" && /^[a-z0-9\s\-,'\"]+$/i.test(v)) kept.push(`font-family:${v}`)
        if (p === "text-decoration" && /^(underline|line-through|none)$/i.test(v)) kept.push(`text-decoration:${v}`)
        if (["width", "max-width", "height"].includes(p) && /^(auto|\d+(\.\d+)?(px|%))$/i.test(v)) kept.push(`${p}:${v}`)
      }
      return kept.length ? ` style="${kept.join(";")}"` : ""
    })
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?\ *>)*<\/p>/gi, "")
    .trim()
}

export default async function AdminPreviewPage({ params }: PreviewPageProps) {
  await requireCmsUser()

  const { id } = await params

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      category: { select: { name: true, slug: true } },
      author: { select: { name: true, email: true } },
    },
  })

  if (!post) {
    redirect("/admin?tab=personal-archive")
  }

  const [relatedPosts, trendingPosts] = await Promise.all([
    prisma.post.findMany({
      where: {
        categoryId: post.categoryId,
        id: { not: post.id },
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        title: true,
        excerpt: true,
        slug: true,
        thumbnailUrl: true,
        publishedAt: true,
        category: { select: { slug: true } },
      },
    }),
    getTrendingPosts(),
  ])

  const articleHtml = normalizeArticleHtml(post.content)

  return (
    <div className="min-h-screen bg-white">
      {/* Preview banner */}
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="rounded bg-amber-400 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-900">
            Chế độ xem trước
          </span>
          <span className="text-amber-800">
            Bài viết này chưa được xuất bản — đây là giao diện mô phỏng trang thật.
          </span>
        </div>
        <Link
          href={`/admin/edit/${post.id}`}
          className="shrink-0 rounded border border-amber-400 bg-white px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
        >
          ← Quay lại sửa bài
        </Link>
      </div>

      <SiteHeader />

      <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 md:grid-cols-[1fr_320px] md:px-6">
        <article className="space-y-6">
          <header className="space-y-3">
            <Link href={`/${post.category.slug}`} className="text-sm font-bold text-rose-600">
              {post.category.name}
            </Link>
            <h1 className="text-4xl font-black leading-tight text-zinc-900">{post.title}</h1>
            <p className="text-lg text-zinc-600">{post.excerpt}</p>
            <p className="text-sm text-zinc-500">{new Date(post.updatedAt).toLocaleString("vi-VN")}</p>
          </header>

          <Image
            src={post.thumbnailUrl || "/placeholder-news.svg"}
            alt={post.title}
            width={1280}
            height={720}
            className="h-auto w-full border border-zinc-200 object-cover"
            priority
          />

          <div
            className="article-content ck-content max-w-none text-zinc-800"
            dangerouslySetInnerHTML={{ __html: articleHtml }}
          />

          <AdPlaceholder label="In-article ad (Google AdSense)" className="min-h-24" />

          {post.videoEmbedUrl ? (
            <div className="overflow-hidden border border-zinc-200">
              <iframe
                src={post.videoEmbedUrl}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}

          {relatedPosts.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-2xl font-extrabold">Bài viết liên quan</h2>
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
          ) : null}
        </article>

        <aside className="space-y-4">
          <MostRead
            posts={trendingPosts.map((p) => ({
              id: p.id,
              title: p.title,
              thumbnailUrl: p.thumbnailUrl,
              views: p.views,
              slug: p.slug,
              categorySlug: p.category.slug,
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
