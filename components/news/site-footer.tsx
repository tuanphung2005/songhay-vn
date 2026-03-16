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
  {
    name: "Facebook",
    href: "https://facebook.com",
    icon: Facebook,
    buttonClass: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-700 hover:text-white",
  },
  {
    name: "YouTube",
    href: "https://youtube.com",
    icon: Youtube,
    buttonClass: "border-red-200 bg-red-50 text-red-700 hover:bg-red-700 hover:text-white",
  },
  {
    name: "TikTok",
    href: "https://tiktok.com",
    icon: TikTokIcon,
    buttonClass: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-700 hover:text-white",
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com",
    icon: Linkedin,
    buttonClass: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-700 hover:text-white",
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 md:grid-cols-[1.3fr_1fr] md:px-6">
        <div className="space-y-3 text-zinc-700">
          <p className="text-2xl font-black text-zinc-900">Songhay.vn</p>
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-700">Liên hệ quảng cáo</p>
          <p className="text-zinc-600">Đặt banner, booking bài PR, tài trợ chuyên mục và hợp tác nội dung thương hiệu.</p>
          <div className="space-y-1.5 rounded-lg border border-zinc-200 bg-white p-4">
            <p>
              Email: <a href="mailto:ads@songhay.vn" className="font-semibold text-rose-700">ads@songhay.vn</a>
            </p>
            <p>
              Hotline / Zalo: <a href="tel:0967402295" className="font-semibold text-rose-700">0967 402 295</a>
            </p>
            <p>Địa chỉ: Tổ 11, Thụy Lâm, Hà Nội</p>
          </div>
          <Link
            href="/mien-tru-trach-nhiem"
            className="mt-2 inline-flex text-sm font-semibold text-rose-700 underline underline-offset-2 hover:text-rose-800"
          >
            Miễn trừ trách nhiệm
          </Link>
          <p className="pt-1 text-sm text-zinc-500">Copyright © 2026 songhay.vn</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-700">Kết nối với Songhay</p>
          <div className="flex flex-wrap items-center gap-3">
            {socials.map((social) => (
              <Link
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.name}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${social.buttonClass}`}
              >
                <social.icon />
              </Link>
            ))}
          </div>
          <p className="text-sm text-zinc-600">Theo dõi để nhận tin nổi bật, video mới và chương trình hợp tác truyền thông.</p>
        </div>
      </div>
    </footer>
  )
}
