"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ModalScrollableContentProps } from "./types"

export function ModalScrollableContent({
  children,
  className,
  contentClassName
}: ModalScrollableContentProps) {
  return (
    <ScrollArea className={cn("flex-1 min-h-0", className)}>
      <div className={cn("px-6 space-y-4 pb-4", contentClassName)}>
        {children}
      </div>
    </ScrollArea>
  )
}