import { useSwipeNavigation } from '@/stores/ui'
import { TouchEvent } from 'react'

/**
 * Higher-Order Component that adds swipe navigation capabilities to any component
 * It wraps your component with touch event handlers for right-swipe back navigation
 * 
 * @example
 * ```tsx
 * // Your original component
 * function ProductPage() {
 *   return <div>Product Details</div>
 * }
 * 
 * // Enhanced component with swipe navigation
 * export default withSwipeNavigation(ProductPage)
 * ```
 */
export const withSwipeNavigation = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return function WithSwipeNavigationComponent(props: P) {
    const { handleSwipeBack, isTransitioning } = useSwipeNavigation()
    
    return (
      <div
        className={`transition-transform duration-300 ${
          isTransitioning ? 'translate-x-24' : 'translate-x-0'
        }`}
        onTouchStart={(e: TouchEvent<HTMLDivElement>) => handleSwipeBack.start(e)}
        onTouchMove={(e: TouchEvent<HTMLDivElement>) => handleSwipeBack.move(e)}
        onTouchEnd={(e: TouchEvent<HTMLDivElement>) => handleSwipeBack.end(e)}
      >
        <WrappedComponent {...props} />
      </div>
    )
  }
} 