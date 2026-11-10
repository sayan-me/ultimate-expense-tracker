"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Pencil, X, Check } from "lucide-react"
import { useDB } from "@/contexts/db-context"
import type { Category } from "@/lib/db"

const CATEGORY_TYPES: Category["type"][] = ["expense", "income", "both"]

const COLOR_PRESETS = [
  "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#0891b2", "#84cc16", "#059669", "#7c3aed",
]

function ColorSwatchPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_PRESETS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Use color ${color}`}
          aria-pressed={value === color}
          onClick={() => onChange(color)}
          className="h-6 w-6 rounded-full border-2 flex items-center justify-center"
          style={{ backgroundColor: color, borderColor: value === color ? "black" : "transparent" }}
        >
          {value === color && <Check className="h-3 w-3 text-white" />}
        </button>
      ))}
    </div>
  )
}

function AddCategoryForm({ onAdd }: { onAdd: (data: { name: string; type: Category["type"]; color: string }) => void }) {
  const [name, setName] = useState("")
  const [type, setType] = useState<Category["type"]>("expense")
  const [color, setColor] = useState(COLOR_PRESETS[0])

  const handleSubmit = () => {
    if (!name.trim()) return
    onAdd({ name: name.trim(), type, color })
    setName("")
    setColor(COLOR_PRESETS[0])
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="category-name">Category name</Label>
        <Input id="category-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Side Hustle" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="category-type">Category type</Label>
        <Select value={type} onValueChange={(v) => setType(v as Category["type"])}>
          <SelectTrigger id="category-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Color</Label>
        <ColorSwatchPicker value={color} onChange={setColor} />
      </div>
      <Button type="button" onClick={handleSubmit}>
        Add Category
      </Button>
    </div>
  )
}

function CategoryRow({
  category,
  onSave,
  onDelete,
}: {
  category: Category
  onSave: (id: number, changes: { name: string; type: Category["type"]; color: string }) => void
  onDelete: (category: Category) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [type, setType] = useState(category.type)
  const [color, setColor] = useState(category.color)

  const startEdit = () => {
    setName(category.name)
    setType(category.type)
    setColor(category.color)
    setIsEditing(true)
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave(category.id!, { name: name.trim(), type, color })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="space-y-3 rounded-md border p-3">
        <div className="space-y-1">
          <Label htmlFor={`edit-name-${category.id}`}>Edit category name</Label>
          <Input id={`edit-name-${category.id}`} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Select value={type} onValueChange={(v) => setType(v as Category["type"])}>
          <SelectTrigger aria-label={`Edit ${category.name} type`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ColorSwatchPicker value={color} onChange={setColor} />
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={handleSave}>
            Save
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
        <div>
          <p className="font-medium">{category.name}</p>
          <p className="text-sm text-muted-foreground capitalize">{category.type}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {category.isDefault && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Default</span>
        )}
        {!category.isDefault && (
          <>
            <Button type="button" variant="outline" size="icon" aria-label={`Edit ${category.name}`} onClick={startEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`Delete ${category.name}`}
              onClick={() => onDelete(category)}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  const { categories } = useDB()
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null)
  const allCategories = categories.categories ?? []

  const handleAdd = async (data: { name: string; type: Category["type"]; color: string }) => {
    await categories.addCategory({ ...data, icon: "folder", isDefault: false })
  }

  const handleSave = async (id: number, changes: { name: string; type: Category["type"]; color: string }) => {
    await categories.updateCategory(id, changes)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setDeleteError(null)
    try {
      await categories.deleteCategory(pendingDelete.id!)
      setPendingDelete(null)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete category")
      setPendingDelete(null)
    }
  }

  return (
    <div className="py-6 space-y-4">
      <h1 className="text-2xl font-bold">Categories</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" data-testid="category-list">
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          {allCategories.map((category) => (
            <CategoryRow key={category.id} category={category} onSave={handleSave} onDelete={setPendingDelete} />
          ))}
        </CardContent>
      </Card>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {pendingDelete?.name}?</DialogTitle>
            <DialogDescription>This can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Category</CardTitle>
        </CardHeader>
        <CardContent>
          <AddCategoryForm onAdd={handleAdd} />
        </CardContent>
      </Card>
    </div>
  )
}
