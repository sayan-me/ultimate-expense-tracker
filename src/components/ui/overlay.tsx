"use client"

type OverlayProps = {
  isVisible: boolean
  onClose: () => void
}

export const Overlay = ({ isVisible, onClose }: OverlayProps) => (
  <div
    onClick={onClose}
    className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}
    aria-hidden="true"
  />
)
