"use client"

import { ActivitiesProvider } from "@/contexts/activities-context"
import { DBProvider } from "@/contexts/db-context"
import { AppLayout } from "@/components/layout/root-layout"
import { type ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ActivitiesProvider>
      <DBProvider>
        <AppLayout>{children}</AppLayout>
      </DBProvider>
    </ActivitiesProvider>
  )
} 