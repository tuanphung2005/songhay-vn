type AdPlaceholderProps = {
  label: string
  className?: string
}

export function AdPlaceholder({ label, className }: AdPlaceholderProps) {
  return (
    <div
      className={[
        "flex min-h-24 items-center justify-center border border-dashed border-rose-300 bg-rose-50 px-4 text-center text-sm text-rose-700",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      Quảng cáo: {label}
    </div>
  )
}
