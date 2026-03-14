import Image from "next/image"
import Link from "next/link"

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
  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="text-xl font-bold text-zinc-900">Tin đọc nhiều</h3>
      <ul className="space-y-3">
        {posts.slice(0, 5).map((post) => (
          <li key={post.id} className="flex gap-3 border-b border-zinc-100 pb-3 last:border-b-0 last:pb-0">
            <Image
              src={post.thumbnailUrl || "/placeholder-news.svg"}
              alt={post.title}
              width={120}
              height={80}
              loading="lazy"
              className="h-16 w-24 object-cover"
            />
            <div className="space-y-1">
              <Link
                href={`/${post.categorySlug}/${post.slug}`}
                className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-800 transition hover:text-rose-600"
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
