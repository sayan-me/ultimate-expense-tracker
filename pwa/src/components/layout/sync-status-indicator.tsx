"use client"

import { CloudOff, RefreshCw, CloudAlert, Cloud } from "lucide-react"
import { useOfflineSyncStore } from "@/stores/offline-sync"

export function SyncStatusIndicator() {
  const { isOnline, syncStatus, lastSyncedAt, lastError } = useOfflineSyncStore()

  const state = !isOnline
    ? {icon: <CloudOff className="h-4 w-4 text-muted-foreground" />, title: "Offline"}
    : syncStatus === "syncing"
    ? {icon: <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />, title: "Syncing…"}
    : syncStatus === "error"
    ? {icon: <CloudAlert className="h-4 w-4 text-destructive" />, title: `Sync failed: ${lastError}`}
    : lastSyncedAt
    ? {icon: <Cloud className="h-4 w-4 text-muted-foreground" />, title: "Synced"}
    : null

  // No sync has ever happened (e.g. no one's signed in) — nothing to show yet.
  if (!state) return null

  return (
    <span data-testid="sync-status-indicator" title={state.title}>
      {state.icon}
    </span>
  )
}
