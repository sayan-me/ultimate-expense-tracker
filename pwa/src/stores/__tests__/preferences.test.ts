import { describe, it, expect, beforeEach } from 'vitest'
import { usePreferencesStore } from '../preferences'
import { resetStores } from '@/tests/test-utils'
import type { QuickAction } from '@/types/store'

describe('Preferences Store', () => {
  beforeEach(() => {
    resetStores()
  })

  it('should toggle group mode', () => {
    const store = usePreferencesStore.getState()
    store.toggleGroupMode()
    expect(store.isGroupMode).toBe(true)
  })

  it('should update theme', () => {
    const store = usePreferencesStore.getState()
    store.setTheme('dark')
    expect(store.theme).toBe('dark')
  })

  it('should toggle notifications', () => {
    const store = usePreferencesStore.getState()
    store.toggleNotifications()
    expect(store.notificationsEnabled).toBe(false)
  })

  it('should update personal shortcuts', () => {
    const store = usePreferencesStore.getState()
    const newShortcuts: QuickAction[] = [{
      id: '1',
      icon: 'test',
      label: 'Test',
      action: 'test',
      position: 0
    }]
    
    store.updatePersonalShortcuts(newShortcuts)
    expect(store.personalShortcuts).toEqual(newShortcuts)
  })

  it('should update group shortcuts', () => {
    const store = usePreferencesStore.getState()
    const newShortcuts: QuickAction[] = [{
      id: '1',
      icon: 'test',
      label: 'Test',
      action: 'test',
      position: 0
    }]
    
    store.updateGroupShortcuts(newShortcuts)
    expect(store.groupShortcuts).toEqual(newShortcuts)
  })

  it('should reset preferences to initial state', () => {
    const store = usePreferencesStore.getState()
    
    // Change some settings
    store.setTheme('dark')
    store.toggleGroupMode()
    store.toggleNotifications()
    
    // Reset
    store.resetPreferences()
    
    // Verify reset
    expect(store.theme).toBe('system')
    expect(store.isGroupMode).toBe(false)
    expect(store.notificationsEnabled).toBe(true)
    expect(store.personalShortcuts).toEqual([])
    expect(store.groupShortcuts).toEqual([])
  })
}) 