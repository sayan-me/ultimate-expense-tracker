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
      "px-6 pt-4 pb-6 shrink-0 bg-background",
      showBorder && "border-t",
      className
    )}>
      {children}
    </div>
  )
}