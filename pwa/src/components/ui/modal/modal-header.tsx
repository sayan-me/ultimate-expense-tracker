"use client"

import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </DialogHeader>
    </div>
  )
}