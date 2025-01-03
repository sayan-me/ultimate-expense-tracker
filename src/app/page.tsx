import { Overview } from "@/components/home/overview/overview"
import { QuickActions } from "@/components/home/quick-actions"

export default function HomePage() {
  return (
    <main className="container py-6 space-y-6">
      <QuickActions />
      <Overview />
    </main>
  )
}
