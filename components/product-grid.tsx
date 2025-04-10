"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Product {
  id: string
  title: string
  description: string
  product_images: {
    id: number
    image_url: string
    image_type: string
    product_id: string
  }[]
  extras?: string;
  product_prices?: {
    [currency: string]: number[] | string | number;
    sku: string;
    name: string;
    max_price: number;
    min_price: number;
  }
}

interface ProductGridProps {
  products: Product[]
}

// Utility function to process image URLs
const processImageUrl = (imageUrl: string, isMobile: boolean = false): string => {
  // Handle Wix image URLs
  if (imageUrl.startsWith("wix:image://")) {
    // Extract image ID and filename from wix URL format
    let mediaId, filename;
    
    try {
      // wix:image://v1/9fba21_a8d2f9ec83f647fca5c9b3286926e3e1~mv2.png/FC0081.png
      const withoutPrefix = imageUrl.replace("wix:image://", "");
      const parts = withoutPrefix.split("/");
      
      // Get the media ID (part with ~mv2)
      mediaId = parts.find(part => part.includes("~mv2")) || parts[0];
      
      // Get the filename (usually the last part)
      filename = parts[parts.length - 1].split("#")[0];
    } catch (e) {
      console.error("Error parsing Wix image URL:", e);
      return imageUrl;
    }
    
    // Build the transformed URL based on the provided example
    const width = isMobile ? 900 : 500;
    const height = isMobile ? 900 : 500;
    
    return `https://static.wixstatic.com/media/${mediaId}/v1/fill/w_${width},h_${height},al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/${encodeURIComponent(filename)}`;
  }
  
  // Handle URLs with width parameters
  if (imageUrl.includes("?width")) {
    try {
      const url = new URL(imageUrl);
      return isMobile 
        ? `${url.origin}${url.pathname}?width=900&format=webp`
        : `${url.origin}${url.pathname}?width=500&format=webp`;
    } catch (e) {
      // If URL parsing fails, return the original URL
      return imageUrl;
    }
  }
  
  // Return original URL if no processing needed
  return imageUrl;
}

export default function ProductGrid({ products = [] }: ProductGridProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile device on client side
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => {
        // Find primary image or first available image
        const primaryImage = product.product_images.find((img) => img.image_type === "primary") || product.product_images[0]
        
        // Process the image URL
        const imageUrl = primaryImage ? processImageUrl(primaryImage.image_url, isMobile) : "";
        
        return (
          <Link 
            key={product.id} 
            href={`https://www.pinenlime.com/product/${product.title.toLowerCase().replace(/\s+/g, '-')}`} 
            className="group bg-white rounded-lg overflow-hidden border border-[#563635]/10 hover:shadow-md transition-all"
          >
            <div className="aspect-square relative overflow-hidden bg-gray-100">
              {primaryImage && (
                <Image
                  src={imageUrl}
                  alt={product.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-[#563635] group-hover:text-[#b7384e] transition-colors">
                {product.title}
              </h3>
              <p className="text-sm text-[#563635]/70 line-clamp-2 mt-1">{product.description}</p>
              <div className="mt-2 flex justify-between items-center" >
                <span className="font-bold text-[#b7384e]">
                  {product.product_prices?.inr 
                    ? Array.isArray(product.product_prices.inr) && product.product_prices.inr.length > 0
                      ? `₹${product.product_prices.inr[0].toLocaleString('en-IN')}`
                      : typeof product.product_prices.inr === 'number'
                        ? `₹${product.product_prices.inr.toLocaleString('en-IN')}`
                        : 'Price unavailable'
                    : 'Price unavailable'}
                </span>
                <span className="text-xs text-[#563635]/60">Personalized Gift</span>
              </div>
            </div>
          </Link>
        )
      })}
      
      {/* Fallback if no products are provided */}
      {products.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-[#563635]/70">No products found in this collection.</p>
        </div>
      )}
    </div>
  )
}

