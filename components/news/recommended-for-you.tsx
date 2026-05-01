import { Skeleton } from "@/components/ui/boneyard-skeleton"
import { PostCardList, type PostListItem } from "./post-card-list"
import { SectionHeading } from "./section-heading"

type RecommendedForYouProps = {
  posts: PostListItem[]
  loading?: boolean
}

export function RecommendedForYou({ posts, loading }: RecommendedForYouProps) {
  if (!loading && posts.length === 0) return null

  return (
    <Skeleton name="recommended-for-you" loading={loading}>
      <section className="space-y-4 pt-4">
        <SectionHeading title="Dành cho bạn" />
        <PostCardList posts={posts} />
      </section>
    </Skeleton>
  )
}
