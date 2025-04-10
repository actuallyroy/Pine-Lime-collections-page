"use client"

import { useEffect, useState } from "react"

export default function ScrollToProductsButton() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const productGrid = document.getElementById('product-grid')
    
    if (!productGrid) return
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Hide button when product grid is visible
        setIsVisible(!entry.isIntersecting)
      },
      { threshold: 0.1 } // When 10% of the target is visible
    )
    
    observer.observe(productGrid)
    
    return () => {
      observer.disconnect()
    }
  }, [])
  
  if (!isVisible) return null
  
  return (
    <div className="md:hidden fixed bottom-4 left-0 right-0 z-10 flex justify-center">
      <a 
        href="#product-grid" 
        className="bg-[#b7384e] text-white font-medium py-3 px-6 rounded-full shadow-lg flex items-center justify-center"
      >
        View Products
      </a>
    </div>
  )
}
