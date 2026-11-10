"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { HardDrive } from "lucide-react"
import { getDb, ExpenseTrackerDB, ANONYMOUS_DB_KEY, dbNameForUserKey } from "@/lib/db"
import { anonymousDataExists } from "@/lib/db-identity"
import { mergeAnonymousDataIntoUserDb } from "@/lib/db-merge"

/**
 * Recovery path for anyone who declined DbIdentityGate's first-sign-in
 * merge prompt (or who has since logged data anonymously on this device
 * after already signing in elsewhere) — the prompt only ever fires once,
 * so without this there'd be no way back to that data.
 */
export function AttachDeviceDataCard() {
  const [hasDeviceData, setHasDeviceData] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isAttaching, setIsAttaching] = useState(false)

  useEffect(() => {
    anonymousDataExists().then(setHasDeviceData)
  }, [])

  const handleAttach = async () => {
    setIsAttaching(true)
    const anonDb = new ExpenseTrackerDB(dbNameForUserKey(ANONYMOUS_DB_KEY))
    await anonDb.open()
    await mergeAnonymousDataIntoUserDb(anonDb, getDb())
    setIsAttaching(false)
    setShowConfirm(false)
    setHasDeviceData(false)
  }

  if (!hasDeviceData) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HardDrive className="h-5 w-5" />
          Device Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          This device has expense data that isn&apos;t attached to your account yet.
        </p>
        <Button type="button" onClick={() => setShowConfirm(true)}>
          Attach to my account
        </Button>
      </CardContent>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach device data to your account?</DialogTitle>
            <DialogDescription>
              This moves the unattached data on this device into your account. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={isAttaching} onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button disabled={isAttaching} onClick={handleAttach}>
              {isAttaching ? "Attaching…" : "Yes, attach"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
