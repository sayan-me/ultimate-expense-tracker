"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDB } from "@/contexts/db-context"

interface CategorySelectorProps {
  type: "expense" | "income"
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function CategorySelector({ type, value, onChange, placeholder = "Select category..." }: CategorySelectorProps) {
  const { categories } = useDB()
  const [open, setOpen] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

  // Filter categories by type
  const filteredCategories = categories.categories?.filter(category => 
    category.type === type || category.type === "both"
  ) || []

  const selectedCategory = filteredCategories.find(category => category.name === value)

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      await categories.addCategory({
        name: newCategoryName.trim(),
        icon: "folder", // Default icon
        color: "#6b7280", // Default gray color
        isDefault: false,
        type
      })

      onChange(newCategoryName.trim())
      setNewCategoryName("")
      setShowCreateDialog(false)
      setOpen(false)
    } catch (error) {
      console.error("Failed to create category:", error)
      // TODO: Add toast notification
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCategory ? (
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: selectedCategory.color }}
                />
                <span>{selectedCategory.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandList>
              <CommandEmpty>
                <div className="flex flex-col items-center gap-2 py-4">
                  <p className="text-sm text-muted-foreground">No categories found.</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateDialog(true)}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Create new category
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {filteredCategories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={(currentValue) => {
                      const selectedValue = typeof currentValue === 'string' ? currentValue : category.name
                      onChange(selectedValue === value ? "" : selectedValue)
                      setOpen(false)
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="flex-1">{category.name}</span>
                      {category.isDefault && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === category.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  onSelect={() => setShowCreateDialog(true)}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new category
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

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
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleCreateCategory()
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
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