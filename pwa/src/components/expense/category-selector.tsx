"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useDB } from "@/contexts/db-context"

interface CategorySelectorProps {
    type: "expense" | "income"
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export function CategorySelector({
    type,
    value,
    onChange,
    placeholder = "Select or type category...",
}: CategorySelectorProps) {
    const { categories } = useDB()
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Check if categories are loading
    const isLoading = categories.categories === undefined

    // Filter categories by type
    const filteredCategories =
        categories.categories?.filter(
            (category) => category.type === type || category.type === "both"
        ) || []

    // Filter by search query
    const matchingCategories = filteredCategories.filter((category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
    )


    // Set search query to current value when opening
    useEffect(() => {
        if (isOpen) {
            setSearchQuery(value || "")
            // Focus input after dropdown is rendered
            setTimeout(() => {
                inputRef.current?.focus()
                inputRef.current?.select()
            }, 50)
        } else {
            setSearchQuery("")
        }
    }, [isOpen, value])

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                !inputRef.current?.contains(event.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
            return () => document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setSearchQuery(newValue)
        setIsOpen(true)
    }

    const handleInputClick = () => {
        setIsOpen(true)
    }

    const handleCategorySelect = (categoryName: string) => {
        onChange(categoryName)
        setSearchQuery(categoryName)
        setIsOpen(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()
            if (matchingCategories.length > 0) {
                // Select first match
                handleCategorySelect(matchingCategories[0].name)
            } else if (searchQuery.trim()) {
                // Create new category
                setNewCategoryName(searchQuery.trim())
                setShowCreateDialog(true)
                setIsOpen(false)
            }
        } else if (e.key === "Escape") {
            setIsOpen(false)
            setSearchQuery(value || "")
        }
    }

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return

        try {
            await categories.addCategory({
                name: newCategoryName.trim(),
                icon: "folder", // Default icon
                color: "#6b7280", // Default gray color
                isDefault: false,
                type,
            })

            onChange(newCategoryName.trim())
            setSearchQuery(newCategoryName.trim())
            setNewCategoryName("")
            setShowCreateDialog(false)
        } catch (error) {
            console.error("Failed to create category:", error)
            // TODO: Add toast notification
        }
    }

    const clearSelection = () => {
        onChange("")
        setSearchQuery("")
        inputRef.current?.focus()
    }

    return (
        <>
            <div className="relative">
                <div className="relative">
                    <Input
                        ref={inputRef}
                        value={isOpen ? searchQuery : value}
                        onChange={handleInputChange}
                        onClick={handleInputClick}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="pr-16"
                        autoComplete="off"
                    />
                    <div className="absolute right-1 top-1 flex items-center gap-1">
                        {value && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={clearSelection}
                                className="h-8 w-8 p-0 hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsOpen(!isOpen)}
                            className="h-8 w-8 p-0 hover:bg-muted"
                        >
                            <ChevronDown
                                className={cn(
                                    "h-4 w-4 transition-transform",
                                    isOpen && "rotate-180"
                                )}
                            />
                        </Button>
                    </div>
                </div>

                {/* Dropdown */}
                {isOpen && (
                    <div
                        ref={dropdownRef}
                        className="absolute top-full left-0 right-0 mt-1 z-[60] max-h-64 overflow-hidden rounded-md border bg-popover shadow-lg"
                    >
                        <div className="max-h-64 overflow-y-auto scrollbar-thin p-1">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <p className="text-sm text-muted-foreground">
                                        Loading categories...
                                    </p>
                                </div>
                            ) : matchingCategories.length === 0 ? (
                                <div className="p-2">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        No categories found.
                                    </p>
                                    {searchQuery.trim() && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setNewCategoryName(searchQuery.trim())
                                                setShowCreateDialog(true)
                                                setIsOpen(false)
                                            }}
                                            className="w-full justify-start gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Create &quot;{searchQuery.trim()}&quot;
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowCreateDialog(true)
                                            setIsOpen(false)
                                        }}
                                        className="w-full justify-start gap-2 mt-1"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Create new category
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {matchingCategories.map((category) => (
                                        <button
                                            key={category.id}
                                            type="button"
                                            onClick={() => handleCategorySelect(category.name)}
                                            className="flex w-full items-center gap-2 p-2 text-left hover:bg-accent rounded-sm transition-colors"
                                        >
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{
                                                    backgroundColor: category.color,
                                                }}
                                            />
                                            <span className="flex-1 text-sm">
                                                {category.name}
                                            </span>
                                            {category.isDefault && (
                                                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                    Default
                                                </span>
                                            )}
                                            {value === category.name && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )}
                                        </button>
                                    ))}
                                    <div className="border-t mt-1 pt-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setShowCreateDialog(true)
                                                setIsOpen(false)
                                            }}
                                            className="w-full justify-start gap-2 text-primary"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Create new category
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Category Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="categoryName">Category Name</Label>
                            <Input
                                id="categoryName"
                                placeholder="Enter category name..."
                                value={newCategoryName}
                                onChange={(e) =>
                                    setNewCategoryName(e.target.value)
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        handleCreateCategory()
                                    }
                                }}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleCreateCategory}
                                disabled={!newCategoryName.trim()}
                            >
                                Create Category
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowCreateDialog(false)
                                    setNewCategoryName("")
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}