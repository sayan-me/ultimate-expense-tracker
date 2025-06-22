import { Overview } from "@/components/home/overview/overview"
import { QuickActions } from "@/components/home/quick-actions"
import { OverviewSkeleton } from "@/components/home/overview/loading"
import { Suspense } from "react"

export default function HomePage() {
  return (
    <main className="container py-6 space-y-6">
      <QuickActions />
      <Suspense fallback={<OverviewSkeleton />}>
        <Overview />
      </Suspense>
    </main>
  )
}
