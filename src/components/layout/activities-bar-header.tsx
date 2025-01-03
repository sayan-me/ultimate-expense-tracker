"use client"

import { X } from "lucide-react"

type HeaderProps = {
  onClose: () => void
  title: string
}

export const ActivitiesBarHeader = ({ onClose, title }: HeaderProps) => (
  <div className="flex items-center justify-between p-4 border-b">
    <h2 className="text-lg font-semibold">{title}</h2>
    <button
      onClick={onClose}
      className="rounded-full p-1 hover:bg-accent"
      aria-label="Close customization mode"
    >
      <X className="h-5 w-5" />
    </button>
  </div>
) 