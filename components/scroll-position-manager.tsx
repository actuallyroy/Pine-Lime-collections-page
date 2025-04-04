'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useLayoutEffect, useRef } from 'react'

export default function ScrollPositionManager() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const scrollPositionRef = useRef<number>(0)
  
  // Store current scroll position before URL changes
  useLayoutEffect(() => {
    // Save current scroll position when component mounts
    scrollPositionRef.current = window.scrollY
    
    // Create a function to handle storing the scroll position when 
    // search params or URL will change
    const handleBeforeNavigation = () => {
      scrollPositionRef.current = window.scrollY
    }
    
    // Add event listener for clicks on links that change search params
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const closestLink = target.closest('a')
      
      if (closestLink && closestLink.href.includes('?') && closestLink.href.includes(pathname)) {
        handleBeforeNavigation()
      }
    })
    
    return () => {
      document.removeEventListener('click', handleBeforeNavigation)
    }
  }, [pathname])
  
  // Restore scroll position after URL changes
  useLayoutEffect(() => {
    // Use requestAnimationFrame to ensure DOM has updated
    window.requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionRef.current)
    })
  }, [searchParams, pathname])
  
  // This component doesn't render anything
  return null
}