"use client"

import { cn } from "@/lib/utils"
import { ModalFixedSectionProps } from "./types"

export function ModalFixedSection({
  children,
  className
}: ModalFixedSectionProps) {
  return (
    <div className={cn("px-6 pb-4 shrink-0", className)}>
      {children}
    </div>
  )
}