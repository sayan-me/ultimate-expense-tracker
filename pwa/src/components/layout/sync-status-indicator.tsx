"use client"

import { CloudOff, RefreshCw, CloudAlert, Cloud } from "lucide-react"
import { useOfflineSyncStore } from "@/stores/offline-sync"

export function SyncStatusIndicator() {
  const { isOnline, syncStatus, lastSyncedAt, lastError, syncNow } = useOfflineSyncStore()

  const state = !isOnline
    ? {icon: <CloudOff className="h-4 w-4 text-muted-foreground" />, title: "Offline"}
    : syncStatus === "syncing"
    ? {icon: <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />, title: "Syncing…"}
    : syncStatus === "error"
    ? {icon: <CloudAlert className="h-4 w-4 text-destructive" />, title: `Sync failed: ${lastError}`, retryLabel: "Retry sync"}
    : lastSyncedAt
    ? {icon: <Cloud className="h-4 w-4 text-muted-foreground" />, title: "Synced", retryLabel: "Sync now"}
    : null

  // No sync has ever happened (e.g. no one's signed in) — nothing to show yet.
  if (!state) return null

  // Clickable whenever there's actually something to retry against:
  // not while offline (nothing to sync with) and not while a sync is
  // already running (would just queue a redundant concurrent attempt).
  const canRetry = isOnline && syncStatus !== "syncing" && "retryLabel" in state

  if (canRetry) {
    return (
      <button
        type="button"
        data-testid="sync-status-indicator"
        title={state.title}
        aria-label={state.retryLabel}
        onClick={() => syncNow()}
      >
        {state.icon}
      </button>
    )
  }

  return (
    <span data-testid="sync-status-indicator" title={state.title}>
      {state.icon}
    </span>
  )
}
