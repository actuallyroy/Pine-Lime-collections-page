'use client'

import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { useLoading } from './loading-provider'

interface SortDropdownProps {
  currentSort?: string
}

export default function SortDropdown({ currentSort = '' }: SortDropdownProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      
      return params.toString()
    },
    [searchParams]
  )
  
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {    
    const params = new URLSearchParams(searchParams.toString())
    const sortBy = e.target.value
    
    if (sortBy) {
      params.set('sortBy', sortBy)
    } else {
      params.delete('sortBy')
    }
    
    router.push(`${pathname}?${params.toString()}`)
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[#563635]/70">Sort by:</span>
      <select 
        className="text-sm border rounded-md border-[#563635]/20 px-2 py-1 bg-white"
        onChange={handleSortChange}
        value={currentSort}
      >
        <option value="">Popularity</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>
    </div>
  )
}