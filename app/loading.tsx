import { Skeleton } from "@/components/ui/boneyard-skeleton"
import { SiteFooter } from "@/components/news/site-footer"
import { SiteHeader } from "@/components/news/site-header"
import { SiteMainContainer } from "@/components/news/site-main-container"

export default function HomeLoading() {
  return (
    <Skeleton name="home-page" loading>
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <SiteHeader />
        <SiteMainContainer className="flex flex-col gap-6 py-5 md:py-6">
          <div className="h-40 w-full animate-pulse bg-zinc-100" />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="flex flex-col gap-6">
              <div className="h-96 w-full animate-pulse bg-zinc-200" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="h-40 animate-pulse bg-zinc-100" />
                <div className="h-40 animate-pulse bg-zinc-100" />
                <div className="h-40 animate-pulse bg-zinc-100" />
              </div>
            </div>
            <aside className="space-y-4">
              <div className="h-64 w-full animate-pulse bg-zinc-100" />
              <div className="h-96 w-full animate-pulse bg-zinc-100" />
            </aside>
          </div>
        </SiteMainContainer>
        <SiteFooter />
      </div>
    </Skeleton>
  )
}
