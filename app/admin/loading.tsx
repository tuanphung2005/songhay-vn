import { Skeleton } from "@/components/ui/boneyard-skeleton"

export default function AdminLoading() {
  return (
    <Skeleton name="admin-page" loading>
      <div className="space-y-4">
        <div className="space-y-3 border bg-white p-6">
          <div className="h-7 w-56 animate-pulse bg-zinc-200" />
          <div className="h-4 w-80 animate-pulse bg-zinc-100" />
        </div>
        <div className="space-y-3 border bg-white p-6">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="h-6 w-full animate-pulse bg-zinc-100" />
          ))}
        </div>
      </div>
    </Skeleton>
  )
}
