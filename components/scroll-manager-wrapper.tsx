'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function ScrollManagerWrapper() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Store the scroll position in sessionStorage
  useEffect(() => {
    // Get and store the current scroll position when component mounts
    const storeScrollPosition = () => {
      sessionStorage.setItem('scrollPosition', window.scrollY.toString())
    }
    
    // Add listener for when users click filter/sort links
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      // Only store scroll for internal navigation with search params
      if (link && link.href.includes(pathname) && link.href.includes('?')) {
        storeScrollPosition()
      }
    }
    
    document.addEventListener('click', handleLinkClick)
    
    // Restore scroll position if we have one stored from previous navigation
    const savedPosition = sessionStorage.getItem('scrollPosition')
    if (savedPosition && window.history.state?.navigationId > 1) {
      window.requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(savedPosition, 10))
      })
    }
    
    return () => {
      document.removeEventListener('click', handleLinkClick)
    }
  }, [searchParams, pathname])
  
  return null
}