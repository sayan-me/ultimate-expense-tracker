"use client"

import { ActivitiesProvider } from "@/contexts/activities-context"
import { DBProvider } from "@/contexts/db-context"
import { AuthProvider } from "@/contexts/auth-context"
import { AppLayout } from "@/components/layout/root-layout"
import { ThemeProvider } from "next-themes"
import { useAuthSync } from "@/hooks/use-auth-sync"
import { type ReactNode } from "react"

// Component to handle global auth sync
function AuthSyncProvider({ children }: { children: ReactNode }) {
  useAuthSync()
  return <>{children}</>
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="dark" 
      enableSystem
      disableTransitionOnChange
      storageKey="theme-preference"
    >
      <AuthProvider>
        <AuthSyncProvider>
          <DBProvider>
            <ActivitiesProvider>
              <AppLayout>{children}</AppLayout>
            </ActivitiesProvider>
          </DBProvider>
        </AuthSyncProvider>
      </AuthProvider>
    </ThemeProvider>
  )
} 