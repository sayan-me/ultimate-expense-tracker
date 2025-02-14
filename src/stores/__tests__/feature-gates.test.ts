import { describe, it, expect, beforeEach } from 'vitest'
import { useFeatureGatesStore } from '../feature-gates'
import { useAuthStore } from '../auth'
import { resetStores } from '@/tests/test-utils'

describe('Feature Gates Store', () => {
  beforeEach(() => {
    resetStores()
  })

  it('should check feature access based on user level', () => {
    const store = useFeatureGatesStore.getState()
    const auth = useAuthStore.getState()
    
    // Default user level is basic, should not have access to registered features
    expect(store.checkFeatureAccess('group-expenses')).toBe(false)
    
    // Update user level to registered
    auth.setUserLevel('registered')
    expect(store.checkFeatureAccess('group-expenses')).toBe(true)
    
    // Premium features should still be inaccessible
    expect(store.checkFeatureAccess('receipt-scanning')).toBe(false)
  })

  it('should update feature enabled status', async () => {
    const store = useFeatureGatesStore.getState()
    
    await store.updateFeature('group-expenses', true)
    expect(store.features['group-expenses'].isEnabled).toBe(true)
    expect(store.status).toBe('success')
  })

  it('should handle non-existent feature access check', () => {
    const store = useFeatureGatesStore.getState()
    expect(store.checkFeatureAccess('non-existent')).toBe(false)
  })

  it('should handle error during feature update', async () => {
    const store = useFeatureGatesStore.getState()
    
    // Simulate error by trying to update non-existent feature
    await store.updateFeature('non-existent', true)
    expect(store.status).toBe('error')
    expect(store.error).toContain('Failed to update feature')
  })
}) 