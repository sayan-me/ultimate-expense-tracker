import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore, createLoadingManager } from '../ui'

/**
 * UI Store Test Suite
 * Tests core UI functionality, edge cases, and state management
 */
describe('UI Store', () => {
  beforeEach(() => {
    useUIStore.setState({
      activitiesBar: {
        isOpen: false,
        isExpanded: false,
        isCustomizing: false,
        customizationTarget: null,
        height: 'minimized'
      },
      modal: {
        activeId: null,
        props: {}
      },
      states: {
        loading: {},
        transition: {},
        overlay: false
      },
      layout: {
        headerHeight: 0,
        bottomNavHeight: 0,
        contentPadding: 16
      },
      navigation: {
        history: [],
        canGoBack: false,
        isTransitioning: false
      },
      status: 'idle',
      error: null
    })
  })

  /**
   * Activities Bar Tests
   * Tests state management for the activities sidebar
   */
  describe('Activities Bar', () => {
    it('should update activities bar state', () => {
      const store = useUIStore.getState()
      store.setActivitiesBar({ isOpen: true, height: 'half' })
      
      // Get fresh state after update
      const updatedState = useUIStore.getState()
      expect(updatedState.activitiesBar.isOpen).toBe(true)
      expect(updatedState.activitiesBar.height).toBe('half')
    })

    it('should handle customization mode', () => {
      const store = useUIStore.getState()
      store.setActivitiesBar({ 
        isCustomizing: true, 
        customizationTarget: 'personal' 
      })
      
      // Get fresh state after update
      const updatedState = useUIStore.getState()
      expect(updatedState.activitiesBar.isCustomizing).toBe(true)
      expect(updatedState.activitiesBar.customizationTarget).toBe('personal')
    })

    // Edge case: Multiple rapid state updates
    it('should handle rapid state updates correctly', () => {
      const store = useUIStore.getState()
      store.setActivitiesBar({ isOpen: true })
      store.setActivitiesBar({ height: 'full' })
      store.setActivitiesBar({ isCustomizing: true })
      
      // Get fresh state after updates
      const updatedState = useUIStore.getState()
      expect(updatedState.activitiesBar).toEqual({
        isOpen: true,
        height: 'full',
        isCustomizing: true,
        isExpanded: false,
        customizationTarget: null
      })
    })
  })

  /**
   * Loading States Tests
   * Tests concurrent loading states and edge cases
   */
  describe('Loading States', () => {
    it('should manage multiple loading states', () => {
      const store = useUIStore.getState()
      const manager = createLoadingManager(store.setLoading)
      
      manager.start(['save', 'validate'])
      // Get fresh state after updates
      let updatedState = useUIStore.getState()
      expect(updatedState.states.loading['save']).toBe(true)
      expect(updatedState.states.loading['validate']).toBe(true)
      
      manager.stop(['save', 'validate'])
      updatedState = useUIStore.getState()
      expect(updatedState.states.loading['save']).toBe(false)
      expect(updatedState.states.loading['validate']).toBe(false)
    })

    // Edge case: Overlapping loading states
    it('should handle overlapping loading states', () => {
      const store = useUIStore.getState()
      store.setLoading('process1', true)
      store.setLoading('process2', true)
      store.setLoading('process1', false)
      
      // Get fresh state after updates
      const updatedState = useUIStore.getState()
      expect(updatedState.states.loading['process1']).toBe(false)
      expect(updatedState.states.loading['process2']).toBe(true)
    })

    // Edge case: Empty loading key
    it('should handle empty loading key gracefully', () => {
      const store = useUIStore.getState()
      store.setLoading('', true)
      expect(store.states.loading['']).toBe(true)
    })
  })

  /**
   * Navigation Tests
   * Tests navigation history management and edge cases
   */
  describe('Navigation History', () => {
    it('should track navigation history correctly', () => {
      const store = useUIStore.getState()
      
      store.pushNavigationEntry('/home')
      store.pushNavigationEntry('/profile')
      expect(store.navigation.history.length).toBe(2)
      expect(store.navigation.canGoBack).toBe(true)
    })

    // Edge case: Pop from empty history
    it('should handle pop on empty history', () => {
      const store = useUIStore.getState()
      const entry = store.popNavigationEntry()
      
      expect(entry).toBeUndefined()
      expect(store.navigation.canGoBack).toBe(false)
    })

    // Edge case: Maximum history limit
    it('should maintain reasonable history size', () => {
      const store = useUIStore.getState()
      
      // Push 100 entries
      Array.from({ length: 100 }).forEach((_, i) => {
        store.pushNavigationEntry(`/page${i}`)
      })
      
      expect(store.navigation.history.length).toBeLessThanOrEqual(50)
    })
  })

  /**
   * Modal Management Tests
   * Tests modal state handling and edge cases
   */
  describe('Modal Management', () => {
    it('should detect active modal', () => {
      const store = useUIStore.getState()
      store.setModal('settings')
      // Get fresh state after update
      const updatedState = useUIStore.getState()
      expect(updatedState.modal.activeId).toBe('settings')
    })

    // Edge case: Modal with empty props
    it('should handle modal with undefined props', () => {
      const store = useUIStore.getState()
      store.setModal('settings', undefined)
      expect(store.modal.props).toEqual({})
    })

    // Edge case: Rapid modal switches
    it('should handle rapid modal switches', () => {
      const store = useUIStore.getState()
      store.setModal('modal1')
      store.setModal('modal2')
      store.setModal('modal3')
      expect(store.modal.activeId).toBe('modal3')
    })
  })

  /**
   * Reset State Tests
   * Tests state reset functionality
   */
  describe('Reset State', () => {
    it('should reset to initial state', () => {
      const store = useUIStore.getState()
      
      // Set various states
      store.setModal('settings')
      store.setActivitiesBar({ isOpen: true })
      store.setLoading('process', true)
      
      // Reset
      store.resetUI()
      
      expect(store).toEqual(expect.objectContaining({
        modal: { activeId: null, props: {} },
        activitiesBar: expect.objectContaining({ isOpen: false }),
        states: expect.objectContaining({ loading: {} })
      }))
    })
  })
}) 