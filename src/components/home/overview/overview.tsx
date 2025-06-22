"use client"

import dynamic from 'next/dynamic'
import { GroupStats } from "./group-stats"
import { OutstandingBalances } from "./outstanding-balances"
import { GroupActivityFeed } from "./group-activity-feed"
import { useActivities } from "@/contexts/activities-context"
import { useState, useEffect } from "react"
import { FeatureGate } from "@/components/auth/feature-gate"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthFallbackContent } from "@/components/ui/auth-fallback-content"

// Lazy load components with skeletons
const CurrentBalance = dynamic(
  () => import('./current-balance').then(mod => mod.CurrentBalance),
  {
    loading: () => null,
    ssr: false
  }
)

const MonthlySpend = dynamic(
  () => import('./monthly-spend').then(mod => mod.MonthlySpend),
  {
    loading: () => null,
    ssr: false
  }
)

const RecentExpenses = dynamic(
  () => import('./recent-expenses').then(mod => mod.RecentExpenses),
  {
    loading: () => null,
    ssr: false
  }
)

export function Overview() {
  const { isGroupMode } = useActivities()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)
    const timer = setTimeout(() => setIsTransitioning(false), 300)
    return () => clearTimeout(timer)
  }, [isGroupMode])

  return (
    <section 
      className={`space-y-6 transition-opacity duration-300 pb-32 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`} 
      aria-label="Financial overview"
    >
      {isGroupMode ? (
        <>
        <FeatureGate
          level="registered"
          fallback={
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle>Group Stats</CardTitle>
              </CardHeader>
              <AuthFallbackContent type="registered" />
            </Card>
          }
        >
            <GroupStats />
        </FeatureGate>
        <FeatureGate
          level="registered"
          fallback={
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle>Outstanding Balances</CardTitle>
              </CardHeader>
              <AuthFallbackContent type="registered" />
            </Card>
          }
        >
            <OutstandingBalances />
        </FeatureGate>
        <FeatureGate
          level="registered"
          fallback={
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <AuthFallbackContent type="registered" />
            </Card>
          }
        >
            <GroupActivityFeed />
        </FeatureGate>
        </>
      ) : (
        <>
          <CurrentBalance />
          <MonthlySpend />
          <RecentExpenses />
        </>
      )}
    </section>
  )
}