"use client"

import Link from "next/link"
import { Facebook, Link2, Linkedin, Send } from "lucide-react"

type SocialShareProps = {
  title: string
  url: string
}

const links = (title: string, url: string) => [
  {
    name: "Facebook",
    href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    icon: Facebook,
  },
  {
    name: "LinkedIn",
    href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    icon: Linkedin,
  },
  {
    name: "Telegram",
    href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    icon: Send,
  },
]

export function SocialShare({ title, url }: SocialShareProps) {
  return (
    <div className="space-y-2 border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-sm font-semibold text-zinc-700">Chia sẻ bài viết</p>
      <div className="flex flex-wrap items-center gap-2">
        {links(title, url).map((item) => (
          <Link
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:border-rose-600 hover:text-rose-600"
          >
            <item.icon className="size-4" /> {item.name}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => void navigator.clipboard.writeText(url)}
          className="inline-flex items-center gap-2 border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:border-rose-600 hover:text-rose-600"
        >
          <Link2 className="size-4" /> Copy link
        </button>
      </div>
    </div>
  )
}
