import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../auth'

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      userLevel: 'basic',
      userId: null,
      status: 'idle',
      error: null
    })
  })

  it('should set authentication state', () => {
    useAuthStore.getState().setAuthenticated(true)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('should set user level', () => {
    useAuthStore.getState().setUserLevel('premium')
    expect(useAuthStore.getState().userLevel).toBe('premium')
  })

  it('should reset to initial state', () => {
    useAuthStore.getState().setAuthenticated(true)
    useAuthStore.getState().setUserLevel('premium')
    useAuthStore.getState().resetAuth()
    
    expect(useAuthStore.getState()).toEqual({
      isAuthenticated: false,
      userLevel: 'basic',
      userId: null,
      status: 'idle',
      error: null
    })
  })
}) 