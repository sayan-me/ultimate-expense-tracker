/**
 * Utilities for handling swipe gesture animations
 * @example
 * ```tsx
 * function SwipeableComponent() {
 *   const handleSwipe = (e: TouchEvent) => {
 *     const progress = swipeTransition.getProgress(startX, e.touches[0].clientX)
 *     const transform = swipeTransition.getTransform(progress)
 *     element.style.transform = transform
 *   }
 * }
 * ```
 */
export const swipeTransition = {
  /**
   * Calculate swipe progress percentage
   * @param startX - Starting X coordinate of swipe
   * @param currentX - Current X coordinate of swipe
   * @returns Progress percentage (0-100)
   */
  getProgress: (startX: number, currentX: number): number => {
    const diff = currentX - startX
    return Math.min(Math.max((diff / window.innerWidth) * 100, 0), 100)
  },

  /**
   * Get transform style based on swipe progress
   * @param progress - Swipe progress percentage
   * @returns CSS transform value
   */
  getTransform: (progress: number): string => 
    `translateX(${progress}%)`,

  /**
   * Check if swipe should trigger navigation
   * @param startX - Starting X coordinate of swipe
   * @param endX - Ending X coordinate of swipe
   * @returns Boolean indicating if navigation should occur
   */
  shouldNavigate: (startX: number, endX: number): boolean =>
    endX - startX > window.innerWidth * 0.3 // 30% threshold
} 