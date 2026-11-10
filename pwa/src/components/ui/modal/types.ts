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

// Below `sm` (640px) every size becomes a full-height bottom sheet instead
// of a centered dialog — see base-modal.tsx. These widths/heights are the
// `sm:` and up behavior only.
export const MODAL_SIZES: Record<NonNullable<BaseModalProps["size"]>, ModalSize> = {
  sm: { width: "sm:w-[80vw] sm:max-w-md", height: "sm:h-auto sm:max-h-[60vh]" },
  md: { width: "sm:w-[90vw] sm:max-w-2xl", height: "sm:h-[70vh] sm:max-h-[85vh]" },
  lg: { width: "sm:w-[95vw] sm:max-w-4xl", height: "sm:h-[80vh] sm:max-h-[85vh]" },
  xl: { width: "sm:w-[98vw] sm:max-w-6xl", height: "sm:h-[90vh] sm:max-h-[90vh]" }
}