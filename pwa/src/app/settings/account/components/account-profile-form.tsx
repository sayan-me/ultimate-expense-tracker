"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/contexts/auth-context"
import { authService } from "@/services/auth.service"
import { CheckCircle, AlertTriangle } from "lucide-react"

export function AccountProfileForm() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Check if anything changed
      if (formData.name === user?.name && formData.email === user?.email) {
        setError("No changes detected")
        return
      }

      // Prepare update data
      const updateData: { name?: string; email?: string } = {}
      if (formData.name !== user?.name) updateData.name = formData.name
      if (formData.email !== user?.email) updateData.email = formData.email

      await authService.updateProfile(updateData.name, updateData.email)
      setSuccess("Profile updated successfully")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const hasChanges = formData.name !== user?.name || formData.email !== user?.email

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange('name')}
            placeholder="Enter your full name"
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            placeholder="Enter your email address"
            disabled={isLoading}
            required
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isLoading || !hasChanges}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            "Update Profile"
          )}
        </Button>
      </div>
    </form>
  )
}