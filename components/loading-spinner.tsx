'use client'

import React from 'react'

export default function LoadingSpinner({ size = 'medium', className = '' }: { size?: 'small' | 'medium' | 'large', className?: string }) {
  const sizeClass = {
    small: 'h-5 w-5',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  }[size]

  return (
    <div className={`border-4 border-[#563635]/20 border-t-[#b7384e] rounded-full animate-spin ${sizeClass} ${className}`}></div>
  )
}