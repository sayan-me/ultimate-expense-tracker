import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useActivities, ActivitiesProvider } from './activities-context'

describe('ActivitiesContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ActivitiesProvider>{children}</ActivitiesProvider>
  )

  it('initializes with default values', () => {
    const { result } = renderHook(() => useActivities(), { wrapper })
    
    expect(result.current.isActivitiesBarOpen).toBe(false)
    expect(result.current.isCustomizing).toBe(false)
    expect(result.current.isGroupMode).toBe(false)
    expect(result.current.selectedQuickActions.length).toBeLessThanOrEqual(9)
  })

  it('toggles activities bar', () => {
    const { result } = renderHook(() => useActivities(), { wrapper })
    
    act(() => {
      result.current.toggleActivitiesBar()
    })
    
    expect(result.current.isActivitiesBarOpen).toBe(true)
  })

  it('toggles customization mode', () => {
    const { result } = renderHook(() => useActivities(), { wrapper })
    
    act(() => {
      result.current.toggleCustomizationMode(true)
    })
    
    expect(result.current.isCustomizing).toBe(true)
    expect(result.current.isActivitiesBarOpen).toBe(true)
  })

  it('toggles between personal and group modes', () => {
    const { result } = renderHook(() => useActivities(), { wrapper })
    
    act(() => {
      result.current.toggleMode()
    })
    
    expect(result.current.isGroupMode).toBe(true)
    expect(result.current.actions[0].label).toBe('Log Group Transactions')
  })

  it('manages quick actions selection', () => {
    const { result } = renderHook(() => useActivities(), { wrapper })
    const newAction = result.current.actions[0]
    
    act(() => {
      result.current.toggleQuickAction(newAction)
    })
    
    expect(result.current.selectedQuickActions).toContainEqual(newAction)
    
    act(() => {
      result.current.toggleQuickAction(newAction)
    })
    
    expect(result.current.selectedQuickActions).not.toContainEqual(newAction)
  })

  it('persists quick actions to localStorage', () => {
    const { result } = renderHook(() => useActivities(), { wrapper })
    const newAction = result.current.actions[0]
    
    act(() => {
      result.current.toggleQuickAction(newAction)
    })
    
    const stored = localStorage.getItem('quickActions')
    expect(stored).not.toBeNull()
    expect(JSON.parse(stored!)).toContainEqual(newAction)
  })
}) 