'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import LoadingSpinner from './loading-spinner'

type LoadingContextType = {
  isLoading: boolean
}

const LoadingContext = createContext<LoadingContextType>({ isLoading: false })

export const useLoading = () => useContext(LoadingContext)

export default function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setLoading] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // This effect runs when the URL parameters change
  useEffect(() => {
    // Start loading
    setLoading(true)
    
    // Set a timeout to simulate the loading process
    const timeoutId = setTimeout(() => {
      setLoading(false)
    }, 800) // Adjust timing as needed
    
    return () => clearTimeout(timeoutId)
  }, [pathname, searchParams])
  
  return (
    <LoadingContext.Provider value={{ isLoading }}>
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-4">
            <LoadingSpinner size="large" />
            <p className="text-lg font-medium text-[#563635]">Updating results...</p>
          </div>
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  )
}