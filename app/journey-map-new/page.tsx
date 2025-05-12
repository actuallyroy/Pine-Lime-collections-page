"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Heart, Plus, Trash2, ShoppingCart, AlertTriangle, Edit } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ProductHeader from "@/components/product-header"
import ProductFooter from "@/components/product-footer"
import AddMarkerModal from "@/components/add-marker-modal"
import MapPreviewModal from "@/components/map-preview-modal"
import { cn } from "@/lib/utils"

export default function JourneyMapPage() {
  const [frame, setFrame] = useState("none")
  const [size, setSize] = useState("a3")
  const [price, setPrice] = useState(69.99)
  const [originalPrice, setOriginalPrice] = useState(79.99)
  const [isSticky, setIsSticky] = useState(false)
  const [isAddMarkerModalOpen, setIsAddMarkerModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [markers, setMarkers] = useState<any[]>([])
  const [editingMarkerIndex, setEditingMarkerIndex] = useState<number | null>(null)
  const [editingMarkerData, setEditingMarkerData] = useState<any>(null)
  const [mapTitle, setMapTitle] = useState("Our Journey")
  const [mapSettings, setMapSettings] = useState({ style: "vintage", routeType: "none", mapType: "default" })
  const [hasPreviewedMap, setHasPreviewedMap] = useState(false)
  const [showPreviewWarning, setShowPreviewWarning] = useState(false)

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

  // Open the add marker modal
  const handleOpenAddMarkerModal = () => {
    setIsAddMarkerModalOpen(true)
  }

  // Close the add marker modal
  const handleCloseAddMarkerModal = () => {
    setIsAddMarkerModalOpen(false)
    setEditingMarkerIndex(null)
    setEditingMarkerData(null)
  }

  // Add a marker
  const handleAddMarker = (marker: any) => {
    setMarkers([...markers, marker])
    // Reset preview status when markers are changed
    setHasPreviewedMap(false)
  }

  // Remove a marker
  const handleRemoveMarker = (index: number) => {
    const updatedMarkers = [...markers]
    updatedMarkers.splice(index, 1)
    setMarkers(updatedMarkers)
    // Reset preview status when markers are changed
    setHasPreviewedMap(false)
  }

  // Edit marker handler
  const handleEditMarker = (index: number) => {
    setEditingMarkerIndex(index)
    setEditingMarkerData(markers[index])
    setIsAddMarkerModalOpen(true)
  }

  // Update marker handler
  const handleUpdateMarker = (updatedMarker: any) => {
    if (editingMarkerIndex === null) return
    const updated = [...markers]
    updated[editingMarkerIndex] = updatedMarker
    setMarkers(updated)
    setEditingMarkerIndex(null)
    setEditingMarkerData(null)
  }

  // Open the preview modal
  const handleOpenPreviewModal = () => {
    setIsPreviewModalOpen(true)
  }

  // Close the preview modal
  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false)
  }

  // Save map settings
  const handleSaveMapSettings = (settings: { style: string; routeType: string; mapType: string }) => {
    setMapSettings(settings)
    setIsPreviewModalOpen(false)
    setHasPreviewedMap(true)
    setShowPreviewWarning(false)
  }

  // Handle add to cart
  const handleAddToCart = () => {
    if (!hasPreviewedMap && markers.length > 0) {
      setShowPreviewWarning(true)
      // Scroll to warning
      setTimeout(() => {
        document.getElementById("preview-warning")?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } else {
      // Add to cart logic here
      console.log("Adding to cart:", { markers, mapTitle, mapSettings, frame, size })
      alert("Added to cart!")
    }
  }

  // Get map type display name
  const getMapTypeDisplayName = () => {
    switch (mapSettings.mapType) {
      case "fit":
        return "Fit Markers"
      case "split":
        return "Split Heart"
      case "default":
      default:
        return "Default"
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
                {markers.length > 0 ? (
                  <div className="w-full h-full relative">
                    <Image
                      src={`/placeholder.svg?height=600&width=450&text=${mapSettings.style}%20Map`}
                      alt="Custom Journey Map"
                      fill
                      className="object-cover"
                    />

                    {/* Map title */}
                    <div className="absolute left-1/2 bottom-8 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded shadow-md">
                      <div className="text-center text-lg font-medium text-[#563635]">{mapTitle}</div>
                    </div>

                    {/* Render map based on selected map type */}
                    {mapSettings.mapType === "fit" ? (
                      <>
                        {/* Fit markers layout - markers arranged to avoid overlap */}
                        {markers.map((marker, index) => {
                          // Calculate adjusted positions to avoid overlap
                          const angleStep = (2 * Math.PI) / markers.length
                          const radius = 30 // % from center
                          const centerX = 50
                          const centerY = 50
                          const angle = index * angleStep
                          const x = centerX + radius * Math.cos(angle)
                          const y = centerY + radius * Math.sin(angle)

                          return (
                            <div
                              key={index}
                              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                              style={{
                                left: `${x}%`,
                                top: `${y}%`,
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
                          )
                        })}

                        {/* Routes between markers */}
                        {mapSettings.routeType !== "none" && markers.length > 1 && (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            {markers.map((_, index) => {
                              if (index === markers.length - 1) return null

                              // Calculate positions for the adjusted markers
                              const angleStep = (2 * Math.PI) / markers.length
                              const radius = 30 // % from center
                              const centerX = 50
                              const centerY = 50
                              const angle1 = index * angleStep
                              const angle2 = ((index + 1) % markers.length) * angleStep
                              const x1 = centerX + radius * Math.cos(angle1)
                              const y1 = centerY + radius * Math.sin(angle1)
                              const x2 = centerX + radius * Math.cos(angle2)
                              const y2 = centerY + radius * Math.sin(angle2)

                              return (
                                <line
                                  key={index}
                                  x1={`${x1}%`}
                                  y1={`${y1}%`}
                                  x2={`${x2}%`}
                                  y2={`${y2}%`}
                                  stroke="#b7384e"
                                  strokeWidth="2"
                                  strokeDasharray={mapSettings.routeType === "air" ? "5,5" : "none"}
                                />
                              )
                            })}
                          </svg>
                        )}
                      </>
                    ) : mapSettings.mapType === "split" ? (
                      <>
                        {/* Split heart layout */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* Create heart shape with sections */}
                            <path
                              d="M 50,30 C 60,20 75,20 85,30 95,40 95,55 85,65 75,75 60,85 50,95 40,85 25,75 15,65 5,55 5,40 15,30 25,20 40,20 50,30 Z"
                              fill="#f8f8f8"
                              stroke="#ddd"
                              strokeWidth="0.5"
                            />

                            {/* Divide the heart into sections based on number of markers */}
                            {markers.map((marker, index) => {
                              const sectionPath = getSplitHeartSection(index, markers.length)
                              return (
                                <g key={index}>
                                  <path
                                    d={sectionPath}
                                    fill={`url(#map-section-${index})`}
                                    stroke="#fff"
                                    strokeWidth="0.5"
                                  />
                                  <defs>
                                    <pattern
                                      id={`map-section-${index}`}
                                      patternUnits="userSpaceOnUse"
                                      width="100"
                                      height="100"
                                    >
                                      <image
                                        href={`/placeholder.svg?height=100&width=100&text=${marker.label}`}
                                        x="0"
                                        y="0"
                                        width="100"
                                        height="100"
                                        preserveAspectRatio="xMidYMid slice"
                                      />
                                    </pattern>
                                  </defs>

                                  {/* Marker emoji */}
                                  <text
                                    x={getHeartSectionCenter(index, markers.length).x}
                                    y={getHeartSectionCenter(index, markers.length).y}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize="8"
                                  >
                                    {marker.emoji}
                                  </text>
                                </g>
                              )
                            })}
                          </svg>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Default layout - markers in original positions */}
                        {markers.map((marker, index) => (
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
                        {mapSettings.routeType !== "none" && markers.length > 1 && (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            {markers.slice(0, -1).map((marker, index) => (
                              <line
                                key={index}
                                x1={`${marker.position.x}%`}
                                y1={`${marker.position.y}%`}
                                x2={`${markers[index + 1].position.x}%`}
                                y2={`${markers[index + 1].position.y}%`}
                                stroke="#b7384e"
                                strokeWidth="2"
                                strokeDasharray={mapSettings.routeType === "air" ? "5,5" : "none"}
                              />
                            ))}
                          </svg>
                        )}
                      </>
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
              Add markers to create your personalized journey map
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

            {/* Preview Warning */}
            {showPreviewWarning && (
              <Alert className="mb-6 border-amber-500 bg-amber-50" id="preview-warning">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-700">
                  Please preview your map before adding to cart to ensure it looks exactly how you want it.
                </AlertDescription>
              </Alert>
            )}

            {/* Customization Section */}
            <div className="space-y-6 mb-6">
              <div className="border rounded-lg p-4 border-[#b7384e]">
                <h3 className="text-lg font-medium text-[#563635]">Customize Your Map</h3>
              
                {/* Step 1: Map Title */}
                <div className="mt-4 space-y-2 mb-4">
                  <h4 className="font-medium text-[#563635]">Step 1: Give your Journey a name</h4>
                  <Input
                    value={mapTitle}
                    onChange={(e) => setMapTitle(e.target.value)}
                    placeholder="Enter a title for your map. e.g. 'Journey with my favorite person❤️'"
                    className="border-[#563635]/20 focus-visible:ring-[#b7384e]"
                  />
                </div>


                {/* Step 2: Add Markers */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-[#563635]">Step 2: Add the places you want to save</h4>
                    <Button
                      onClick={handleOpenAddMarkerModal}
                      className="bg-[#b7384e] hover:bg-[#b7384e]/90 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Marker
                    </Button>
                  </div>

                  {/* Markers list */}
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {markers.length === 0 ? (
                      <div className="text-center py-4 border border-dashed border-[#563635]/20 rounded-lg">
                        <p className="text-sm text-[#563635]/70">No markers added yet</p>
                        <p className="text-xs text-[#563635]/70">
                          Add markers to highlight special places on your journey
                        </p>
                      </div>
                    ) : (
                      markers.map((marker, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-white rounded-md border border-[#563635]/10 hover:border-[#563635]/30 transition-colors"
                        >
                          <div className="text-xl">{marker.emoji}</div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-[#563635] truncate">{marker.label}</div>
                            <div className="text-xs text-[#563635]/70 truncate">{marker.location}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[#563635]/50 hover:text-[#b7384e] hover:bg-[#b7384e]/5"
                            onClick={() => handleEditMarker(index)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[#563635]/50 hover:text-[#b7384e] hover:bg-[#b7384e]/5"
                            onClick={() => handleRemoveMarker(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {/* Step 3: Preview & Style */}
                <div className="mt-6 space-y-2">
                  <h4 className="font-medium text-[#563635]">Step 3: Preview & Style</h4>
                  <Button
                    onClick={handleOpenPreviewModal}
                    disabled={markers.length === 0}
                    className="w-full bg-[#563635] hover:bg-[#563635]/90 text-white"
                  >
                    Preview & Customize Map Style
                  </Button>
                  {markers.length === 0 ? (
                    <p className="text-xs text-[#563635]/70 text-center">Add at least one marker to preview your map</p>
                  ) : hasPreviewedMap ? (
                    <div className="text-xs text-[#563635]/70 text-center">
                      Current style: {mapSettings.style}, Layout: {getMapTypeDisplayName()}, Routes:{" "}
                      {mapSettings.routeType === "none" ? "None" : mapSettings.routeType}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 text-center font-medium">
                      Please preview your map before adding to cart
                    </p>
                  )}
                </div>
              </div>
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

              <div className="flex gap-4 mt-6">
                <Button
                  className="flex-1 bg-[#b7384e] hover:bg-[#b7384e]/90 text-white py-6 text-lg"
                  disabled={markers.length === 0}
                  onClick={handleAddToCart}
                >
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
            <Button variant="outline" className="border-[#b7384e] text-[#b7384e]" onClick={handleOpenAddMarkerModal}>
              Add Marker
            </Button>
            <Button
              className="bg-[#b7384e] hover:bg-[#b7384e]/90 text-white"
              disabled={markers.length === 0}
              onClick={handleAddToCart}
            >
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
              {/* Shipping content */}
            </TabsContent>

            <TabsContent value="faq" className="mt-6">
              {/* FAQ content */}
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              {/* Reviews content */}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add Marker Modal */}
      {isAddMarkerModalOpen && (
        <AddMarkerModal
          onClose={handleCloseAddMarkerModal}
          onAddMarker={handleAddMarker}
          initialMarker={editingMarkerData}
          onUpdateMarker={handleUpdateMarker}
        />
      )}

      {/* Map Preview Modal */}
      {isPreviewModalOpen && (
        <MapPreviewModal
          onClose={handleClosePreviewModal}
          onSave={handleSaveMapSettings}
          markers={markers}
          title={mapTitle}
          initialSettings={mapSettings}
        />
      )}

      <ProductFooter />
    </div>
  )
}

// Helper functions for split heart map
function getSplitHeartSection(index: number, total: number) {
  // This is a simplified example - in a real implementation, you'd calculate actual heart sections
  // For now, we'll just return a placeholder path for demonstration
  const startAngle = (index / total) * 360
  const endAngle = ((index + 1) / total) * 360

  // Heart shape is centered at (50, 50) with radius ~40
  return `M 50 50 L ${50 + 40 * Math.cos((startAngle * Math.PI) / 180)} ${50 + 40 * Math.sin((startAngle * Math.PI) / 180)} A 40 40 0 0 1 ${50 + 40 * Math.cos((endAngle * Math.PI) / 180)} ${50 + 40 * Math.sin((endAngle * Math.PI) / 180)} Z`
}

function getHeartSectionCenter(index: number, total: number) {
  // Calculate the center point of each heart section
  const angle = ((index + 0.5) / total) * 360
  const radius = 25 // Slightly smaller than the section radius
  return {
    x: 50 + radius * Math.cos((angle * Math.PI) / 180),
    y: 50 + radius * Math.sin((angle * Math.PI) / 180),
  }
}
