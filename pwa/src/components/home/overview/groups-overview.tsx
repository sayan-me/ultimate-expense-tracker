"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert } from "@/components/ui/alert"
import { AlertCircle, ArrowRight, Users } from "lucide-react"
import { useGroups } from "@/hooks/use-groups"

/**
 * Replaces the old GroupStats/OutstandingBalances/GroupActivityFeed trio,
 * which showed hardcoded placeholder people ("Alice owes $50, Bob gets
 * $30, Charlie owes $25") sourced from lib/data.ts's mock database —
 * reported in live UAT as actively misleading once real group data
 * existed. This shows the user's real groups instead; a group's real
 * balances/expenses live on its own /groups/[groupId] page.
 */
export function GroupsOverview() {
  const { groups, loading, error } = useGroups()

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <span>Failed to load your groups: {error}</span>
      </Alert>
    )
  }

  if (loading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-full" />
      </Card>
    )
  }

  const allGroups = groups ?? []

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Your Groups</h3>
        <Link
          href="/groups"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="View all groups"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {allGroups.length === 0 ? (
        <div className="text-center py-4 space-y-2">
          <Users className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">You&apos;re not in any groups yet.</p>
          <Link href="/groups" className="text-sm text-primary hover:underline">
            Create a group
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {allGroups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50"
            >
              <span className="text-sm font-medium">{group.name}</span>
              <span className="text-sm text-muted-foreground">
                {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  )
}
