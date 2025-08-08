"use client"

import { useState, useEffect } from "react"
import { AddExpenseModal } from "@/components/expense/add-expense-modal"

export function ExpenseModalHandler() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<"expense" | "income">("expense")

  useEffect(() => {
    const handleOpenExpenseModal = (event: CustomEvent) => {
      setModalType(event.detail?.type || "expense")
      setIsModalOpen(true)
    }

    window.addEventListener('openExpenseModal', handleOpenExpenseModal as EventListener)
    
    return () => {
      window.removeEventListener('openExpenseModal', handleOpenExpenseModal as EventListener)
    }
  }, [])

  return (
    <AddExpenseModal
      defaultType={modalType}
      open={isModalOpen}
      onOpenChange={setIsModalOpen}
      trigger={<div style={{ display: 'none' }} />}
    />
  )
}