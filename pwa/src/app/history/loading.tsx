import { Card, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function HistoryLoading() {
  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-5 w-5" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
} 