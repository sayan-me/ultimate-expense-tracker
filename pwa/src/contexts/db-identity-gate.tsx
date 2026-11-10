"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { DBProvider } from "@/contexts/db-context"
import { ANONYMOUS_DB_KEY, setActiveDbUser, ExpenseTrackerDB, dbNameForUserKey } from "@/lib/db"
import { resolveDbIdentity } from "@/lib/db-identity"
import { mergeAnonymousDataIntoUserDb } from "@/lib/db-merge"

/**
 * Scopes local data to who's actually signed in (ROADMAP F1 fix). Sits
 * between AuthProvider and DBProvider: it decides which local database
 * should be active for the current identity before DBProvider (and every
 * hook underneath it) is allowed to read anything, and forces a full
 * remount of that subtree on every identity change via `key`, so Dexie's
 * useLiveQuery hooks re-subscribe against the newly active database
 * instead of continuing to show the previous identity's data.
 */
// Found live: a stuck IndexedDB connection (e.g. another tab or a
// debugger still attached from earlier testing) can make opening the
// local database hang indefinitely — resolveDbIdentity's promise then
// simply never settles. Without a timeout, that blanked the whole app
// forever with no error and nothing to retry.
const RESOLUTION_TIMEOUT_MS = 10_000

export function DbIdentityGate({ children }: { children: ReactNode }) {
  const { firebaseUser, loading: authLoading } = useAuth()
  const [resolvedKey, setResolvedKey] = useState<string | null>(null)
  const [mergePrompt, setMergePrompt] = useState<{ key: string } | null>(null)
  const [isMerging, setIsMerging] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [retryToken, setRetryToken] = useState(0)
  // undefined = "haven't resolved anything yet" (distinct from null, which
  // means "resolved, and the resolved identity was anonymous").
  const lastHandledUid = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (authLoading) return

    const targetUid = firebaseUser?.uid ?? null
    if (retryToken === 0 && lastHandledUid.current === targetUid) return
    lastHandledUid.current = targetUid

    const targetKey = targetUid ?? ANONYMOUS_DB_KEY

    let settled = false
    const timer = setTimeout(() => {
      if (!settled) setTimedOut(true)
    }, RESOLUTION_TIMEOUT_MS)

    resolveDbIdentity(targetKey).then((decision) => {
      settled = true
      clearTimeout(timer)
      setTimedOut(false)
      if (decision.action === "prompt-merge") {
        setMergePrompt({ key: decision.key })
      } else {
        setActiveDbUser(decision.key)
        setResolvedKey(decision.key)
      }
    })

    return () => clearTimeout(timer)
  }, [authLoading, firebaseUser, retryToken])

  const finishMergeDecision = async (attach: boolean) => {
    if (!mergePrompt) return
    const { key } = mergePrompt

    if (attach) {
      setIsMerging(true)
      const anonDb = new ExpenseTrackerDB(dbNameForUserKey(ANONYMOUS_DB_KEY))
      await anonDb.open()
      const userDb = new ExpenseTrackerDB(dbNameForUserKey(key))
      await userDb.open()
      await mergeAnonymousDataIntoUserDb(anonDb, userDb)
    }

    setActiveDbUser(key)
    setMergePrompt(null)
    setIsMerging(false)
    setResolvedKey(key)
  }

  const handleRetry = () => {
    setTimedOut(false)
    setRetryToken((t) => t + 1)
  }

  if (timedOut) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          This is taking longer than expected to load your data. Something&apos;s wrong (another browser tab may
          have the database locked) — your data is safe, but this page can&apos;t load it right now.
        </p>
        <Button onClick={handleRetry}>Try again</Button>
      </div>
    )
  }

  if (mergePrompt) {
    return (
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>We found existing data on this device</DialogTitle>
            <DialogDescription>
              There&apos;s expense data on this device that isn&apos;t attached to any account yet. Attach it to
              your account? If not, you&apos;ll start with an empty account for now — you can still attach it
              later from Settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={isMerging} onClick={() => finishMergeDecision(false)}>
              No, start fresh
            </Button>
            <Button disabled={isMerging} onClick={() => finishMergeDecision(true)}>
              {isMerging ? "Attaching…" : "Yes, attach to my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  if (resolvedKey === null) {
    return null
  }

  return <DBProvider key={resolvedKey}>{children}</DBProvider>
}
