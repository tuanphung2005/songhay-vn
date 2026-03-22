export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-white/90">
        <div className="flex w-full items-center justify-between px-4 py-4 md:px-6 xl:px-8">
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse bg-zinc-200" />
            <div className="h-8 w-72 animate-pulse bg-zinc-200" />
          </div>
          <div className="hidden h-7 w-40 animate-pulse bg-zinc-200 md:block" />
        </div>
      </header>

      <div className="grid w-full gap-4 p-4 md:grid-cols-[280px_1fr] md:p-6 xl:gap-6 xl:px-8">
        <aside className="space-y-4">
          <div className="space-y-3 border bg-white p-4">
            <div className="h-6 w-36 animate-pulse bg-zinc-200" />
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="h-9 w-full animate-pulse bg-zinc-100" />
            ))}
          </div>
          <div className="space-y-3 border bg-white p-4">
            <div className="h-6 w-40 animate-pulse bg-zinc-200" />
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-8 w-full animate-pulse bg-zinc-100" />
            ))}
          </div>
        </aside>

        <section className="space-y-4">
          <div className="space-y-3 border bg-white p-6">
            <div className="h-7 w-56 animate-pulse bg-zinc-200" />
            <div className="h-4 w-80 animate-pulse bg-zinc-100" />
          </div>
          <div className="space-y-3 border bg-white p-6">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="h-6 w-full animate-pulse bg-zinc-100" />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
