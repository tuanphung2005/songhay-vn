import { PostCardList, type PostListItem } from "./post-card-list"
import { SectionHeading } from "./section-heading"

type RecommendedForYouProps = {
  posts: PostListItem[]
}

export function RecommendedForYou({ posts }: RecommendedForYouProps) {
  if (posts.length === 0) return null

  return (
    <section className="space-y-4 pt-4">
      <SectionHeading title="Dành cho bạn" />
      <PostCardList posts={posts} />
    </section>
  )
}
