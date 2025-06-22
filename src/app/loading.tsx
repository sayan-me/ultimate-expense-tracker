import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container py-6 space-y-6">
      {/* Quick Actions Skeleton */}
      <Card className="p-6">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </Card>

      {/* Overview Section Skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-[160px] w-full rounded-lg" />
        <Skeleton className="h-[120px] w-full rounded-lg" />
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </div>
    </div>
  )
}
