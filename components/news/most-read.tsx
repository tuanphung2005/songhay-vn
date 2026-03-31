"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

type MostReadItem = {
  id: string
  title: string
  thumbnailUrl?: string | null
  views: number
  slug: string
  categorySlug: string
}

type MostReadProps = {
  posts: MostReadItem[]
}

export function MostRead({ posts }: MostReadProps) {
  const [items, setItems] = useState(posts)

  useEffect(() => {
    let ignore = false

    async function loadMostRead() {
      try {
        const response = await fetch("/api/posts/most-read?limit=5", {
          method: "GET",
        })

        if (!response.ok || ignore) {
          return
        }

        const payload = (await response.json()) as {
          items: Array<{
            id: string
            title: string
            slug: string
            thumbnailUrl?: string | null
            views: number
            category: {
              slug: string
            }
          }>
        }

        setItems(
          payload.items.map((item) => ({
            id: item.id,
            title: item.title,
            thumbnailUrl: item.thumbnailUrl,
            views: item.views,
            slug: item.slug,
            categorySlug: item.category.slug,
          }))
        )
      } catch {
        // Keep initial server-rendered items if API request fails.
      }
    }

    void loadMostRead()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <section className="space-y-3 rounded-sm border border-zinc-300 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-bold text-zinc-900">Đọc nhiều nhất</h3>
      <ul className="space-y-3">
        {items.slice(0, 5).map((post) => (
          <li key={post.id} className="flex gap-3 border-b border-zinc-200 pb-3 last:border-b-0 last:pb-0">
            <Image
              src={post.thumbnailUrl || "/placeholder-news.svg"}
              alt={post.title}
              width={120}
              height={80}
              loading="lazy"
              className="h-16 w-24 flex-shrink-0 rounded-sm object-cover"
            />
            <div className="flex-1 space-y-1">
              <Link
                href={`/${post.categorySlug}/${post.slug}`}
                className="line-clamp-2 text-sm font-bold leading-snug text-zinc-800 transition hover:text-rose-600"
              >
                {post.title}
              </Link>
              <p className="text-xs text-zinc-500">{post.views.toLocaleString("vi-VN")} lượt xem</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
