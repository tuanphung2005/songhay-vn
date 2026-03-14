import Link from "next/link"
import { Facebook, Linkedin, Youtube } from "lucide-react"

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-5">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.17V2h-3.36v13.48a2.88 2.88 0 1 1-2.88-2.88 2.8 2.8 0 0 1 .86.14V9.33a6.2 6.2 0 0 0-.86-.06A6.24 6.24 0 1 0 15.82 15V8.16a8.17 8.17 0 0 0 4.77 1.54V6.69h-1Z" />
    </svg>
  )
}

const socials = [
  { name: "Facebook", href: "https://facebook.com", icon: Facebook },
  { name: "YouTube", href: "https://youtube.com", icon: Youtube },
  { name: "TikTok", href: "https://tiktok.com", icon: TikTokIcon },
  { name: "LinkedIn", href: "https://linkedin.com", icon: Linkedin },
]

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 md:grid-cols-[1fr_auto] md:px-6">
        <div className="space-y-2 text-zinc-700">
          <p className="text-2xl font-black text-zinc-900">Songhay.vn</p>
          <p>Kho tàng điều hay</p>
          <p>Địa chỉ: Tổ 11, Thụy Lâm, Hà Nội</p>
          <p>Email: songhay@gmail.com</p>
          <p>Hotline / Zalo: 0967 659 607</p>
          <p className="pt-2 text-sm text-zinc-500">Copyright © 2026 songhay.vn</p>
        </div>

        <div className="flex items-start gap-3">
          {socials.map((social) => (
            <Link
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              aria-label={social.name}
              className="rounded-full border border-zinc-300 p-2 text-zinc-700 transition hover:border-rose-600 hover:text-rose-600"
            >
              <social.icon />
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
