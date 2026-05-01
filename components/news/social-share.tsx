"use client"

import { useState } from "react"
import { Facebook, Link2, Linkedin, Send, Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type SocialShareProps = {
  title: string
  url: string
  variant?: "bottom" | "sidebar"
}

const links = (title: string, url: string) => [
  {
    name: "Facebook",
    href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    icon: Facebook,
    color: "text-[#1877F2]",
    hoverBg: "hover:bg-[#1877F2]/10",
    hoverBorder: "hover:border-[#1877F2]/30",
  },
  {
    name: "LinkedIn",
    href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    icon: Linkedin,
    color: "text-[#0A66C2]",
    hoverBg: "hover:bg-[#0A66C2]/10",
    hoverBorder: "hover:border-[#0A66C2]/30",
  },
  {
    name: "Telegram",
    href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    icon: Send,
    color: "text-[#26A5E4]",
    hoverBg: "hover:bg-[#26A5E4]/10",
    hoverBorder: "hover:border-[#26A5E4]/30",
  },
]

export function SocialShare({ title, url, variant = "bottom" }: SocialShareProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success("Đã copy link thành công")
    setTimeout(() => setCopied(false), 2000)
  }

  if (variant === "sidebar") {
    return (
      <div className="hidden lg:flex flex-col items-center gap-3 py-4 sticky top-24 h-fit">
        {links(title, url).map((item) => (
          <Button
            key={item.name}
            variant="outline"
            size="icon"
            asChild
            className={cn("rounded-full shadow-sm transition-colors", item.hoverBg, item.hoverBorder)}
          >
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              title={`Chia sẻ lên ${item.name}`}
            >
              <item.icon className={cn("size-5", item.color)} />
            </a>
          </Button>
        ))}
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          className="rounded-full shadow-sm hover:bg-zinc-100"
          title="Copy link"
        >
          {copied ? (
            <Check className="size-5 text-green-600" />
          ) : (
            <Link2 className="size-5 text-zinc-600" />
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 border-t border-zinc-100 pt-8 pb-4">
      <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-900">
        Chia sẻ bài viết
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {links(title, url).map((item) => (
          <Button
            key={item.name}
            variant="outline"
            asChild
            className={cn("min-w-[110px] rounded-full shadow-sm transition-colors", item.hoverBg, item.hoverBorder)}
          >
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
            >
              <item.icon className={cn("size-4", item.color)} />
              <span className="text-zinc-700">{item.name}</span>
            </a>
          </Button>
        ))}
        <Button
          variant="outline"
          onClick={handleCopy}
          className="min-w-[110px] rounded-full shadow-sm hover:bg-zinc-100"
        >
          {copied ? (
            <>
              <Check className="size-4 text-green-600" />
              <span className="text-zinc-700">Đã copy</span>
            </>
          ) : (
            <>
              <Link2 className="size-4 text-zinc-600" />
              <span className="text-zinc-700">Copy link</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}


