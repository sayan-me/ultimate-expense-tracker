"use client"

import { LoginForm } from "@/components/auth/login-form"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthSync } from "@/hooks/use-auth-sync"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/'
  
  // Sync auth context with store
  useAuthSync()

  const handleLoginSuccess = () => {
    console.log('🎉 Login successful, redirecting to:', returnUrl)
    router.push(returnUrl)
  }

  return (
    <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-4">
          <div className="max-w-md mx-auto">
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>
      </div>
    </div>
  )
} 