import { SiteFooter } from "@/components/news/site-footer"
import { SiteHeader } from "@/components/news/site-header"
import { SiteMainContainer } from "@/components/news/site-main-container"

export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <SiteMainContainer className="space-y-6 py-8">
        <div className="h-8 w-56 animate-pulse bg-zinc-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-3 border border-zinc-200 p-3">
              <div className="h-40 w-full animate-pulse bg-zinc-200" />
              <div className="h-5 w-4/5 animate-pulse bg-zinc-200" />
              <div className="h-4 w-full animate-pulse bg-zinc-100" />
              <div className="h-4 w-3/4 animate-pulse bg-zinc-100" />
            </div>
          ))}
        </div>
      </SiteMainContainer>
      <SiteFooter />
    </div>
  )
}
