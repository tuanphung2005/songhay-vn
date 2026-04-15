import type { Metadata } from "next"

import { GoodDayFullReport } from "@/components/news/good-day-full-report"
import { GoodDayByAgeTool } from "@/components/news/good-day-by-age-tool"
import { SiteFooter } from "@/components/news/site-footer"
import { SiteHeader } from "@/components/news/site-header"
import { SiteMainContainer } from "@/components/news/site-main-container"
import { AdPlaceholder } from "@/components/news/ad-placeholder"
import { MostRead } from "@/components/news/most-read"
import { PostCardList } from "@/components/news/post-card-list"
import { SectionHeading } from "@/components/news/section-heading"
import { ClientSideWidgets } from "@/components/news/client-side-widgets"
import { getHomepageData, getNavCategories, type PostWithCategoryAndComments } from "@/lib/queries"

export const metadata: Metadata = {
  title: "Xem ngày tốt xấu đầy đủ theo lịch âm",
  description:
    "Xem ngày tốt xấu đầy đủ: hoàng đạo, trực, nạp âm, giờ tốt, tuổi xung khắc, sao tốt xấu và đánh giá theo ngày.",
  alternates: {
    canonical: "/ngay-tot-xau",
  },
}

export default async function GoodDayPage() {
  const [{ latest, mostRead }, navCategories] = await Promise.all([
    getHomepageData(),
    getNavCategories(),
  ])

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader navCategories={navCategories} />
      <SiteMainContainer className="py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6">
            <header className="space-y-2">
              <h1 className="text-3xl font-black text-zinc-900">Xem ngày tốt xấu theo tuổi</h1>
              <p className="text-zinc-600">Nhập ngày sinh và ngày cần xem để nhận gợi ý nhanh.</p>
            </header>

            <section className="rounded-lg border border-zinc-200 bg-white p-4">
              <GoodDayByAgeTool showUtilityLinks />
            </section>

            <GoodDayFullReport />

            <div className="pt-8 border-t border-zinc-100">
              <SectionHeading title="Tin mới nhất" />
              <PostCardList posts={latest.slice(0, 10)} />
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <MostRead
              posts={mostRead.map((post: PostWithCategoryAndComments) => ({
                id: post.id,
                title: post.title,
                thumbnailUrl: post.thumbnailUrl,
                views: post.views,
                slug: post.slug,
                categorySlug: post.category.slug,
              }))}
            />
            <AdPlaceholder label="Sidebar Ad (Google AdSense)" />
            <ClientSideWidgets />
          </aside>
        </div>
      </SiteMainContainer>
      <SiteFooter navCategories={navCategories} />
    </div>
  )
}
