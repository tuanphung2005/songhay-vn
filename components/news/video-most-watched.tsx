import Link from "next/link"
import Image from "next/image"
import { Play } from "lucide-react"
import { SectionHeading } from "./section-heading"

type VideoPost = {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  views: number
  category: {
    slug: string
  }
}

type VideoMostWatchedProps = {
  posts: VideoPost[]
}

export function VideoMostWatched({ posts }: VideoMostWatchedProps) {
  if (posts.length === 0) return null

  return (
    <section className="space-y-3 pt-4">
      <SectionHeading title="Video hot nhất" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/${post.category.slug}/${post.slug}`}
            className="group block space-y-2"
          >
            <div className="relative aspect-video overflow-hidden rounded-sm bg-zinc-100 border border-zinc-300">
              <Image
                src={post.thumbnailUrl || "/placeholder-news.svg"}
                alt={post.title}
                width={320}
                height={180}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg transition duration-300 group-hover:scale-110">
                  <Play className="h-6 w-6 fill-current ml-0.5" />
                </div>
              </div>
            </div>
            <p className="line-clamp-2 text-sm font-bold leading-snug text-zinc-800 transition group-hover:text-rose-600">
              {post.title}
            </p>
            <p className="text-xs text-zinc-500">
              {post.views.toLocaleString("vi-VN")} lượt xem
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
