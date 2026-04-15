import { cn } from "@/lib/utils"

interface SiteMainContainerProps {
  children: React.ReactNode
  className?: string
  as?: "main" | "div" | "section"
}

export function SiteMainContainer({
  children,
  className,
  as: Tag = "main",
}: SiteMainContainerProps) {
  return (
    <Tag className={cn("mx-auto w-full max-w-[1100px] px-4 md:px-6", className)}>
      {children}
    </Tag>
  )
}
