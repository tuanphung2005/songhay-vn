type SectionHeadingProps = {
  title: string
}

export function SectionHeading({ title }: SectionHeadingProps) {
  return (
    <h2 className="border-l-4 border-rose-600 pl-3 text-2xl font-extrabold tracking-tight text-zinc-900">
      {title}
    </h2>
  )
}
