'use client';

import { CollectionItem } from "@/lib/supabase/collections";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { processImageUrl } from "@/utils/process-image-url";

// Define Facebook Pixel ID
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '123456789012345';

interface ProductCardProps {
  product: CollectionItem;
  collectionTitle: string;
}

// Function to track events both via Pixel and server for Conversions API
function trackEvent(eventName: string, eventData?: object) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, eventData);
  }
  
  try {
    fetch('/api/track-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName, eventData, pixelId: FB_PIXEL_ID,
        eventSourceUrl: typeof window !== 'undefined' ? window.location.href : null,
      }),
    });
  } catch (error) {
    console.error('Error sending event to Conversions API:', error);
  }
}

export default function ProductCardClient({ product, collectionTitle }: ProductCardProps) {
  const router = useRouter();
  
  const handleProductClick = () => {
    trackEvent('ViewContent', {
      content_type: 'product',
      content_name: product.title,
      content_ids: [product.id || product.sku],
      content_category: collectionTitle,
      value: product.product_prices[0],
      currency: 'INR'
    });
  };
  
  const handleViewDetailsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Navigate to product page
    router.push(`https://www.pinenlime.com/product/${product.title.replace(/\s+/g, '-').toLowerCase()}`);
  };

  return (
    <div className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <Link 
        href={`https://www.pinenlime.com/product/${product.title.replace(/\s+/g, '-').toLowerCase()}`} 
        onClick={handleProductClick}
        className="block"
      >
        <div className="aspect-square relative bg-white">
          <Image
            src={processImageUrl(product.product_images[0].image_url) || `/product-placeholder.png`}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold line-clamp-2 text-[#563635]">{product.title}</h3>
          <p className="text-[#563635]/70 mt-1 line-clamp-1">{product.description}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[#b7384e] font-bold">₹{product.product_prices.inr[0]}</span>
            <button 
              className="bg-[#563635] hover:bg-[#563635]/90 text-white px-3 py-1 rounded text-sm"
              onClick={handleViewDetailsClick}
            >
              View Details
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
