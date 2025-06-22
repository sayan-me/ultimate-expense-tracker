import { Skeleton } from "@/components/ui/skeleton";

export function OverviewSkeleton() {
  return (
    <section className="space-y-6" aria-label="Loading financial overview">
      <Skeleton className="h-[160px] w-full rounded-lg" />
      <Skeleton className="h-[120px] w-full rounded-lg" />
      <Skeleton className="h-[280px] w-full rounded-lg" />
    </section>
  )
} 