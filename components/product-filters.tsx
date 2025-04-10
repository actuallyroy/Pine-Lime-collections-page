'use client'

import React, { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { usePathname, useSearchParams } from 'next/navigation'
import { DualRangeSlider } from './dual-slider'

// Filter options
const productTypes = [
  { id: 'MEMORY_MAP', label: 'Memory Maps' },
  { id: 'JOURNEY_MAP', label: 'Journey Maps' },
  { id: 'DECOR_MAP', label: 'Decor Maps' },
  { id: 'VINTAGE_POSTER', label: 'Vintage Posters' },
  { id: 'REFLECTION', label: 'Reflections' },
  { id: 'GAME', label: 'Games' },
  { id: 'PAIGAAM', label: 'Paigaam' }
];

interface ProductFiltersProps {
  currentFilters: {
    priceRange?: {
      min?: number;
      max?: number;
    };
    productCodes?: string[];
    keywords?: string[];
    sortBy?: string;
  };
  availableKeywords?: string[]; // Add this prop
}

export default function ProductFilters({ 
  currentFilters, 
  availableKeywords = [] // Default to empty array
}: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  // State for price slider
  const [priceRange, setPriceRange] = React.useState<number[]>([
    currentFilters.priceRange?.min || 0, 
    currentFilters.priceRange?.max || 5000
  ]);
  
  // Create a URL builder function in the client component
  const buildFilterUrl = (newParams: Record<string, any>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Handle new parameters
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.delete(key); // Remove existing values
        value.forEach(val => params.append(key, String(val)));
      } else {
        params.set(key, String(value));
      }
    });
    
    return `${pathname}?${params.toString()}`;
  };
  
  // Create a function to toggle filters with transition
  const toggleFilter = (key: string, value: string, isChecked: boolean) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      
      if (isChecked) {
        // Add the value
        params.append(key, value);
      } else {
        // Remove the value
        const values = params.getAll(key).filter(v => v !== value);
        params.delete(key);
        values.forEach(v => params.append(key, v));
      }
      
      router.push(`${pathname}?${params.toString()}#product-grid`);
    });
  };
  
  // Get all current product codes and keywords from search params
  const currentProductCodes = searchParams.getAll('productCode');
  const currentKeywords = searchParams.getAll('keyword');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-3">Price Range</h3>
        <DualRangeSlider 
          step={5} 
          min={99} 
          max={5000} 
          value={priceRange}
          onValueChange={(value: number[]) => {
            setPriceRange(value);
          }} 
        />
        <div className="flex items-center justify-between">
          <span>₹{priceRange[0]}</span>
          <span>₹{priceRange[1]}</span>
        </div>
        <div className="mt-2">
          <button
            onClick={() => {
              startTransition(() => {
                router.push(buildFilterUrl({
                  priceMin: priceRange[0],
                  priceMax: priceRange[1]
                }));
              });
            }}
            className="text-sm text-[#b7384e] font-medium"
            disabled={isPending}
          >
            {isPending ? 'Applying...' : 'Apply Price Filter'}
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-3">Product Type</h3>
        <div className="space-y-2">
          {productTypes.map((type) => {
            const isChecked = currentProductCodes.includes(type.id);
            
            return (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`type-${type.id}`} 
                  checked={isChecked}
                  disabled={isPending}
                  onCheckedChange={(checked) => {
                    toggleFilter('productCode', type.id, Boolean(checked));
                  }}
                />
                <label
                  htmlFor={`type-${type.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {type.label}
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-3">Keywords</h3>
        <div className="space-y-2">
          {availableKeywords.map((keyword) => {
            const isChecked = currentKeywords.includes(keyword);
            
            return (
              <div key={keyword} className="flex items-center space-x-2">
                <Checkbox 
                  id={`keyword-${keyword}`} 
                  checked={isChecked}
                  disabled={isPending}
                  onCheckedChange={(checked) => {
                    toggleFilter('keyword', keyword, Boolean(checked));
                  }}
                />
                <label
                  htmlFor={`keyword-${keyword}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {keyword.charAt(0).toUpperCase() + keyword.slice(1)}
                </label>
              </div>
            );
          })}
          {availableKeywords.length === 0 && (
            <p className="text-sm text-gray-500">No keywords available</p>
          )}
        </div>
      </div>

      <div>
        <button
          onClick={() => {
            startTransition(() => {
              router.push(`${pathname}?page=1`);
            });
          }}
          className="text-sm text-[#b7384e] font-medium"
          disabled={isPending}
        >
          Reset All Filters
        </button>
      </div>
    </div>
  );
}

