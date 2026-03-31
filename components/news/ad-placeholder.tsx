import { cn } from "@/lib/utils"

const ADSENSE_CLIENT = "ca-pub-1176898129958487"

type AdPlaceholderProps = {
  label: string
  className?: string
  slot?: string
}

export function AdPlaceholder({ label, className, slot }: AdPlaceholderProps) {
  const slotProps = slot ? { "data-ad-slot": slot } : {}

  return (
    <div className={cn("w-full overflow-hidden", className)} data-ad-label={label}>
      <ins
        className="adsbygoogle block w-full"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-format="auto"
        data-full-width-responsive="true"
        aria-label={label}
        {...slotProps}
      />
    </div>
  )
}
