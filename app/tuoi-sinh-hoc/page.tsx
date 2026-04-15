import type { Metadata } from "next"

import { BioAgeWidget } from "@/components/news/bio-age-widget"
import { SiteFooter } from "@/components/news/site-footer"
import { SiteHeader } from "@/components/news/site-header"
import { SiteMainContainer } from "@/components/news/site-main-container"
import { getHomepageData, getNavCategories } from "@/lib/queries"
import { PostCardList } from "@/components/news/post-card-list"
import { MostRead } from "@/components/news/most-read"
import { AdPlaceholder } from "@/components/news/ad-placeholder"
import { ClientSideWidgets } from "@/components/news/client-side-widgets"

export const metadata: Metadata = {
  title: "Máy tính tuổi sinh học",
  description: "Ước tính tuổi sinh học dựa trên giấc ngủ, vận động và mức căng thẳng.",
  alternates: {
    canonical: "/tuoi-sinh-hoc",
  },
}

export default async function BioAgePage() {
  const [navCategories, { latest, mostRead }] = await Promise.all([getNavCategories(), getHomepageData()])

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader navCategories={navCategories} />
      <SiteMainContainer className="py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-12">
            <div className="space-y-6">
              <h1 className="text-3xl font-black text-zinc-900">Máy tính tuổi sinh học</h1>
              <BioAgeWidget />
            </div>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase text-zinc-900">Tin mới nhất</h2>
              <PostCardList posts={latest} />
            </section>
          </div>

          <aside className="space-y-8">
            <MostRead
              posts={mostRead.map((post) => ({
                id: post.id,
                title: post.title,
                thumbnailUrl: post.thumbnailUrl,
                views: post.views,
                slug: post.slug,
                categorySlug: post.category.slug,
              }))}
            />
            <AdPlaceholder label="Sidebar Ads" />
            <ClientSideWidgets />
          </aside>
        </div>
      </SiteMainContainer>
      <SiteFooter navCategories={navCategories} />
    </div>
  )
}
