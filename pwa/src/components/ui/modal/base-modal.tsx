"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { BaseModalProps, MODAL_SIZES } from "./types"

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
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col p-0",
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
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col p-0",
          className
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}