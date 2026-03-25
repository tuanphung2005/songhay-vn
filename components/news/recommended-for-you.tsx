import Link from "next/link"
import Image from "next/image"
import { PostCard } from "./post-card"
import { SectionHeading } from "./section-heading"

type RecommendedPost = {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  excerpt: string
  publishedAt: Date
  category: {
    name: string
    slug: string
  }
}

type RecommendedForYouProps = {
  posts: RecommendedPost[]
}

export function RecommendedForYou({ posts }: RecommendedForYouProps) {
  if (posts.length === 0) return null

  return (
    <section className="space-y-4 pt-6">
      <SectionHeading title="Dành cho bạn" />
      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            href={`/${post.category.slug}/${post.slug}`}
            title={post.title}
            excerpt={post.excerpt}
            imageUrl={post.thumbnailUrl}
            date={post.publishedAt}
            categoryName={post.category.name}
            compact
          />
        ))}
      </div>
    </section>
  )
}
