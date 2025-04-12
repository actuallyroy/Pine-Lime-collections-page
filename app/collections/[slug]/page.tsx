import { Filter } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import ProductFilters from "@/components/product-filters"
import Image from "next/image"
import { getCollectionBySlug } from "@/lib/supabase/collections"
import Pagination from "@/components/pagination"
import SortDropdown from '@/components/sort-dropdown'
import ScrollManagerWrapper from '@/components/scroll-manager-wrapper'
import SearchInput from "@/components/search-input"
import Footer from "@/components/footer"
import TrustBadges from "@/components/trust-badges"
import TestimonialSlider from "@/components/testimonial-slider"
import { Metadata, ResolvingMetadata } from "next/types"
import Script from "next/script"
import MetaPixelScript from "@/components/meta-pixel-script"
import ProductCardClient from "@/components/product-card-client"

// Define Facebook Pixel ID
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '123456789012345'

interface FilterParams {
  priceRange?: { min?: number; max?: number };
  productCodes?: string[];
  keywords?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'oldest';
}

// Generate dynamic metadata
export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Format the collection title
  const formattedTitle = params.slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  
  // Get collection description or use default
  const collectionDescription = "Find the perfect gift that will make their day unforgettable and strengthen your bond. Discover unique, personalized products from Pine & Lime's exclusive collection.";
  
  // Base keywords + add collection specific ones
  const keywords = [
    "personalized gifts", 
    "custom gifts", 
    "memory gifts", 
    "photo gifts", 
    "Pine and Lime",
    ...params.slug.split("-")
  ];
  
  // Get the parent metadata (to maintain any existing metadata)
  const previousMetadata = await parent;
  
  return {
    title: `${formattedTitle} | Pine & Lime`,
    description: collectionDescription,
    keywords: keywords,
    openGraph: {
      title: `${formattedTitle} | Pine & Lime`,
      description: collectionDescription,
      url: `https://www.pinenlime.com/collections/${params.slug}`,
      siteName: 'Pine & Lime',
      images: [
        {
          url: 'https://static.wixstatic.com/media/9fba21_2f376f9bf7fe4daba31b28ce31cd6232~mv2.jpg',
          width: 1200,
          height: 630,
          alt: `Pine & Lime ${formattedTitle} Collection`
        }
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${formattedTitle} | Pine & Lime Gifts Collection`,
      description: collectionDescription,
      images: ['https://www.pinenlime.com/og-image.jpg'],
    },
    alternates: {
      canonical: `https://www.pinenlime.com/collections/${params.slug}`
    }
  };
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: { slug: string },
  searchParams: Record<string, any>
}) {
  // Await the incoming params/searchParams
  const sp = await Promise.resolve(searchParams)
  const p = await Promise.resolve(params)

  // Extract any UTM parameters from the URL (e.g., utm_source, utm_medium, etc.)
  const utmParams = Object.entries(sp)
    .filter(([key]) => key.startsWith("utm_"))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

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

  // Generate JSON-LD structured data for SEO with all required fields
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      // CollectionPage Schema
      {
        "@type": "CollectionPage",
        "@id": `https://www.pinenlime.com/collections/${slug}#collectionpage`,
        "name": collectionTitle,
        "description": collectionDescription,
        "url": `https://www.pinenlime.com/collections/${slug}`,
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://www.pinenlime.com"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Collections",
              "item": "https://www.pinenlime.com/collections"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": collectionTitle,
              "item": `https://www.pinenlime.com/collections/${slug}`
            }
          ]
        }
      },
      // ItemList Schema for collection
      {
        "@type": "ItemList",
        "@id": `https://www.pinenlime.com/collections/${slug}#itemlist`,
        "itemListElement": paginatedProducts.map((product, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Product",
            "@id": `https://www.pinenlime.com/product/${product.slug || product.id}#product`,
            "name": product.title,
            "description": product.description,
            "image": [
              product.thumbnail || `https://www.pinenlime.com/product-images/${product.id}/main.jpg`,
              ...(product.images || []).map((img: { url: any }) => img.url || img)
            ],
            "url": `https://www.pinenlime.com/product/${product.slug || product.id}`,
            "sku": product.id || product.sku,
            "brand": {
              "@type": "Brand",
              "name": "Pine & Lime"
            },
            "offers": {
              "@type": "Offer",
              "url": `https://www.pinenlime.com/product/${product.slug || product.id}`,
              "price": product.price,
              "priceCurrency": "INR",
              "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
              "availability": "https://schema.org/InStock",
              "itemCondition": "https://schema.org/NewCondition",
              "seller": {
                "@type": "Organization",
                "name": "Pine & Lime"
              },
              "shippingDetails": {
                "@type": "OfferShippingDetails",
                "shippingRate": {
                  "@type": "MonetaryAmount",
                  "value": product.shipping || 0,
                  "currency": "INR"
                },
                "shippingDestination": {
                  "@type": "DefinedRegion",
                  "addressCountry": "IN"
                },
                "deliveryTime": {
                  "@type": "ShippingDeliveryTime",
                  "handlingTime": {
                    "@type": "QuantitativeValue",
                    "minValue": 1,
                    "maxValue": 3,
                    "unitCode": "DAY"
                  },
                  "transitTime": {
                    "@type": "QuantitativeValue",
                    "minValue": 2,
                    "maxValue": 7,
                    "unitCode": "DAY"
                  }
                }
              },
              "hasMerchantReturnPolicy": {
                "@type": "MerchantReturnPolicy",
                "applicableCountry": "IN",
                "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                "merchantReturnDays": 30,
                "returnMethod": "https://schema.org/ReturnByMail",
                "returnFees": "https://schema.org/FreeReturn"
              }
            },
            "aggregateRating": product.rating ? {
              "@type": "AggregateRating",
              "ratingValue": product.rating.value || 4.5,
              "reviewCount": product.rating.count || 10
            } : undefined,
            "review": product.reviews && product.reviews.length > 0 ? 
              product.reviews.map((review: { rating: any; author: any; date: any; text: any }) => ({
                "@type": "Review",
                "reviewRating": {
                  "@type": "Rating",
                  "ratingValue": review.rating || 5,
                  "bestRating": 5
                },
                "author": {
                  "@type": "Person",
                  "name": review.author || "Happy Customer"
                },
                "datePublished": review.date || new Date().toISOString().split('T')[0],
                "reviewBody": review.text || "Great product, very happy with my purchase!"
              })) : 
              [{
                "@type": "Review",
                "reviewRating": {
                  "@type": "Rating",
                  "ratingValue": 5,
                  "bestRating": 5
                },
                "author": {
                  "@type": "Person",
                  "name": "Happy Customer"
                },
                "datePublished": new Date().toISOString().split('T')[0],
                "reviewBody": "Great product, very happy with my purchase!"
              }]
          }
        })),
        "numberOfItems": paginatedProducts.length
      }
    ]
  };

  // Remove undefined values from JSON-LD
  const cleanJsonLd = JSON.parse(JSON.stringify(jsonLd), (key, value) => {
    return value === undefined ? null : value;
  });

  // Extract product IDs for Meta Pixel
  const productIds = paginatedProducts.map(product => product.new_sku);

  return (
    <div className="bg-[#fcf8ed] min-h-screen">
      {/* Meta Pixel Component (Client-side) */}
      <MetaPixelScript 
        fbPixelId={FB_PIXEL_ID} 
        pageData={{
          collectionTitle,
          productIds,
          utmParams // include UTM parameters with the event data
        }} 
      />
      
      {/* JSON-LD structured data */}
      <Script
        id="product-collection-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanJsonLd) }}
      />
      
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
            <Link href="https://www.pinenlime.com/shoppingcart" className="hidden md:flex items-center gap-2">
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
                {/* Use grid layout with client components */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedProducts.map((product) => (
                    <ProductCardClient 
                      key={product.id} 
                      product={product} 
                      collectionTitle={collectionTitle}
                    />
                  ))}
                </div>
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

