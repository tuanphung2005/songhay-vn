import React from "react"
import { PostCard } from "./post-card"
import { AdPlaceholder } from "./ad-placeholder"

import type { PostCompact as PostListItem } from "@/types/post"
export type { PostListItem }

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
        <React.Fragment key={post.id}>
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
            <div className="py-4 border-b border-zinc-200">
              <AdPlaceholder label={adLabel || "Google AdSense"} className="min-h-24" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
