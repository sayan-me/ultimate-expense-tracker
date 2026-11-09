"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ModalScrollableContentProps } from "./types"

export function ModalScrollableContent({
  children,
  className,
  contentClassName
}: ModalScrollableContentProps) {
  // On mobile, focusing a field near the bottom of the form can land it
  // behind the on-screen keyboard (M2 in the bug report). A short delay
  // lets the keyboard's own layout/animation settle first.
  const handleFocusCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.target
    if (!(target instanceof HTMLElement)) return
    setTimeout(() => {
      target.scrollIntoView({ block: "center", behavior: "smooth" })
    }, 150)
  }

  return (
    <ScrollArea className={cn("flex-1 min-h-0", className)}>
      <div
        className={cn("px-6 space-y-4 pb-4", contentClassName)}
        onFocusCapture={handleFocusCapture}
      >
        {children}
      </div>
    </ScrollArea>
  )
}