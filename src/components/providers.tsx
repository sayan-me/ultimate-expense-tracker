"use client"

import { ActivitiesProvider } from "@/contexts/activities-context"
import { DBProvider } from "@/contexts/db-context"
import { AppLayout } from "@/components/layout/root-layout"
import { ThemeProvider } from "next-themes"
import { type ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <DBProvider>
        <ActivitiesProvider>
          <AppLayout>{children}</AppLayout>
        </ActivitiesProvider>
      </DBProvider>
    </ThemeProvider>
  )
} 