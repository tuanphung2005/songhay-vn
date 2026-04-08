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
  _count: {
    comments: number
  }
}

type RecommendedForYouProps = {
  posts: RecommendedPost[]
}

export function RecommendedForYou({ posts }: RecommendedForYouProps) {
  if (posts.length === 0) return null

  return (
    <section className="space-y-4 pt-4">
      <SectionHeading title="Dành cho bạn" />
      <div className="flex flex-col border-t border-zinc-200">
        {posts.map((post) => (
          <div key={post.id} className="border-b border-zinc-200 py-6 last:border-b-0">
            <PostCard
              href={`/${post.category.slug}/${post.slug}`}
              title={post.title}
              excerpt={post.excerpt}
              imageUrl={post.thumbnailUrl}
              date={post.publishedAt}
              categoryName={post.category.name}
              variant="horizontal"
              showExcerpt={true}
              commentCount={post._count.comments}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
