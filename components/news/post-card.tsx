import Image from "next/image"
import Link from "next/link"
import { MessageSquare } from "lucide-react"

import { cn } from "@/lib/utils"

type PostCardProps = {
  href: string
  title: string
  excerpt?: string | null
  imageUrl?: string | null
  date?: Date | null
  categoryName?: string
  compact?: boolean
  variant?: "default" | "overlay" | "horizontal"
  aspectRatio?: "video" | "square" | "portrait" | "3/2" | "12/7"
  className?: string
  showExcerpt?: boolean
  commentCount?: number
}

export function PostCard({
  href,
  title,
  excerpt,
  imageUrl,
  date,
  categoryName,
  compact = false,
  variant = "default",
  aspectRatio = "12/7",
  className,
  showExcerpt = true,
  commentCount = 0,
}: PostCardProps) {
  const isOverlay = variant === "overlay"
  const isHorizontal = variant === "horizontal"

  return (
    <article
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        isOverlay ? "h-full min-h-[400px]" : "flex flex-col",
        isHorizontal && "flex-row items-start gap-4 md:gap-6",
        className
      )}
    >
      <Link href={href} className={cn(
        "flex h-full w-full", 
        isHorizontal ? "flex-row items-start gap-4 md:gap-6" : "flex-col",
        // If the article is forced to flex-col on LG via className, the Link must follow
        className?.includes("lg:flex-col") && "lg:flex-col lg:gap-3"
      )}>
        {/* Thumbnail Area */}
        <div
          className={cn(
            "relative overflow-hidden bg-zinc-100 flex-shrink-0",
            aspectRatio === "video" && "aspect-video",
            aspectRatio === "square" && "aspect-square",
            aspectRatio === "3/2" && "aspect-[3/2]",
            aspectRatio === "12/7" && "aspect-[12/7]",
            isOverlay && "absolute inset-0 h-full w-full",
            isHorizontal && "w-32 sm:w-48 lg:w-64",
            // If the article is forced to flex-col on LG, the thumbnail should be full width
            className?.includes("lg:flex-col") && "lg:w-full"
          )}
        >
          <Image
            src={imageUrl || "/placeholder-news.svg"}
            alt={title}
            fill
            className={cn(
              "object-cover transition duration-500 group-hover:scale-105",
              isOverlay && "brightness-90 transition-all duration-500 group-hover:brightness-100"
            )}
            loading="lazy"
            sizes={isOverlay ? "(max-width: 1024px) 100vw, 66vw" : "33vw"}
          />
          {isOverlay && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          )}
        </div>

        {/* Content Area */}
        <div
          className={cn(
            "flex flex-1 flex-col",
            isOverlay
              ? "relative z-10 justify-end p-6 text-white"
              : isHorizontal ? "py-0 justify-start" : "py-3",
            // Responsive py-3 for vertical state
            className?.includes("lg:flex-col") && "lg:py-3"
          )}
        >
          {isOverlay && <div className="flex-1" />}
          
          {/* Metadata for layout other than horizontal (Category on top) */}
          {/* Show on top if vertical or overlay, hide if horizontal list */}
          {(categoryName && !isOverlay && (!isHorizontal || className?.includes("lg:flex-col"))) && (
            <span className={cn(
              "mb-1 text-[10px] font-bold uppercase tracking-wider text-rose-600",
              isHorizontal && "lg:block",
              !className?.includes("lg:flex-col") && isHorizontal && "hidden"
            )}>
              {categoryName}
            </span>
          )}

          <h3
            className={cn(
              "font-bold leading-tight tracking-tight group-hover:text-rose-600 transition-colors",
              isOverlay ? "text-1xl md:text-1xl text-white group-hover:text-white lg:text-4xl" : 
              isHorizontal ? "text-lg md:text-xl lg:text-1xl text-zinc-900" : "text-base md:text-lg text-zinc-900",
              // Responsive text size for vertical state
              className?.includes("lg:flex-col") && "lg:text-lg"
            )}
          >
            {title}
          </h3>

          {/* Metadata for horizontal layout (Category - Time below title) */}
          {isHorizontal && (
            <div className={cn(
              "mt-2 flex items-center gap-2 text-xs font-semibold",
              className?.includes("lg:flex-col") && "lg:hidden"
            )}>
              <span className="text-primary font-bold">{categoryName}</span>
              <span className="text-zinc-400">—</span>
              <span className="text-zinc-500">
                {date ? new Date(date).toLocaleDateString("vi-VN") : "Vừa xong"}
              </span>
              {commentCount > 0 && (
                <>
                  <span className="text-zinc-400">—</span>
                  <div className="flex items-center gap-1 text-zinc-500">
                    <MessageSquare className="size-3" />
                    <span>{commentCount}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {!compact && showExcerpt && excerpt && (
            <p
              className={cn(
                "mt-2 line-clamp-2 text-sm leading-relaxed",
                isOverlay ? "text-zinc-200" : isHorizontal ? "text-zinc-600 md:text-base lg:line-clamp-3" : "text-zinc-600",
                // Hide excerpt on PC if forced to vertical and in a small space
                className?.includes("lg:flex-col") && "lg:hidden"
              )}
            >
              {excerpt}
            </p>
          )}

          {!compact && (!isHorizontal || className?.includes("lg:flex-col")) && (
            <div className={cn(
              "mt-3 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider",
              isOverlay ? "text-zinc-300" : "text-zinc-400",
              isHorizontal && "hidden lg:flex",
              !className?.includes("lg:flex-col") && isHorizontal && "hidden"
            )}>
              {date && <span>{new Date(date).toLocaleDateString("vi-VN")}</span>}
              <div className="flex items-center gap-1">
                <MessageSquare className="size-3" />
                <span>{commentCount}</span>
              </div>
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}
