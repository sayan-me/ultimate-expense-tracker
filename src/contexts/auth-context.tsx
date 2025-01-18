"use client"

import { type ReactNode, createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  name: string
  email: string
  isAuthenticated: boolean
  featureLevel: "basic" | "registered" | "premium"
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    console.log('Checking auth...')
    try {
      const savedUser = localStorage.getItem('user')
      console.log('Saved user:', savedUser)
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
      console.log('Auth check complete')
    }
  }

  const login = async (email: string, password: string) => {
    console.log('Login attempt with email:', email, 'and password:', password)
    const newUser = {
      id: '1',
      name: 'John Doe',
      email: email,
      isAuthenticated: true,
      featureLevel: "registered" as const
    }
    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const logout = async () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider 
      value={{
        user,
        isLoading,
        isAuthenticated: !!user?.isAuthenticated,
        login,
        logout
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