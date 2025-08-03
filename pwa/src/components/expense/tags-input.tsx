"use client"

import { useState, KeyboardEvent } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DEFAULT_TAGS } from "@/lib/categories"

interface TagsInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
}

export function TagsInput({ 
  value = [], 
  onChange, 
  placeholder = "Type and press Enter to add tags...",
  maxTags = 5 
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState("")

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    
    if (!trimmedTag) return
    if (value.includes(trimmedTag)) return
    if (value.length >= maxTags) return
    
    onChange([...value, trimmedTag])
    setInputValue("")
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(value[value.length - 1])
    }
  }

  const handleDefaultTagClick = (tag: string) => {
    addTag(tag)
  }

  return (
    <div className="space-y-2">
      {/* Input field */}
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length >= maxTags ? `Max ${maxTags} tags` : placeholder}
        disabled={value.length >= maxTags}
      />
      
      {/* Current tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="flex items-center gap-1 px-2 py-1"
            >
              <span className="text-xs">{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                aria-label={`Remove ${tag} tag`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Suggested default tags */}
      {value.length < maxTags && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Quick add:</p>
          <div className="flex flex-wrap gap-1">
            {DEFAULT_TAGS
              .filter(tag => !value.includes(tag))
              .slice(0, 6) // Show max 6 suggestions
              .map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleDefaultTagClick(tag)}
                  className="text-xs bg-muted hover:bg-muted-foreground/20 px-2 py-1 rounded-md transition-colors"
                >
                  {tag}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}