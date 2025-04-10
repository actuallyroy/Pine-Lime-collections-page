import { Filter, Search } from "lucide-react"
import Link from "next/link"
import ProductGrid from "@/components/product-grid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import ProductFilters from "@/components/product-filters"
import Image from "next/image"
import { CollectionItem, getCollectionBySlug } from "@/lib/supabase/collections"
import Pagination from "@/components/pagination"
import SortDropdown from '@/components/sort-dropdown'
import ScrollManagerWrapper from '@/components/scroll-manager-wrapper'
import SearchInput from "@/components/search-input"
import Footer from "@/components/footer"
import TrustBadges from "@/components/trust-badges"
import TestimonialSlider from "@/components/testimonial-slider"

interface FilterParams {
  priceRange?: { min?: number; max?: number };
  productCodes?: string[];
  keywords?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'oldest';
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: { slug: string },
  searchParams: { 
    page?: string; 
    perPage?: string;
    priceMin?: string;
    priceMax?: string;
    productCode?: string | string[];
    keyword?: string | string[];
    sortBy?: string;
  }
}) {
  // Await the incoming params/seachParams
  const sp = await Promise.resolve(searchParams)
  const p = await Promise.resolve(params)

  // Parse pagination parameters from URL
  const currentPage = Number(sp.page) || 1
  const itemsPerPage = Number(sp.perPage) || 9 // Default to 9 items per page

  // Get collection slug from path params
  const slug = p.slug

  // Parse filter parameters from URL
  const filters: FilterParams = {}

  // Handle price range filter
  if (sp.priceMin || sp.priceMax) {
    filters.priceRange = {
      min: sp.priceMin ? Number(sp.priceMin) : undefined,
      max: sp.priceMax ? Number(sp.priceMax) : undefined
    }
  }

  // Handle product codes filter (can be single string or array)
  if (sp.productCode) {
    const codes = Array.isArray(sp.productCode)
      ? sp.productCode 
      : [sp.productCode]
    filters.productCodes = codes
  }

  // Handle keywords filter
  if (sp.keyword) {
    const keywords = Array.isArray(sp.keyword)
      ? sp.keyword
      : [sp.keyword]
    filters.keywords = keywords
  }

  // Handle sorting
  if (sp.sortBy && ['price_asc', 'price_desc', 'newest', 'oldest'].includes(sp.sortBy)) {
    filters.sortBy = sp.sortBy as 'price_asc' | 'price_desc' | 'newest' | 'oldest'
  }

  // Fetch paginated products with filters
  const paginatedCollection = await getCollectionBySlug(
    slug, 
    currentPage, 
    itemsPerPage, 
    'inr', // Default currency code
    filters
  )

  console.log("Paginated Collection:", paginatedCollection);
  

  let paginatedProducts: any[] = [];
  let totalPages = 0;
  let availableKeywords: string[] = [];  // Add this line to store keywords

  if (paginatedCollection) {
    paginatedProducts = paginatedCollection.data || [];
    totalPages = paginatedCollection.totalPages || 0;
    availableKeywords = paginatedCollection.keywords || [];  // Extract keywords from response
  }

  // Define products order
  const productsOrder = ["HAMPER", "MEMORY_MAP", "REWIND", "REFLECTION", "JOURNEY_MAP", "MUG", "MAGNET", "VINTAGE_POSTER", "DECOR_MAP", "GAME", "ROCKET_RUN"];

  // Function to arrange products in specific order
  function arrange(data: CollectionItem[], productsOrder: string[]): CollectionItem[] {
    let obj: Record<string, CollectionItem[]> = {};
    let lengths: number[] = [];
    productsOrder.forEach((product) => {
      obj[product] = data.filter((item) => item.product_code === product);
      lengths.push(obj[product].length);
    });
    
    let arr: CollectionItem[] = [];
    for (let i = 0; i < Math.max(...lengths); i++) {
      productsOrder.forEach((product) => {
        let productItems = obj[product];
        if (productItems.length > 0) {
          arr.push(productItems[productItems.length - 1]);
          productItems.pop();
        }
      });
    }
    return arr;
  }

  // If products exist, arrange them in the specified order
  if (paginatedProducts.length > 0) {
    paginatedProducts = arrange(paginatedProducts, productsOrder);
  }

  // Extract collection title and description
  const collectionTitle = slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const collectionDescription = "Find the perfect gift that will make their day unforgettable and strengthen your bond.";
  
  // Define testimonials data
  const testimonials = [
    {
      title: "Memory Map",
      quote: "Received the most amazing gift ever.. special mention for your speed delivery and awesome packing.. the product was beyond the expectation. Didn't expect such a wonderful gift. Thank you so much for the best memory map",
      author: "Amreta Y"
    },
    {
      title: "Natural Light Portrait",
      quote: "Pime and lime y'all are simply amazing ..... I loved the frame completely and the way it was packed and sent to me❤️. It was so perfect and I couldn't pack it the same way again but I tried. It's so perfect and at such a reasonable price. Thank you so much for this",
      author: "Neville Vincent"
    },
    {
      title: "Mother and a Child",
      quote: "Delivery time was perfect. I received within 3-4 days. I absolutely loved the sturdy and minimalist packing and the quality of the frame and photos were top notch. I would definitely recommend everyone to check pine and lime who are looking to frame their beautiful memories forever.",
      author: "Priyanka Dwivedi"
    }
  ];

  return (
    <div className="bg-[#fcf8ed] min-h-screen">
      {/* Use the client wrapper directly */}
      <ScrollManagerWrapper />
      
      {/* Header remains unchanged */}
      <header className="border-b border-[#563635]/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="https://www.pinenlime.com" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Pine & Lime" width={32} height={40} className="h-10 w-auto" />
            <span className="text-2xl font-bold text-[#563635]">Pine & Lime</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="https://www.pinenlime.com" className="text-[#563635] hover:text-[#b7384e] transition-colors">
              Home
            </Link>
            <Link href="/collections/all-gifts" className="text-[#b7384e] font-medium">
              Products
            </Link>
            <Link href="https://www.pinenlime.com/FAQs" className="text-[#563635] hover:text-[#b7384e] transition-colors">
              FAQs
            </Link>
            <Link href="https://www.pinenlime.com/contact-us" className="text-[#563635] hover:text-[#b7384e] transition-colors">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-80">
              <SearchInput />
            </div>
            <Link href="https://www.pinenlime.com/shopping-cart" className="hidden md:flex items-center gap-2">
              <Button className="bg-[#b7384e] hover:bg-[#b7384e]/90 text-white">Cart</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section updated with trust badges */}
      <div className="bg-[#563635] text-white py-10 px-4 relative">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{collectionTitle}</h1>
            
            {/* Add trust badges below the collection title */}
            <TrustBadges />
            
            <p className="text-white/90 text-lg mb-6 mt-4">
              {collectionDescription}
            </p>

            {/* Skip to products button for mobile */}
            <div className="md:hidden">
              <a 
                href="#product-grid" 
                className="inline-block mb-6 bg-[#b7384e] hover:bg-[#b7384e]/90 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Skip to Products
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-64 lg:w-72">
            <div className="hidden md:block">
              <h2 className="text-xl font-semibold text-[#563635] mb-4">Filters</h2>
              {/* Pass current filters and available keywords */}
              <ProductFilters 
                currentFilters={filters}
                availableKeywords={availableKeywords}
              />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden w-full mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#fcf8ed]">
                <h2 className="text-xl font-semibold text-[#563635] mb-4">Filters</h2>
                {/* Pass current filters and available keywords */}
                <ProductFilters 
                  currentFilters={filters}
                  availableKeywords={availableKeywords}
                />
              </SheetContent>
            </Sheet>
          </div>
          
          <div id="product-grid" className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-[#563635]">Our Products</h2>
              <SortDropdown currentSort={sp?.sortBy || ''} />
            </div>
            <p className="text-[#563635]/80 mb-8">
              Discover our unique, personalized gifts that help relive happy memories with friends and family. All
              products are manufactured internally and shipped worldwide within 7 days.
            </p>
            
            {/* Show products or no products message */}
            {paginatedProducts.length > 0 ? (
              <>
                <ProductGrid products={paginatedProducts} />
                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination 
                      currentPage={currentPage}
                      totalPages={totalPages}
                      baseUrl={getBaseUrlWithParams(slug, sp)}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center border border-dashed border-[#563635]/20 rounded-lg">
                <p className="text-[#563635]/70 text-lg">No products found matching your filters.</p>
                <Link href={`/collections/${slug}`} className="mt-4 inline-block text-[#b7384e] font-medium">
                  Clear all filters
                </Link>
              </div>
            )}
            
            {/* Add customer reviews section below products with proper background */}
            <div className="mt-16">
              <h2 className="text-2xl md:text-3xl font-bold text-[#563635] text-center mb-8">What Our Customers Say</h2>
              
              {/* Mobile view: Keep slider */}
              <div className="md:hidden bg-[#563635] py-8 px-4 rounded-lg">
                <TestimonialSlider testimonials={testimonials} />
              </div>
              
              {/* Desktop view: Horizontal layout */}
              <div className="hidden md:grid md:grid-cols-3 gap-6">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="bg-[#563635] p-6 rounded-lg text-white">
                    <h3 className="font-semibold text-xl mb-4">{testimonial.title}</h3>
                    <p className="text-white/80 mb-4">"{testimonial.quote}"</p>
                    <p className="text-sm italic">— {testimonial.author}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer remains unchanged */}
      <Footer />
    </div>
  )

  function getBaseUrlWithParams(slug: string, searchParams: Record<string, any>) {
    const newParams = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key !== 'page') {
        if (Array.isArray(value)) {
          value.forEach(v => newParams.append(key, v));
        } else if (value) {
          newParams.set(key, value);
        }
      }
    });
    const queryString = newParams.toString();
    return `/collections/${slug}${queryString ? '?' + queryString : ''}`;
  }
}

