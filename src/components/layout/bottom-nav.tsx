"use client"

import { ModePanel } from "./mode-panel"

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-center">
        <ModePanel />
      </div>
    </nav>
  )
} 