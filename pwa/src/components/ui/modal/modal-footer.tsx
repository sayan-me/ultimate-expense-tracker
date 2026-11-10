"use client"

import { cn } from "@/lib/utils"
import { ModalFooterProps } from "./types"

export function ModalFooter({
  children,
  className,
  showBorder = true
}: ModalFooterProps) {
  return (
    <div className={cn(
      // On the mobile bottom sheet this sits flush against the screen
      // edge (and the iOS home-indicator gesture area), so pad by the
      // larger of a fixed amount or the device's safe-area inset.
      "px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shrink-0 bg-background",
      showBorder && "border-t",
      className
    )}>
      {children}
    </div>
  )
}