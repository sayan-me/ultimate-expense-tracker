"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert } from "@/components/ui/alert"
import { AlertCircle, ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { useState, useEffect } from "react"
import { getGroupActivities } from "@/lib/data"

interface GroupActivity {
  id: string
  timestamp: Date
  memberName: string
  type: 'expense' | 'settlement' | 'adjustment'
  amount: number
  description: string
  status: 'pending' | 'approved' | 'rejected'
}

export function GroupActivityFeed() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<{
    activities: GroupActivity[]
  } | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getGroupActivities()
        setData(result)
      } catch (err) {
        console.error('Group activities fetch error:', err)
        setError(err instanceof Error ? err : new Error('Failed to load activities'))
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <span>Failed to load activity feed: {error.message}</span>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-4 gap-4 py-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  try {
    const activities = data?.activities ?? []

    if (activities.length === 0) {
      return (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">No recent activity</p>
        </Card>
      )
    }

    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <button
              onClick={() => {
                try {
                  throw new Error("Activity history not implemented yet")
                } catch (err) {
                  setError(err instanceof Error ? err : new Error("Unknown error"))
                }
              }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="View all activities"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 border-b pb-2">
              <span className="text-sm font-medium text-muted-foreground">Time</span>
              <span className="text-sm font-medium text-muted-foreground">Member</span>
              <span className="text-sm font-medium text-muted-foreground">Description</span>
              <span className="text-sm font-medium text-muted-foreground text-right">Amount</span>
            </div>

            {/* Table Body */}
            <div className="space-y-2">
              {activities.map((activity) => (
                <div 
                  key={activity.id}
                  className="grid grid-cols-4 gap-4 py-1"
                >
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                  </span>
                  <span className="text-sm">{activity.memberName}</span>
                  <span className="text-sm">{activity.description}</span>
                  <span 
                    className={`text-sm font-medium text-right ${
                      activity.status === 'approved' 
                        ? 'text-green-500'
                        : activity.status === 'rejected'
                          ? 'text-red-500'
                          : 'text-yellow-500'
                    }`}
                  >
                    {formatCurrency(activity.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    )
  } catch (err) {
    setError(err instanceof Error ? err : new Error("Failed to render activity feed"))
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <span>Something went wrong</span>
      </Alert>
    )
  }
} 