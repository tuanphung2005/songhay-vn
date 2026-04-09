import { PostCard } from "./post-card"
import { AdPlaceholder } from "./ad-placeholder"

export type PostListItem = {
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

type PostCardListProps = {
  posts: PostListItem[]
  adEvery?: number
  adLabel?: string
}

export function PostCardList({ posts, adEvery, adLabel }: PostCardListProps) {
  if (posts.length === 0) return null

  return (
    <div className="flex flex-col border-t border-zinc-200">
      {posts.map((post, index) => (
        <div key={post.id} className="contents">
          <div className="border-b border-zinc-200 py-6 last:border-b-0">
            <PostCard
              href={`/${post.category.slug}/${post.slug}`}
              title={post.title}
              excerpt={post.excerpt}
              imageUrl={post.thumbnailUrl}
              date={post.publishedAt}
              categoryName={post.category.name}
              variant="horizontal"
              commentCount={post._count.comments}
            />
          </div>
          {adEvery && (index + 1) % adEvery === 0 && index !== posts.length - 1 && (
            <div className="py-4">
              <AdPlaceholder label={adLabel || "Google AdSense"} className="min-h-24" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
