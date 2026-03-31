type SectionHeadingProps = {
  title: string
}

export function SectionHeading({ title }: SectionHeadingProps) {
  return (
    <h2 className="border-l-[5px] border-rose-600 pl-3 text-xl font-bold tracking-tight text-zinc-900">
      {title}
    </h2>
  )
}
