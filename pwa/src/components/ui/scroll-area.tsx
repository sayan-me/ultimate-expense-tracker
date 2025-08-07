"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface ScrollAreaProps {
  children: React.ReactNode
  className?: string
}

export function ScrollArea({ children, className }: ScrollAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showTopFade, setShowTopFade] = useState(false)
  const [showBottomFade, setShowBottomFade] = useState(false)

  const checkScroll = () => {
    const element = scrollRef.current
    if (!element) return

    const { scrollTop, scrollHeight, clientHeight } = element
    const isScrollable = scrollHeight > clientHeight
    
    // Show top fade when scrolled down from top
    setShowTopFade(isScrollable && scrollTop > 5)
    
    // Show bottom fade when there's more content to scroll
    const isAtBottom = scrollTop >= scrollHeight - clientHeight - 5
    setShowBottomFade(isScrollable && !isAtBottom)
    
    // Debug logging (remove in production)
    console.log('Scroll check:', {
      scrollTop,
      scrollHeight,
      clientHeight,
      isScrollable,
      showTopFade: isScrollable && scrollTop > 5,
      showBottomFade: isScrollable && !isAtBottom
    })
  }

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    // Check initial state after a short delay to ensure layout is settled
    const initialCheck = setTimeout(checkScroll, 100)
    
    element.addEventListener('scroll', checkScroll)
    
    // Check on resize
    const resizeObserver = new ResizeObserver(() => {
      // Delay resize check to avoid too many calls
      setTimeout(checkScroll, 50)
    })
    resizeObserver.observe(element)

    return () => {
      clearTimeout(initialCheck)
      element.removeEventListener('scroll', checkScroll)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div 
      className={cn(
        "scroll-container h-full min-h-0",
        showTopFade && "show-top-fade",
        showBottomFade && "show-bottom-fade",
        className
      )}
    >
      <div 
        ref={scrollRef}
        className="h-full min-h-0 overflow-y-auto scrollbar-mobile"
      >
        {children}
      </div>
    </div>
  )
}