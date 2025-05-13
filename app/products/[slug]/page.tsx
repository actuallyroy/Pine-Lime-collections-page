import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Heart, Share2, Star, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import ProductFooter from "@/components/product-footer"
import RelatedProducts from "@/components/related-products"
import ProductReviews from "@/components/product-reviews"
import ProductCustomizer from "@/components/product-customizer"
import Header from "@/components/header"

export default function ProductDetailPage() {
  return (
    <div className="bg-[#fcf8ed] min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center text-sm text-[#563635]/70 mb-6">
          <Link href="/" className="hover:text-[#b7384e]">
            Home
          </Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <Link href="/products" className="hover:text-[#b7384e]">
            Products
          </Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="text-[#563635]">Memory Map</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden border border-[#563635]/10">
              <Badge className="absolute top-4 left-4 z-10 bg-[#b7384e] hover:bg-[#b7384e] text-white">15% OFF</Badge>
              <Image src="/placeholder.svg?height=600&width=600" alt="Memory Map" fill className="object-contain p-4" />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <button
                  key={i}
                  className="relative aspect-square bg-white rounded-md overflow-hidden border border-[#563635]/10 hover:border-[#b7384e] transition-colors"
                >
                  <Image
                    src={`/placeholder.svg?height=150&width=150&text=View ${i}`}
                    alt={`Product view ${i}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-start">
                <h1 className="text-3xl font-bold text-[#563635]">Memory Map</h1>
                <div className="flex gap-2">
                  <button className="p-2 rounded-full hover:bg-[#563635]/5">
                    <Heart className="h-5 w-5 text-[#563635]" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-[#563635]/5">
                    <Share2 className="h-5 w-5 text-[#563635]" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < 4 ? "fill-[#b7384e] text-[#b7384e]" : "text-[#563635]/30"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-[#563635]/70">4.0 (128 reviews)</span>
                <Badge variant="outline" className="border-[#563635]/30 text-[#563635] text-xs ml-2">
                  1,245+ bought
                </Badge>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <span className="text-3xl font-bold text-[#b7384e]">$49.99</span>
                <span className="text-lg text-[#563635]/60 line-through">$59.99</span>
              </div>

              <p className="mt-4 text-[#563635]/80">
                Custom maps highlighting special locations and memories. Perfect for commemorating first dates,
                proposals, favorite trips, or any special place that holds meaning for you and your loved ones.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-[#563635]/70 bg-[#563635]/5 p-3 rounded-md">
              <Truck className="h-5 w-5 text-[#b7384e]" />
              <span>Free express shipping worldwide. Dispatched within 24 hours.</span>
            </div>

            <Separator className="bg-[#563635]/10" />

            <ProductCustomizer />

            <div className="flex gap-4 mt-6">
              <Button className="flex-1 bg-[#b7384e] hover:bg-[#b7384e]/90 text-white py-6 text-lg">Add to Cart</Button>
              <Button variant="outline" className="border-[#563635]/20 text-[#563635] hover:bg-[#563635]/5 py-6">
                Buy Now
              </Button>
            </div>

            <div className="text-sm text-[#563635]/70 space-y-2">
              <p>• Secure checkout with multiple payment options</p>
              <p>• Tamper-proof and secure packaging</p>
              <p>• Auto-delete of uploaded images within 30 days</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="details" className="mt-12">
          <TabsList className="bg-[#563635]/5 text-[#563635]">
            <TabsTrigger value="details" className="data-[state=active]:bg-white">
              Product Details
            </TabsTrigger>
            <TabsTrigger value="specifications" className="data-[state=active]:bg-white">
              Specifications
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-white">
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <div className="bg-white p-6 rounded-lg border border-[#563635]/10">
              <h2 className="text-xl font-semibold text-[#563635] mb-4">About Memory Maps</h2>
              <div className="space-y-4 text-[#563635]/80">
                <p>
                  Our Memory Maps are custom-designed to highlight the special locations that mean the most to you. Each
                  map is carefully crafted to showcase your chosen location with beautiful detail and personalized
                  markers for the exact spots that hold your cherished memories.
                </p>
                <p>
                  Whether it's the place you first met, got engaged, or simply a location that holds special meaning,
                  our Memory Maps transform these coordinates into a beautiful piece of art that tells your unique
                  story.
                </p>
                <p>Each Memory Map includes:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>High-quality print on premium paper</li>
                  <li>Custom title and subtitle of your choice</li>
                  <li>Personalized location markers with custom labels</li>
                  <li>Choice of map styles and color themes</li>
                  <li>Optional date and special message</li>
                  <li>Available in multiple sizes and framing options</li>
                </ul>
                <p>
                  Our Memory Maps make perfect gifts for anniversaries, weddings, birthdays, or any special occasion
                  where you want to celebrate the places that have shaped your story.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="specifications" className="mt-6">
            <div className="bg-white p-6 rounded-lg border border-[#563635]/10">
              <h2 className="text-xl font-semibold text-[#563635] mb-4">Product Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-[#563635]/10">
                    <span className="font-medium text-[#563635]">Materials</span>
                    <span className="text-[#563635]/70">Premium 250gsm matte paper</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#563635]/10">
                    <span className="font-medium text-[#563635]">Available Sizes</span>
                    <span className="text-[#563635]/70">8×10″, 11×14″, 16×20″, 24×36″</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#563635]/10">
                    <span className="font-medium text-[#563635]">Frame Options</span>
                    <span className="text-[#563635]/70">Unframed, Black, White, Walnut</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#563635]/10">
                    <span className="font-medium text-[#563635]">Map Styles</span>
                    <span className="text-[#563635]/70">Classic, Minimal, Vintage, Satellite</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-[#563635]/10">
                    <span className="font-medium text-[#563635]">Customization</span>
                    <span className="text-[#563635]/70">Title, subtitle, markers, message</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#563635]/10">
                    <span className="font-medium text-[#563635]">Production Time</span>
                    <span className="text-[#563635]/70">1-2 business days</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#563635]/10">
                    <span className="font-medium text-[#563635]">Shipping</span>
                    <span className="text-[#563635]/70">Worldwide express delivery</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#563635]/10">
                    <span className="font-medium text-[#563635]">Care Instructions</span>
                    <span className="text-[#563635]/70">Avoid direct sunlight and moisture</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <ProductReviews />
          </TabsContent>
        </Tabs>

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-[#563635] mb-6">You May Also Like</h2>
          <RelatedProducts />
        </div>
      </div>

      <ProductFooter />
    </div>
  )
}

