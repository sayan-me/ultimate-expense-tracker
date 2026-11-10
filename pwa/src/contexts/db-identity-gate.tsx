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
export function DbIdentityGate({ children }: { children: ReactNode }) {
  const { firebaseUser, loading: authLoading } = useAuth()
  const [resolvedKey, setResolvedKey] = useState<string | null>(null)
  const [mergePrompt, setMergePrompt] = useState<{ key: string } | null>(null)
  const [isMerging, setIsMerging] = useState(false)
  // undefined = "haven't resolved anything yet" (distinct from null, which
  // means "resolved, and the resolved identity was anonymous").
  const lastHandledUid = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (authLoading) return

    const targetUid = firebaseUser?.uid ?? null
    if (lastHandledUid.current === targetUid) return
    lastHandledUid.current = targetUid

    const targetKey = targetUid ?? ANONYMOUS_DB_KEY

    resolveDbIdentity(targetKey).then((decision) => {
      if (decision.action === "prompt-merge") {
        setMergePrompt({ key: decision.key })
      } else {
        setActiveDbUser(decision.key)
        setResolvedKey(decision.key)
      }
    })
  }, [authLoading, firebaseUser])

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

  if (mergePrompt) {
    return (
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>We found existing data on this device</DialogTitle>
            <DialogDescription>
              There&apos;s expense data on this device that isn&apos;t attached to any account yet. Attach it to
              your account? If not, you&apos;ll start with an empty account, and this device&apos;s existing data
              stays as it is.
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
