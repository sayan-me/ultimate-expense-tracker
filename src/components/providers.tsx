"use client"

import { ActivitiesProvider } from "@/contexts/activities-context"
import { DBProvider } from "@/contexts/db-context"
import { AuthProvider } from "@/contexts/auth-context"
import { AppLayout } from "@/components/layout/root-layout"
import { ThemeProvider } from "next-themes"
import { type ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem
      disableTransitionOnChange
      storageKey="theme-preference"
    >
      <AuthProvider>
        <DBProvider>
          <ActivitiesProvider>
            <AppLayout>{children}</AppLayout>
          </ActivitiesProvider>
        </DBProvider>
      </AuthProvider>
    </ThemeProvider>
  )
} 