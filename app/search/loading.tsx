import { Skeleton } from "@/components/ui/boneyard-skeleton"
import { SiteMainContainer } from "@/components/news/site-main-container"

export default function SearchLoading() {
  return (
    <Skeleton name="search-page" loading>
      <SiteMainContainer className="space-y-4 py-8">
        <div className="h-8 w-56 animate-pulse rounded bg-zinc-200" />
        <div className="h-4 w-72 animate-pulse rounded bg-zinc-100" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden border border-zinc-200 bg-white">
              <div className="h-44 w-full animate-pulse bg-zinc-100" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-24 animate-pulse rounded bg-zinc-100" />
                <div className="h-5 w-full animate-pulse rounded bg-zinc-200" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-100" />
              </div>
            </div>
          ))}
        </div>
      </SiteMainContainer>
    </Skeleton>
  )
}
