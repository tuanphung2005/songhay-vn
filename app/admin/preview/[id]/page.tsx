/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireCmsUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const revalidate = 0
export const metadata: Metadata = {
  title: "Xem trước bài viết",
  robots: {
    index: false,
    follow: false,
  },
}

type PreviewPageProps = {
  params: Promise<{ id: string }>
}

function normalizeArticleHtml(rawHtml: string) {
  return rawHtml
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?\s*>)*<\/p>/gi, "")
    .trim()
}

export default async function AdminPreviewPage({ params }: PreviewPageProps) {
  await requireCmsUser()

  const { id } = await params

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
      author: {
        select: {
          name: true,
          email: true,
        },
      },
      approver: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (!post) {
    redirect("/admin?tab=personal-archive")
  }

  const articleHtml = normalizeArticleHtml(post.content)

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.12em]">Preview mode</p>
          <h1 className="text-2xl font-black text-zinc-900">Xem trước bài viết</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={post.isDraft ? "outline" : "default"}>{post.isDraft ? "Bản nháp" : "Sẵn sàng xuất bản"}</Badge>
          <Link href={`/admin/edit/${post.id}`}>
            <Button type="button" variant="secondary">Sửa bài</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{post.title}</CardTitle>
          <p className="text-muted-foreground text-sm">{post.excerpt}</p>
          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
            <span>Danh mục: {post.category.name}</span>
            <span>Người viết: {post.author?.name || "Không rõ"}</span>
            <span>Người duyệt: {post.approver?.name || "Chưa duyệt"}</span>
            <span>Cập nhật: {new Date(post.updatedAt).toLocaleString("vi-VN")}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {post.thumbnailUrl ? (
            <img
              src={post.thumbnailUrl}
              alt={post.title}
              className="h-auto w-full rounded border border-zinc-200 object-cover"
              loading="lazy"
            />
          ) : null}

          <div className="article-content ck-content max-w-none text-zinc-800" dangerouslySetInnerHTML={{ __html: articleHtml }} />

          {post.videoEmbedUrl ? (
            <div className="overflow-hidden rounded border border-zinc-200">
              <iframe
                src={post.videoEmbedUrl}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}
