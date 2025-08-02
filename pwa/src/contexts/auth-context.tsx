"use client"

import { type ReactNode, createContext, useContext, useState, useEffect } from "react"
import { User as FirebaseUser } from 'firebase/auth'
import { authService } from '@/services/auth.service'
import type { AppUser, AuthContextType } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = authService.onAuthStateChange(async (fbUser) => {
      console.log('🔥 Firebase auth state changed:', fbUser?.email || 'No user')
      setFirebaseUser(fbUser)
      
      if (fbUser) {
        // User is signed in, get their profile from user service
        try {
          const userProfile = await authService.getUserProfile()
          if (userProfile) {
            setUser(userProfile)
            setError(null)
          } else {
            // Profile not found, logout
            console.warn('User profile not found, logging out')
            await authService.logout()
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          setError('Failed to load user profile')
        }
      } else {
        // User is signed out
        setUser(null)
        setError(null)
      }
      
      setLoading(false)
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔐 Attempting login with:', email)
      const userProfile = await authService.login(email, password)
      // User state will be updated automatically via the auth state listener
      console.log('✅ Login successful:', userProfile.email)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed'
      console.error('❌ Login failed:', message)
      setError(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('📝 Attempting registration with:', email)
      const userProfile = await authService.register(email, password, name)
      // User state will be updated automatically via the auth state listener
      console.log('✅ Registration successful:', userProfile.email)
      return userProfile
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      console.error('❌ Registration failed:', message)
      setError(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🚪 Logging out...')
      await authService.logout()
      // User state will be updated automatically via the auth state listener
      console.log('✅ Logout successful')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Logout failed'
      console.error('❌ Logout failed:', message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <AuthContext.Provider 
      value={{
        user,
        firebaseUser,
        loading,
        error,
        login,
        register,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}