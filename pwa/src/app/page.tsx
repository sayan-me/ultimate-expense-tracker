import { Overview } from "@/components/home/overview/overview"
import { QuickActions } from "@/components/home/quick-actions"
import { OverviewSkeleton } from "@/components/home/overview/loading"
import { Suspense } from "react"

export default function HomePage() {
  return (
    <div className="py-6 space-y-6 pb-20">
      <QuickActions />
      <Suspense fallback={<OverviewSkeleton />}>
        <Overview />
      </Suspense>
    </div>
  )
}
