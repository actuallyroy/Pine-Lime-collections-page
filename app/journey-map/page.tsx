"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Heart, Plus, ShoppingCart, Share2, Settings } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import ProductHeader from "@/components/product-header"
import ProductFooter from "@/components/product-footer"
import JourneyMapCustomizer from "@/components/journey-map-customizer"
import { cn } from "@/lib/utils"
import ShareModal from "@/components/share-modal"
import { MapStyle, fetchMapStyles, getStyleImageById } from "@/lib/map-styles"

export default function JourneyMapPage() {
  const [frame, setFrame] = useState("none")
  const [size, setSize] = useState("a3")
  const [price, setPrice] = useState(69.99)
  const [originalPrice, setOriginalPrice] = useState(79.99)
  const [isSticky, setIsSticky] = useState(false)
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false)
  const [mapData, setMapData] = useState<any>({
    title: "Our Journey",
    style: "mapbox://styles/pinenlime/ckknu6rsw62dq17nubbhdk7zg",
    showLabels: true,
    routeType: "none",
    zoom: 12,
    markers: [],
  })
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [mapStyles, setMapStyles] = useState<MapStyle[]>([])
  const [currentStyleImage, setCurrentStyleImage] = useState<string | null>(null)

  // Fetch map styles
  useEffect(() => {
    const getStyles = async () => {
      try {
        const styles = await fetchMapStyles();
        setMapStyles(styles);
        
        // Find the current style image
        if (mapData.style) {
          const styleImage = getStyleImageById(styles, mapData.style);
          if (styleImage) {
            setCurrentStyleImage(styleImage);
          }
        }
      } catch (error) {
        console.error('Error fetching map styles:', error);
      }
    };
    
    getStyles();
  }, [mapData.style]);

  // Handle scroll for sticky add to cart on mobile
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsSticky(scrollPosition > 500)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Update price based on selections
  useEffect(() => {
    const basePrice = size === "a3" ? 69.99 : 89.99
    const framePrice = frame === "none" ? 0 : frame === "teak" ? 39.99 : 29.99

    setPrice(basePrice + framePrice)
    setOriginalPrice((basePrice + framePrice) * 1.15) // 15% off
  }, [size, frame])

  // Open the customizer
  const handleOpenCustomizer = () => {
    setIsCustomizerOpen(true)
  }

  // Close the customizer
  const handleCloseCustomizer = () => {
    setIsCustomizerOpen(false)
  }

  // Save customization data
  const handleSaveCustomization = (data: any) => {
    setMapData(data)
    setIsCustomizerOpen(false)
    
    // Find and update the current style image
    if (data.style && mapStyles.length > 0) {
      const styleImage = getStyleImageById(mapStyles, data.style);
      if (styleImage) {
        setCurrentStyleImage(styleImage);
      }
    }
  }

  return (
    <div className="bg-[#fcf8ed] min-h-screen">
      <ProductHeader />

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
          <span className="text-[#563635]">Journey Map</span>
        </div>

        <div className="lg:grid lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="lg:sticky lg:top-4 space-y-4 mb-8 lg:mb-0">
            <div className="relative bg-white rounded-lg overflow-hidden border border-[#563635]/10 shadow-sm">
              <Badge className="absolute top-4 left-4 z-10 bg-[#b7384e] hover:bg-[#b7384e] text-white">15% OFF</Badge>
              <div className="aspect-[3/4] relative">
                {mapData.markers.length > 0 ? (
                  <div className="w-full h-full relative">
                    <Image
                      src={currentStyleImage || `/placeholder.svg?height=600&width=450&text=${encodeURIComponent(mapData.title)}`}
                      alt="Custom Journey Map"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 450px"
                    />

                    {/* Map title */}
                    <div className="absolute left-1/2 bottom-8 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded shadow-md">
                      <div className="text-center text-lg font-medium text-[#563635]">{mapData.title}</div>
                    </div>

                    {/* Markers */}
                    {mapData.markers.map((marker: any, index: number) => (
                      <div
                        key={index}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                        style={{
                          left: `${marker.position.x}%`,
                          top: `${marker.position.y}%`,
                        }}
                      >
                        <div className="relative">
                          <div className="text-3xl">{marker.emoji}</div>
                          {marker.label && (
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded text-xs whitespace-nowrap mt-1 shadow-sm">
                              {marker.label}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Routes between markers */}
                    {mapData.routeType !== "none" && mapData.markers.length > 1 && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {mapData.markers.slice(0, -1).map((marker: any, index: number) => (
                          <line
                            key={index}
                            x1={`${marker.position.x}%`}
                            y1={`${marker.position.y}%`}
                            x2={`${mapData.markers[index + 1].position.x}%`}
                            y2={`${mapData.markers[index + 1].position.y}%`}
                            stroke="#b7384e"
                            strokeWidth="2"
                            strokeDasharray={mapData.routeType === "air" ? "5,5" : "none"}
                          />
                        ))}
                      </svg>
                    )}
                  </div>
                ) : (
                  <Image
                    src="/placeholder.svg?height=600&width=450&text=Journey%20Map"
                    alt="Journey Map"
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            </div>
            <div className="hidden lg:block text-center text-sm text-[#563635]/70">
              Click "Customize" to create your personalized journey map
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-lg border border-[#563635]/10 p-6 shadow-sm">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#563635]">Journey Map</h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill={i < 5 ? "#b7384e" : "none"}
                      stroke={i < 5 ? "#b7384e" : "#563635"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-[#563635]/70">5.0 (42 reviews)</span>
                <Badge variant="outline" className="border-[#563635]/30 text-[#563635] text-xs ml-2">
                  987+ bought
                </Badge>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-3xl font-bold text-[#b7384e]">${price.toFixed(2)}</span>
                <span className="text-lg text-[#563635]/60 line-through">${originalPrice.toFixed(2)}</span>
              </div>
              <p className="mt-4 text-[#563635]/80">
                Visualize your travels and adventures in a beautiful custom map. Perfect for commemorating road trips,
                backpacking journeys, or any adventure that took you to multiple destinations.
              </p>
            </div>

            {/* Product Options */}
            <div className="space-y-6">
              {/* Frame Selection */}
              <div>
                <h3 className="text-lg font-medium text-[#563635] mb-3">Frame</h3>
                <RadioGroup value={frame} onValueChange={setFrame} className="flex flex-wrap gap-3">
                  {[
                    { value: "none", label: "Unframed", price: "+$0" },
                    { value: "black", label: "Black Frame", price: "+$29.99" },
                    { value: "white", label: "White Frame", price: "+$29.99" },
                    { value: "teak", label: "Teak Frame", price: "+$39.99" },
                  ].map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`frame-${option.value}`}
                      className={`flex items-center justify-between px-4 py-3 border rounded-md cursor-pointer ${
                        frame === option.value
                          ? "border-[#b7384e] bg-[#b7384e]/5"
                          : "border-[#563635]/20 hover:border-[#563635]/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id={`frame-${option.value}`} value={option.value} className="sr-only" />
                        {frame === option.value && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 text-[#b7384e]"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        <span className={frame === option.value ? "text-[#b7384e]" : "text-[#563635]"}>
                          {option.label}
                        </span>
                      </div>
                      <span className={`text-sm ${frame === option.value ? "text-[#b7384e]" : "text-[#563635]/70"}`}>
                        {option.price}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Size Selection */}
              <div>
                <h3 className="text-lg font-medium text-[#563635] mb-3">Size</h3>
                <RadioGroup value={size} onValueChange={setSize} className="flex flex-wrap gap-3">
                  {[
                    { value: "a3", label: "A3 (12 × 16 in)", price: "$69.99" },
                    { value: "a2", label: "A2 (16 × 23 in)", price: "$89.99" },
                  ].map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`size-${option.value}`}
                      className={`flex items-center justify-between px-4 py-3 border rounded-md cursor-pointer ${
                        size === option.value
                          ? "border-[#b7384e] bg-[#b7384e]/5"
                          : "border-[#563635]/20 hover:border-[#563635]/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id={`size-${option.value}`} value={option.value} className="sr-only" />
                        {size === option.value && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 text-[#b7384e]"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        <span className={size === option.value ? "text-[#b7384e]" : "text-[#563635]"}>
                          {option.label}
                        </span>
                      </div>
                      <span className={`text-sm ${size === option.value ? "text-[#b7384e]" : "text-[#563635]/70"}`}>
                        {option.price}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Customization Status */}
              <div className="p-4 bg-[#563635]/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-[#563635]">Map Customization</h3>
                    <p className="text-sm text-[#563635]/70 mt-1">
                      {mapData.markers.length > 0
                        ? `${mapData.markers.length} markers added to your map`
                        : "No markers added yet"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsShareModalOpen(true)}
                      className="h-10 w-10 bg-white border-[#563635]/20 shadow-md"
                    >
                      <Share2 className="h-5 w-5" />
                      <span className="sr-only">Share</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsCustomizerOpen(true)}
                      className="h-10 w-10 bg-white border-[#563635]/20 shadow-md"
                    >
                      <Settings className="h-5 w-5" />
                      <span className="sr-only">Customize</span>
                  </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button className="flex-1 bg-[#b7384e] hover:bg-[#b7384e]/90 text-white py-6 text-lg">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" className="border-[#563635]/20 text-[#563635] hover:bg-[#563635]/5 py-6">
                  <Heart className="h-5 w-5 mr-2" />
                  Save
                </Button>
              </div>

              <div className="text-sm text-[#563635]/70 space-y-2">
                <p className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="M7 15h0M2 9.5h20" />
                  </svg>
                  Secure checkout with multiple payment options
                </p>
                <p className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Tamper-proof and secure packaging
                </p>
                <p className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2" className="h-4 w-4" />
                    <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v1.5" />
                    <path d="M16 2v4" />
                    <path d="M8 2v4" />
                    <path d="M3 10h18" />
                    <path d="M3 14h18" />
                    <path d="M3 18h18" />
                  </svg>
                  Auto-delete of uploaded images within 30 days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Add to Cart for Mobile */}
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 bg-white border-t border-[#563635]/10 p-4 flex items-center justify-between lg:hidden transition-transform duration-300",
            isSticky ? "translate-y-0" : "translate-y-full",
          )}
        >
          <div>
            <div className="text-lg font-bold text-[#b7384e]">${price.toFixed(2)}</div>
            <div className="text-sm text-[#563635]/60 line-through">${originalPrice.toFixed(2)}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-[#b7384e] text-[#b7384e]" onClick={handleOpenCustomizer}>
              Customize
            </Button>
            <Button className="bg-[#b7384e] hover:bg-[#b7384e]/90 text-white">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="specs" className="w-full">
            <TabsList className="bg-[#563635]/5 text-[#563635] w-full justify-start">
              <TabsTrigger value="specs" className="data-[state=active]:bg-white">
                Specifications
              </TabsTrigger>
              <TabsTrigger value="shipping" className="data-[state=active]:bg-white">
                Shipping & Returns
              </TabsTrigger>
              <TabsTrigger value="faq" className="data-[state=active]:bg-white">
                FAQ
              </TabsTrigger>
              <TabsTrigger value="reviews" className="data-[state=active]:bg-white">
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="specs" className="mt-6">
              <div className="bg-white p-6 rounded-lg border border-[#563635]/10">
                <h2 className="text-xl font-semibold text-[#563635] mb-4">Product Specifications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-[#563635]/10">
                      <span className="font-medium text-[#563635]">Paper Weight</span>
                      <span className="text-[#563635]/70">Premium 250gsm matte paper</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#563635]/10">
                      <span className="font-medium text-[#563635]">Available Sizes</span>
                      <span className="text-[#563635]/70">A3 (12×16″), A2 (16×23″)</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#563635]/10">
                      <span className="font-medium text-[#563635]">Frame Material</span>
                      <span className="text-[#563635]/70">Black, White, or Teak wood</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-[#563635]/10">
                      <span className="font-medium text-[#563635]">Protective Cover</span>
                      <span className="text-[#563635]/70">Acrylic front (framed options)</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#563635]/10">
                      <span className="font-medium text-[#563635]">Mounting</span>
                      <span className="text-[#563635]/70">Hardware included with frames</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#563635]/10">
                      <span className="font-medium text-[#563635]">Maximum Pins</span>
                      <span className="text-[#563635]/70">15 custom locations</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shipping" className="mt-6">
              <div className="bg-white p-6 rounded-lg border border-[#563635]/10">
                <h2 className="text-xl font-semibold text-[#563635] mb-4">Shipping & Returns</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-[#563635] mb-2">Shipping Times</h3>
                    <ul className="list-disc pl-5 space-y-1 text-[#563635]/80">
                      <li>India: 2-3 business days</li>
                      <li>United States: 5-7 business days</li>
                      <li>Europe: 5-7 business days</li>
                      <li>Rest of World: 7-10 business days</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#563635] mb-2">Returns Policy</h3>
                    <p className="text-[#563635]/80">
                      As Journey Maps are custom-made products, they cannot be returned for change of mind. However, if
                      your map arrives damaged, we offer one free reprint. Please contact our customer service team
                      within 7 days of delivery with photos of the damage.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#563635] mb-2">Tracking</h3>
                    <p className="text-[#563635]/80">
                      All orders include tracking information that will be sent to your email once your order is
                      dispatched.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="faq" className="mt-6">
              <div className="bg-white p-6 rounded-lg border border-[#563635]/10">
                <h2 className="text-xl font-semibold text-[#563635] mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-[#563635] mb-2">How do I customize my map?</h3>
                    <p className="text-[#563635]/80">
                      Click the "Customize" button on the product page to open our interactive map editor. You can
                      search for locations, add markers with custom emojis and labels, choose map styles, and add routes
                      between your markers.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#563635] mb-2">Can I edit my map after ordering?</h3>
                    <p className="text-[#563635]/80">
                      Once an order is placed, we begin production immediately. Minor edits may be possible if requested
                      within 2 hours of placing your order. Please contact our customer service team immediately.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#563635] mb-2">Can I upload custom emoji or icons?</h3>
                    <p className="text-[#563635]/80">
                      Currently, we only support our standard emoji set. Custom icon uploads are planned for a future
                      update.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#563635] mb-2">What if my location isn't found?</h3>
                    <p className="text-[#563635]/80">
                      We support approximately 12,000 cities worldwide. If your specific location isn't found, try
                      searching for the nearest major city and then adding pins to mark your exact locations.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <div className="bg-white p-6 rounded-lg border border-[#563635]/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#563635]">Customer Reviews</h2>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="#b7384e"
                          stroke="#b7384e"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-5 w-5"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <span className="font-medium text-[#563635]">5.0</span>
                    <span className="text-sm text-[#563635]/70">(42 reviews)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="border border-[#563635]/10 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-[#563635]/10 flex items-center justify-center text-[#563635] font-medium">
                            {["JD", "SM", "AK", "RL"][i - 1]}
                          </div>
                          <div>
                            <div className="font-medium text-[#563635]">
                              {["John D.", "Sarah M.", "Alex K.", "Rachel L."][i - 1]}
                            </div>
                            <div className="text-xs text-[#563635]/70">
                              {["March 15, 2023", "February 2, 2023", "January 18, 2023", "December 5, 2022"][i - 1]}
                            </div>
                          </div>
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, j) => (
                            <svg
                              key={j}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="#b7384e"
                              stroke="#b7384e"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <h3 className="font-medium text-[#563635] mb-1">
                        {
                          [
                            "Perfect anniversary gift!",
                            "Beautifully crafted map",
                            "Exceeded expectations",
                            "A treasured keepsake",
                          ][i - 1]
                        }
                      </h3>
                      <p className="text-sm text-[#563635]/80">
                        {
                          [
                            "I ordered this for our 5th anniversary to show all the places we've traveled together. The quality is amazing and my husband absolutely loved it!",
                            "The detail on this map is incredible. I got it to commemorate a cross-country road trip and it's now the centerpiece of my living room.",
                            "The customization options were perfect and the final product looks even better in person. Shipping was fast too!",
                            "This map tells the story of our family vacations over the years. The quality is outstanding and it arrived beautifully packaged.",
                          ][i - 1]
                        }
                      </p>
                      <div className="mt-3">
                        <Image
                          src={`/placeholder.svg?height=100&width=100&text=Review ${i}`}
                          alt="Customer review photo"
                          width={100}
                          height={100}
                          className="rounded-md"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <Button variant="outline" className="border-[#563635]/20 text-[#563635] hover:bg-[#563635]/5">
                    View All Reviews
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-[#563635] mb-6">You May Also Like</h2>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-max">
              {[
                {
                  name: "Rewind Polaroids",
                  description: "Custom photo sets that capture your special moments",
                  price: 29.99,
                  originalPrice: 34.99,
                  image: "/placeholder.svg?height=200&width=200",
                  discount: 15,
                },
                {
                  name: "Reflection Frame",
                  description: "Beautifully framed pictures with custom designs",
                  price: 44.99,
                  originalPrice: 54.99,
                  image: "/placeholder.svg?height=200&width=200",
                  discount: 20,
                },
                {
                  name: "Memory Map",
                  description: "Custom maps highlighting special locations and memories",
                  price: 49.99,
                  originalPrice: 59.99,
                  image: "/placeholder.svg?height=200&width=200",
                  discount: 15,
                },
                {
                  name: "Pet Portrait",
                  description: "Custom artwork featuring your beloved pets",
                  price: 39.99,
                  originalPrice: 49.99,
                  image: "/placeholder.svg?height=200&width=200",
                  discount: 20,
                },
              ].map((product, i) => (
                <div key={i} className="w-64 flex-shrink-0">
                  <div className="bg-white rounded-lg border border-[#563635]/10 overflow-hidden">
                    <div className="relative aspect-square">
                      <Badge className="absolute top-2 left-2 z-10 bg-[#b7384e] hover:bg-[#b7384e] text-white">
                        {product.discount}% OFF
                      </Badge>
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-contain p-4"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-[#563635]">{product.name}</h3>
                      <p className="text-sm text-[#563635]/70 line-clamp-2 h-10">{product.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-bold text-[#b7384e]">${product.price.toFixed(2)}</span>
                        <span className="text-sm text-[#563635]/60 line-through">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      </div>
                      <Button className="w-full mt-3 bg-[#563635] hover:bg-[#563635]/90 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-[#563635]/70 mt-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="inline-block h-4 w-4 mr-1"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Bundle a Journey Map with any photo print and get 10% off automatically at checkout!
          </p>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        title={mapData?.title || "Our Journey Map"}
      />

      {/* Map Customizer Modal */}
      {isCustomizerOpen && (
        <JourneyMapCustomizer
          onClose={handleCloseCustomizer}
          onSave={handleSaveCustomization}
          initialMapData={mapData}
        />
      )}

      <ProductFooter />
    </div>
  )
}
