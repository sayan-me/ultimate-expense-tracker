"use client"

import { useState, useEffect } from "react"
import { Plus, Minus } from "lucide-react"
import { AddExpenseModal } from "@/components/expense/add-expense-modal"

export function FloatingActionButton() {
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
    const [modalType, setModalType] = useState<"expense" | "income">("expense")

    // Listen for custom events from quick actions
    useEffect(() => {
        const handleOpenExpenseModal = (event: CustomEvent) => {
            setModalType(event.detail?.type || "expense")
            setIsExpenseModalOpen(true)
        }

        window.addEventListener(
            "openExpenseModal",
            handleOpenExpenseModal as EventListener
        )

        return () => {
            window.removeEventListener(
                "openExpenseModal",
                handleOpenExpenseModal as EventListener
            )
        }
    }, [])

    return (
        <>
            {/* Fixed Floating Action Buttons */}
            <div className="fixed bottom-28 right-6 flex flex-col gap-3">
                {/* Add Income Button */}
                <AddExpenseModal
                    defaultType="income"
                    trigger={
                        <button
                            className="w-12 h-12 bg-card border-2 border-green-600 hover:bg-green-50 dark:hover:bg-green-950 text-green-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            aria-label="Add Income"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    }
                />

                {/* Add Expense Button */}
                <AddExpenseModal
                    defaultType="expense"
                    trigger={
                        <button
                            className="w-14 h-14 bg-card border-2 border-red-600 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            aria-label="Add Expense"
                        >
                            <Minus className="h-6 w-6" />
                        </button>
                    }
                />
            </div>

            {/* Modal triggered from quick actions */}
            <AddExpenseModal
                defaultType={modalType}
                trigger={
                    <div style={{ display: "none" }}>
                        <button
                            onClick={() => setIsExpenseModalOpen(true)}
                            style={{
                                display: isExpenseModalOpen ? "block" : "none",
                            }}
                        />
                    </div>
                }
            />
        </>
    )
}
