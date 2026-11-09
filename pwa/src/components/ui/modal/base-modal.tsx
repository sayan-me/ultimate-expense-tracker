"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { BaseModalProps, MODAL_SIZES } from "./types"

// Below `sm` (640px) the dialog becomes a full-height bottom sheet —
// a centered card sized in `vh` doesn't account for a mobile keyboard
// overlaying the viewport (M2 in the bug report). At `sm:` and up it's
// the original centered card, sized per MODAL_SIZES.
const RESPONSIVE_POSITION =
  "inset-x-0 bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0 " +
  "w-full h-[100dvh] max-h-[100dvh] rounded-t-xl rounded-b-none " +
  "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:right-auto " +
  "sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:h-auto"

export function BaseModal({
  children,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  size = "md",
  className
}: BaseModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  // Use external control if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen

  const sizeClasses = MODAL_SIZES[size]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          sizeClasses.width,
          sizeClasses.height,
          "fixed flex flex-col p-0",
          RESPONSIVE_POSITION,
          className
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

// For cases where you need a trigger button
interface BaseModalWithTriggerProps extends BaseModalProps {
  trigger: React.ReactNode
}

export function BaseModalWithTrigger({
  trigger,
  children,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  size = "md",
  className
}: BaseModalWithTriggerProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen

  const sizeClasses = MODAL_SIZES[size]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent
        className={cn(
          sizeClasses.width,
          sizeClasses.height,
          "fixed flex flex-col p-0",
          RESPONSIVE_POSITION,
          className
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}