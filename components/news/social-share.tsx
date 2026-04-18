"use client"

import { useState } from "react"
import Link from "next/link"
import { Facebook, Link2, Linkedin, Send, Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
    hoverColor: "hover:bg-[#1877F2] hover:text-white",
    hoverBorder: "hover:border-[#1877F2]",
  },
  {
    name: "LinkedIn",
    href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    icon: Linkedin,
    color: "text-[#0A66C2]",
    hoverColor: "hover:bg-[#0A66C2] hover:text-white",
    hoverBorder: "hover:border-[#0A66C2]",
  },
  {
    name: "Telegram",
    href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    icon: Send,
    color: "text-[#26A5E4]",
    hoverColor: "hover:bg-[#26A5E4] hover:text-white",
    hoverBorder: "hover:border-[#26A5E4]",
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
      <div className="hidden lg:flex flex-col items-center gap-4 py-4 sticky top-24 h-fit">
        {links(title, url).map((item) => (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "group flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white transition-all shadow-sm hover:scale-110 active:scale-95",
              item.hoverBorder,
              item.hoverColor
            )}
            title={`Chia sẻ lên ${item.name}`}
          >
            <item.icon className={cn("size-5 transition-colors", item.color, "group-hover:text-white")} />
          </a>
        ))}
        <button
          type="button"
          onClick={handleCopy}
          className="group flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white transition-all shadow-sm hover:scale-110 active:scale-95 hover:border-zinc-800 hover:bg-zinc-800"
          title="Copy link"
        >
          {copied ? (
            <Check className="size-5 text-green-600 group-hover:text-white" />
          ) : (
            <Link2 className="size-5 text-zinc-600 group-hover:text-white" />
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 border-t border-zinc-100 pt-8 pb-4">
      <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
        Chia sẻ bài viết
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {links(title, url).map((item) => (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "group inline-flex min-w-[120px] items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium transition-all shadow-sm hover:scale-105 active:scale-95",
              item.hoverBorder,
              item.hoverColor
            )}
          >
            <item.icon className={cn("size-4 transition-colors", item.color, "group-hover:text-white")} />
            <span className="group-hover:text-white">{item.name}</span>
          </a>
        ))}
        <button
          type="button"
          onClick={handleCopy}
          className="group inline-flex min-w-[120px] items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium transition-all shadow-sm hover:scale-105 active:scale-95 hover:border-zinc-800 hover:bg-zinc-800"
        >
          {copied ? (
            <>
              <Check className="size-4 text-green-600 group-hover:text-white" />
              <span className="group-hover:text-white">Đã copy</span>
            </>
          ) : (
            <>
              <Link2 className="size-4 text-zinc-600 group-hover:text-white" />
              <span className="group-hover:text-white">Copy link</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
