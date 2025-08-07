import { ReactNode } from "react"

export interface BaseModalProps {
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export interface ModalHeaderProps {
  title: string
  subtitle?: string
  onClose?: () => void
  className?: string
}

export interface ModalFixedSectionProps {
  children: ReactNode
  className?: string
}

export interface ModalScrollableContentProps {
  children: ReactNode
  className?: string
  contentClassName?: string
}

export interface ModalFooterProps {
  children: ReactNode
  className?: string
  showBorder?: boolean
}

export interface ModalSize {
  width: string
  height: string
}

export const MODAL_SIZES: Record<NonNullable<BaseModalProps["size"]>, ModalSize> = {
  sm: { width: "w-[80vw] max-w-md", height: "h-auto max-h-[60vh]" },
  md: { width: "w-[90vw] max-w-2xl", height: "h-[70vh]" },
  lg: { width: "w-[95vw] max-w-4xl", height: "h-[80vh]" },
  xl: { width: "w-[98vw] max-w-6xl", height: "h-[90vh]" }
}