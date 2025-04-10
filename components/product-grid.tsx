import Image from "next/image"
import Link from "next/link"

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
  extras?: {
    cost?: number
  }
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

export default function ProductGrid({ products = [] }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => {
        // Find primary image or first available image
        const primaryImage = product.product_images.find((img) => img.image_type === "primary") || product.product_images[0]
        
        return (
          <Link 
            key={product.id} 
            href={`/product/${product.id}`} 
            className="group bg-white rounded-lg overflow-hidden border border-[#563635]/10 hover:shadow-md transition-all"
          >
            <div className="aspect-square relative overflow-hidden bg-gray-100">
              {primaryImage && (
                <Image
                  src={primaryImage.image_url}
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
                  {product.extras?.cost ? ' +' : ''}
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

