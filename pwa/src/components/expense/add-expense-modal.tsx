"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AddExpenseForm } from "./add-expense-form"

interface AddExpenseModalProps {
  defaultType?: "expense" | "income"
  trigger?: React.ReactNode
}

export function AddExpenseModal({ defaultType = "expense", trigger }: AddExpenseModalProps) {
  const [open, setOpen] = useState(false)

  const defaultTrigger = (
    <Button 
      size="lg" 
      className={`${
        defaultType === "expense" 
          ? "bg-red-600 hover:bg-red-700" 
          : "bg-green-600 hover:bg-green-700"
      } shadow-lg`}
    >
      <Plus className="h-5 w-5 mr-2" />
      Add {defaultType}
    </Button>
  )

  const handleSuccess = () => {
    setOpen(false)
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New {defaultType === "expense" ? "Expense" : "Income"}</DialogTitle>
        </DialogHeader>
        <AddExpenseForm
          defaultType={defaultType}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}