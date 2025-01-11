"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert } from "@/components/ui/alert"
import { AlertCircle, ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { useState, useEffect } from "react"

interface GroupActivity {
  id: string
  timestamp: Date
  memberName: string
  type: 'expense' | 'settlement' | 'adjustment'
  amount: number
  description: string
  status: 'pending' | 'approved' | 'rejected'
}

interface GroupActivityFeedProps {
  isLoading?: boolean
  initialData?: {
    activities: GroupActivity[]
  }
}

export function GroupActivityFeed({ isLoading = false, initialData }: GroupActivityFeedProps) {
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!initialData && !isLoading) {
      setError(new Error('Failed to load activity feed data'))
    }
  }, [initialData, isLoading])

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
      <Card className="p-6 space-y-4">
        <Skeleton className="h-4 w-40" data-testid="skeleton-title" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" data-testid={`skeleton-member-${i}`} />
                <Skeleton className="h-4 w-24" data-testid={`skeleton-amount-${i}`} />
              </div>
              <Skeleton className="h-4 w-full" data-testid={`skeleton-desc-${i}`} />
              <Skeleton className="h-4 w-20" data-testid={`skeleton-time-${i}`} />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-full" data-testid="skeleton-button" />
      </Card>
    )
  }

  const activities = initialData?.activities || []

  const getStatusColor = (status: GroupActivity['status']) => {
    switch (status) {
      case 'approved': return 'text-green-600'
      case 'rejected': return 'text-destructive'
      default: return 'text-yellow-600'
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Group Activity</h3>
        <button
          onClick={() => {/* To be implemented in routing phase */}}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="View all activity"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{activity.memberName}</span>
              <span className={getStatusColor(activity.status)}>
                {formatCurrency(activity.amount)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{activity.description}</p>
            <p className="text-xs text-muted-foreground">
              {format(activity.timestamp, 'MMM d, h:mm a')}
            </p>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">No recent activity</p>
        )}
      </div>
    </Card>
  )
} 