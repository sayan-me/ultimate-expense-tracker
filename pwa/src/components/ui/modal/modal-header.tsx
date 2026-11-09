"use client"

import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ModalHeaderProps } from "./types"

export function ModalHeader({
  title,
  subtitle,
  className
}: ModalHeaderProps) {
  return (
    <div className={cn("p-6 pb-0 shrink-0", className)}>
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold leading-none tracking-tight">
          {title}
        </DialogTitle>
        {/* Radix requires every dialog to have a description it can
            point aria-describedby at, or it logs a warning on every
            open (C3 in the bug report). Visible when a subtitle is
            given, screen-reader-only otherwise. */}
        <DialogDescription className={cn("mt-1", !subtitle && "sr-only")}>
          {subtitle ?? title}
        </DialogDescription>
      </DialogHeader>
    </div>
  )
}