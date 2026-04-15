import { SiteFooter } from "@/components/news/site-footer"
import { SiteHeader } from "@/components/news/site-header"
import { SiteMainContainer } from "@/components/news/site-main-container"

export default function PostLoading() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <SiteMainContainer className="grid gap-8 py-8 md:grid-cols-[1fr_320px]">
        <article className="space-y-6">
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse bg-zinc-200" />
            <div className="h-10 w-4/5 animate-pulse bg-zinc-200" />
            <div className="h-6 w-full animate-pulse bg-zinc-100" />
            <div className="h-4 w-1/3 animate-pulse bg-zinc-100" />
          </div>
          <div className="h-80 w-full animate-pulse border border-zinc-200 bg-zinc-100 md:h-105" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-4 w-full animate-pulse bg-zinc-100" />
            ))}
          </div>
        </article>

        <aside className="space-y-4">
          <div className="h-64 w-full animate-pulse border border-zinc-200 bg-zinc-100" />
          <div className="h-40 w-full animate-pulse border border-zinc-200 bg-zinc-100" />
          <div className="h-40 w-full animate-pulse border border-zinc-200 bg-zinc-100" />
        </aside>
      </SiteMainContainer>
      <SiteFooter />
    </div>
  )
}
