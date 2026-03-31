import Image from "next/image"
import Link from "next/link"

type PostCardProps = {
  href: string
  title: string
  excerpt: string
  imageUrl?: string | null
  date?: Date
  categoryName?: string
  compact?: boolean
}

export function PostCard({
  href,
  title,
  excerpt,
  imageUrl,
  date,
  categoryName,
  compact = false,
}: PostCardProps) {
  return (
    <article className="group overflow-hidden rounded-sm border border-zinc-300 bg-white shadow-sm transition hover:shadow-md">
      <Link href={href} className="block overflow-hidden">
        <Image
          src={imageUrl || "/placeholder-news.svg"}
          alt={title}
          width={900}
          height={600}
          loading="lazy"
          className={compact ? "h-44 w-full object-cover transition duration-300 group-hover:scale-105" : "h-56 w-full object-cover transition duration-300 group-hover:scale-105"}
        />
      </Link>
      <div className="space-y-2 p-4">
        {categoryName ? (
          <p className="text-xs font-bold uppercase tracking-wide text-rose-600">{categoryName}</p>
        ) : null}
        <h3 className={compact ? "text-base font-bold leading-snug" : "text-lg font-bold leading-snug"}>
          <Link href={href} className="transition group-hover:text-rose-600">
            {title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-zinc-600">{excerpt}</p>
        {date ? <p className="text-xs text-zinc-500">{new Date(date).toLocaleDateString("vi-VN")}</p> : null}
      </div>
    </article>
  )
}
