"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRight, Heart, Plus, Trash2, ShoppingCart, AlertTriangle, Edit, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProductHeader from "@/components/product-header";
import ProductFooter from "@/components/product-footer";
import AddMarkerModal from "@/components/add-marker-modal";
import MapPreviewModal from "@/components/map-preview-modal";
import { cn, uploadToS3 } from "@/lib/utils";
import { fetchMapStyles, MapStyle } from "@/lib/map-styles";
import { v4 as uuidv4 } from 'uuid';
import { generateMapPreview } from "@/utils/mapUtils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function JourneyMapPage() {
  const [frame, setFrame] = useState("brown");
  const [size, setSize] = useState("8 in");
  const [price, setPrice] = useState(199);
  const [originalPrice, setOriginalPrice] = useState(399);
  const [quantity, setQuantity] = useState(1);
  const [isSticky, setIsSticky] = useState(false);
  const [isAddMarkerModalOpen, setIsAddMarkerModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [editingMarkerIndex, setEditingMarkerIndex] = useState<number | null>(null);
  const [editingMarkerData, setEditingMarkerData] = useState<Marker | undefined>(undefined);
  const [mapTitle, setMapTitle] = useState("Our Journey");
  const [mapData, setMapData] = useState<Partial<MapData>>({ mapStyle: "default", routeType: "none", mapType: "fit" });
  const [hasPreviewedMap, setHasPreviewedMap] = useState(false);
  const [showPreviewWarning, setShowPreviewWarning] = useState(false);
  const [mapStyles, setMapStyles] = useState<MapStyle[]>([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const mapPreviewContainer = useRef<HTMLDivElement>(null);

  // Handle scroll for sticky add to cart on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsSticky(scrollPosition > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update price based on selections
  useEffect(() => {
    const basePrice = size === "4 in" ? 200 : size === "6 in" ? 600 : 900;
    const framePrice = frame === "none" ? 0 : frame === "brown" ? 299 : 299;

    setPrice(basePrice + framePrice);
    setOriginalPrice((basePrice + framePrice) * 1.2); // 15% off
  }, [size, frame]);

  useEffect(() => {
    fetchMapStyles().then(setMapStyles);
  }, []);

  // Open the add marker modal
  const handleOpenAddMarkerModal = () => {
    setIsAddMarkerModalOpen(true);
  };

  // Close the add marker modal
  const handleCloseAddMarkerModal = () => {
    setIsAddMarkerModalOpen(false);
    setEditingMarkerIndex(null);
    setEditingMarkerData(undefined);
  };

  // Add a marker
  const handleAddMarker = (marker: any) => {
    setMarkers([...markers, marker]);
    // Reset preview status when markers are changed
    setHasPreviewedMap(false);
  };

  // Remove a marker
  const handleRemoveMarker = (index: number) => {
    const updatedMarkers = [...markers];
    updatedMarkers.splice(index, 1);
    setMarkers(updatedMarkers);
    // Reset preview status when markers are changed
    setHasPreviewedMap(false);
  };

  // Edit marker handler
  const handleEditMarker = (index: number) => {
    setEditingMarkerIndex(index);
    setEditingMarkerData(markers[index]);
    setIsAddMarkerModalOpen(true);
  };

  // Update marker handler
  const handleUpdateMarker = (updatedMarker: any) => {
    if (editingMarkerIndex === null) return;
    const updated = [...markers];
    updated[editingMarkerIndex] = updatedMarker;
    setMarkers(updated);
    setEditingMarkerIndex(null);
    setEditingMarkerData(undefined);
  };

  // Open the preview modal
  const handleOpenPreviewModal = () => {
    setIsPreviewModalOpen(true);
  };

  // Close the preview modal
  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
  };

  // Save map settings
  const handleSaveMapSettings = (settings: Partial<MapData>) => {
    console.log("settings", settings);
    setMapData(settings);
    setIsPreviewModalOpen(false);
    setHasPreviewedMap(true);
    setShowPreviewWarning(false);
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!hasPreviewedMap && markers.length > 0) {
      setShowPreviewWarning(true);
      // Scroll to warning
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          const warningElement = document.getElementById("preview-warning");
          if (warningElement) {
            warningElement.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      }
    } else {
      try {
        setIsAddingToCart(true);
        if (!mapPreviewContainer.current) {
          console.error("Map preview container not found");
          return;
        }
        mapPreviewContainer.current.style.height = mapData.mapHeight + "px";
        mapPreviewContainer.current.style.width = mapData.mapWidth + "px";
        const mapPreview = await generateMapPreview(mapPreviewContainer.current, markers, mapTitle, mapData as MapData, size);
        const orderId = uuidv4();
        const s3Response = await uploadToS3(mapPreview, orderId);
        const _mapData = {
          "mapStyle": mapData.mapStyle,
          "mapType": mapData.mapType,
          "routeColor": mapData.routeColor,
          "mapZoom": mapData.mapZoom,
          "mapCenter": mapData.mapCenter,
          "markers": markers,
          "routeType": mapData.routeType,
          "title": mapData.title,
          "mapBearing": mapData.mapBearing,
        }
        const sizeMap = {
          "4 in": "4x4",
          "6 in": "6x6",
          "8 in": "8x8"
        }
        const frameMap = {
          "brown": "Dark Brown",
          "natural": "Natural"
        }
        const productData = {
          "quantity": quantity,
          "order_id": orderId,
          "sku": "0055",
          "s3Links": {
            "objectURL": s3Response.url
          },
          "description": mapTitle,
          "_id": orderId,
          "gifttext": "",
          "currencySymbol": "₹",
          "gift": false,
          "frameSize": sizeMap[size as keyof typeof sizeMap],
          "promptData": {},
          "cost": price * quantity,
          "map_type": "journeymap",
          "product_id": "Journey Map",
          "title": mapTitle,
          "frameColor": frameMap[frame as keyof typeof frameMap],
          "mapData": _mapData,
          "product": "JOURNEY_MAP_V2"
        }
        window.open(`https://www.pinenlime.com/shoppingcart?journeyMapData=${encodeURIComponent(btoa(encodeURIComponent(JSON.stringify(productData))))}`, '_blank');
      } catch (error) {
        console.error('Error adding to cart:', error);
      } finally {
        setIsAddingToCart(false);
      }
    }
  };

  // Get map type display name
  const getMapTypeDisplayName = () => {
    switch (mapData.mapType) {
      case "fit":
        return "Fit Markers";
      case "split":
        return "Split Heart";
      case "custom":
        return "Custom";
      default:
        return "Default";
    }
  };

  // Helper to get style name from id/url
  const getStyleName = (styleId: string) => {
    // Try custom styles
    const found = mapStyles.find((s) => s.styleId === styleId || s.styleIdLabelled === styleId || s.ID === styleId);
    if (found) return found.Title;
    // Try fallback styles
    const fallback = [
      { id: "streets-v12", name: "Streets" },
      { id: "satellite-v9", name: "Satellite" },
      { id: "satellite-streets-v12", name: "Satellite Streets" },
      { id: "outdoors-v12", name: "Outdoors" },
      { id: "light-v11", name: "Light" },
      { id: "dark-v11", name: "Dark" },
    ].find((s) => styleId.includes(s.id));
    if (fallback) return fallback.name;
    // Otherwise just return the id/url
    return styleId;
  };

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
                <Image src={`/journey-map-mockups/${frame}-${size}.webp`} alt="Journey Map" fill className="object-cover" />
              </div>
            </div>
            <div className="hidden lg:block text-center text-sm text-[#563635]/70">Add markers to create your personalized journey map</div>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-lg border border-[#563635]/10 p-6 shadow-sm">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#563635]">Journey Map</h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={i < 5 ? "#b7384e" : "none"} stroke={i < 5 ? "#b7384e" : "#563635"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
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
                <span className="text-3xl font-bold text-[#b7384e]">₹{price.toFixed(2)}</span>
                <span className="text-lg text-[#563635]/60 line-through">₹{originalPrice.toFixed(2)}</span>
              </div>
              <p className="mt-4 text-[#563635]/80">Visualize your travels and adventures in a beautiful custom map. Perfect for commemorating road trips, backpacking journeys, or any adventure that took you to multiple destinations.</p>
            </div>

            {/* Preview Warning */}
            {showPreviewWarning && (
              <Alert className="mb-6 border-amber-500 bg-amber-50" id="preview-warning">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-700">Please preview your map before adding to cart to ensure it looks exactly how you want it.</AlertDescription>
              </Alert>
            )}

            {/* Product Options */}
            <div className="space-y-6">
              {/* Frame Selection */}
              <div>
                <h3 className="text-lg font-medium text-[#563635] mb-3">Frame</h3>
                <RadioGroup value={frame} onValueChange={setFrame} className="flex flex-wrap gap-3">
                  {[
                    { value: "brown", label: "Dark Brown", price: "+₹200" },
                    { value: "natural", label: "Natural", price: "+₹200" },
                  ].map((option) => (
                    <Label key={option.value} htmlFor={`frame-${option.value}`} className={`flex items-center justify-between px-4 py-3 border rounded-md cursor-pointer ${frame === option.value ? "border-[#b7384e] bg-[#b7384e]/5" : "border-[#563635]/20 hover:border-[#563635]/40"}`}>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id={`frame-${option.value}`} value={option.value} className="sr-only" />
                        {frame === option.value && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[#b7384e]">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        <span className={frame === option.value ? "text-[#b7384e]" : "text-[#563635]"}>{option.label}</span>
                      </div>
                      {/* <span className={`text-sm ${frame === option.value ? "text-[#b7384e]" : "text-[#563635]/70"}`}>{option.price}</span> */}
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Size Selection */}
              <div>
                <h3 className="text-lg font-medium text-[#563635] mb-3">Size</h3>
                <RadioGroup value={size} onValueChange={setSize} className="flex flex-wrap gap-3">
                  {[
                    { value: "4 in", label: "4x4 in", price: "+₹100" },
                    { value: "6 in", label: "6x6 in", price: "+₹500" },
                    { value: "8 in", label: "8x8 in", price: "+₹800" },
                  ].map((option) => (
                    <Label key={option.value} htmlFor={`size-${option.value}`} className={`flex items-center justify-between px-4 py-3 border rounded-md cursor-pointer ${size === option.value ? "border-[#b7384e] bg-[#b7384e]/5" : "border-[#563635]/20 hover:border-[#563635]/40"}`}>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id={`size-${option.value}`} value={option.value} className="sr-only" />
                        {size === option.value && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[#b7384e]">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        <span className={size === option.value ? "text-[#b7384e]" : "text-[#563635]"}>{option.label}</span>
                      </div>&nbsp;
                      {/* <span className={`text-sm ${size === option.value ? "text-[#b7384e]" : "text-[#563635]/70"}`}>{option.price}</span> */}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </div>

            {/* Customization Section */}
            <div className="space-y-6 my-6">
              <div className="border rounded-lg p-4 border-[#b7384e]">
                <h3 className="text-lg font-medium text-[#563635]">Customize Your Map</h3>

                {/* Step 1: Map Title */}
                <div className="mt-4 space-y-2 mb-4">
                  <h4 className="font-medium text-[#563635]">Step 1: Give your Journey a name</h4>
                  <Input value={mapTitle} onChange={(e) => setMapTitle(e.target.value)} placeholder="Enter a title for your map. e.g. 'Journey with my favorite person❤️'" className="border-[#563635]/20 focus-visible:ring-[#b7384e]" />
                </div>

                {/* Step 2: Add Markers */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-[#563635]">Step 2: Add the places you want to save</h4>
                    <Button onClick={handleOpenAddMarkerModal} className="bg-[#b7384e] hover:bg-[#b7384e]/90 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Marker
                    </Button>
                  </div>

                  {/* Markers list */}
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {markers.length === 0 ? (
                      <div className="text-center py-4 border border-dashed border-[#563635]/20 rounded-lg">
                        <p className="text-sm text-[#563635]/70">No markers added yet</p>
                        <p className="text-xs text-[#563635]/70">Add markers to highlight special places on your journey</p>
                      </div>
                    ) : (
                      markers.map((marker, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-md border border-[#563635]/10 hover:border-[#563635]/30 transition-colors">
                          <div className="text-xl">{marker.markerEmoji}</div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-[#563635] truncate w-full">{marker.markerLabel}</div>
                            <div className="text-xs text-[#563635]/70 truncate max-w-[290px]">{marker.locationName}</div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-[#563635]/50 hover:text-[#b7384e] hover:bg-[#b7384e]/5" onClick={() => handleEditMarker(index)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-[#563635]/50 hover:text-[#b7384e] hover:bg-[#b7384e]/5" onClick={() => handleRemoveMarker(index)}>
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
                  <Button onClick={handleOpenPreviewModal} disabled={markers.length === 0} className="w-full bg-[#563635] hover:bg-[#563635]/90 text-white">
                    Preview & Customize Map Style
                  </Button>
                  {markers.length === 0 ? (
                    <p className="text-xs text-[#563635]/70 text-center">Add at least one marker to preview your map</p>
                  ) : hasPreviewedMap ? (
                    <div className="text-xs text-[#563635]/70 text-center">
                      Current style: {getStyleName(mapData.mapStyle || "default")}, Layout: {getMapTypeDisplayName()}, Routes: {mapData.routeType === "none" ? "None" : mapData.routeType}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 text-center font-medium">Please preview your map before adding to cart</p>
                  )}
                </div>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="quantity" className="text-[#563635]">Quantity:</Label>
                  <div className="flex items-center border border-[#563635]/20 rounded-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#563635] hover:bg-[#563635]/5"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#563635] hover:bg-[#563635]/5"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <Button 
                  className="flex-1 bg-[#b7384e] hover:bg-[#b7384e]/90 text-white py-6 text-lg" 
                  disabled={markers.length === 0 || isAddingToCart} 
                  onClick={handleAddToCart}
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Adding to Cart...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
                <Button variant="outline" className="border-[#563635]/20 text-[#563635] hover:bg-[#563635]/5 py-6">
                  <Heart className="h-5 w-5 mr-2" />
                  Save
                </Button>
              </div>

              <div className="text-sm text-[#563635]/70 space-y-2">
                <p className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="M7 15h0M2 9.5h20" />
                  </svg>
                  Secure checkout with multiple payment options
                </p>
                <p className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Tamper-proof and secure packaging
                </p>
                <p className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
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
        <div className={cn("fixed bottom-0 left-0 right-0 bg-white border-t border-[#563635]/10 p-4 flex items-center justify-between lg:hidden transition-transform duration-300", isSticky ? "translate-y-0" : "translate-y-full")}>
          <div>
            <div className="text-lg font-bold text-[#b7384e]">${price.toFixed(2)}</div>
            <div className="text-sm text-[#563635]/60 line-through">${originalPrice.toFixed(2)}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-[#563635]/20 rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[#563635] hover:bg-[#563635]/5"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[#563635] hover:bg-[#563635]/5"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleOpenPreviewModal} 
                disabled={markers.length === 0} 
                className="bg-[#563635] hover:bg-[#563635]/90 text-white"
              >
                Preview Map
              </Button>
              <Button 
                className="bg-[#b7384e] hover:bg-[#b7384e]/90 text-white" 
                disabled={markers.length === 0 || isAddingToCart} 
                onClick={handleAddToCart}
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>
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
                      <span className="text-[#563635]/70">Premium 250gsm art paper</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#563635]/10">
                      <span className="font-medium text-[#563635]">Available Sizes</span>
                      <span className="text-[#563635]/70">4x4in , 6x6in , 8x8in</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#563635]/10">
                      <span className="font-medium text-[#563635]">Frame Material</span>
                      <span className="text-[#563635]/70">Dark Brown, Natural</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-[#563635]/10">
                      <span className="font-medium text-[#563635]">Protective Cover</span>
                      <span className="text-[#563635]/70">Acrylic front</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#563635]/10">
                      <span className="font-medium text-[#563635]">Mounting</span>
                      <span className="text-[#563635]/70">Included within the frame is a stand at the back and a hook</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#563635]/10">
                      <span className="font-medium text-[#563635]">Maximum Pins</span>
                      <span className="text-[#563635]/70">There's no limit to the number of pins you can add</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shipping" className="mt-6">
              <div className="bg-white p-6 rounded-lg border border-[#563635]/10 space-y-8">
                {/* Worldwide Shipping */}
                <div>
                  <h3 className="text-xl font-semibold text-[#563635] mb-4">Shipping</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#b7384e] mt-0.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                        <path d="M2 12h20" />
                      </svg>
                      <div>
                        <p className="font-medium text-[#563635]">Delivery Time</p>
                        <p className="text-[#563635]/70">3-7 business days worldwide</p>
                      </div>
                    </div>
                    {/* <div className="flex items-start gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#b7384e] mt-0.5">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="M7 15h0M2 9.5h20" />
                      </svg>
                      <div>
                        <p className="font-medium text-[#563635]">Shipping Cost</p>
                        <p className="text-[#563635]/70">Calculated at checkout based on weight and dimensions</p>
                      </div>
                    </div> */}
                  </div>
                </div>

                {/* Order Processing */}
                <div>
                  <h3 className="text-xl font-semibold text-[#563635] mb-4">Order Processing</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#b7384e] mt-0.5">
                        <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
                        <path d="M16.5 9.4 7.55 4.24" />
                      </svg>
                      <div>
                        <p className="font-medium text-[#563635]">Dispatch Time</p>
                        <p className="text-[#563635]/70">Orders are dispatched within 24 hours</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#b7384e] mt-0.5">
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                      </svg>
                      <div>
                        <p className="font-medium text-[#563635]">Tracking</p>
                        <p className="text-[#563635]/70">Tracking link provided with order confirmation email</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Returns & Support */}
                <div>
                  <h3 className="text-xl font-semibold text-[#563635] mb-4">Returns & Support</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#b7384e] mt-0.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-[#563635]">Customer Support</p>
                        <p className="text-[#563635]/70">Email: contact@pinenlime.com</p>
                        <p className="text-[#563635]/70">Phone: +91 98183 82099 (Mon-Sat 10AM-7PM, Sun 10AM-5PM)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#b7384e] mt-0.5">
                        <path d="M9 14 4 9l5-5" />
                        <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
                      </svg>
                      <div>
                        <p className="font-medium text-[#563635]">Returns Policy</p>
                        <p className="text-[#563635]/70">Due to the custom nature of our products, we do not accept returns. For damaged items, please contact support within 5 days of delivery.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="faq" className="mt-6">
              <div className="bg-white p-6 rounded-lg border border-[#563635]/10">
                <h2 className="text-xl font-semibold text-[#563635] mb-6">Frequently Asked Questions</h2>
                <div className="space-y-8">
                  {/* Map Creation */}
                  <div className="bg-[#fcf8ed] p-6 rounded-lg border border-[#563635]/5">
                    <h3 className="font-medium text-[#563635] text-lg mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#b7384e]">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      About Map Creation
                    </h3>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="text-[#563635] hover:text-[#b7384e] hover:no-underline">
                          How many locations can I add to my journey map?
                        </AccordionTrigger>
                        <AccordionContent className="text-[#563635]/70">
                          There's no limit to the number of locations you can add. However, for best visual results, we recommend 2-15 locations depending on your map style and layout.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger className="text-[#563635] hover:text-[#b7384e] hover:no-underline">
                          Can I customize the map style and colors?
                        </AccordionTrigger>
                        <AccordionContent className="text-[#563635]/70">
                          Yes! You can choose from various map styles, route types, and color schemes in the preview section. You can also adjust the zoom level and map center to perfect your design.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3">
                        <AccordionTrigger className="text-[#563635] hover:text-[#b7384e] hover:no-underline">
                          What if I make a mistake while creating my map?
                        </AccordionTrigger>
                        <AccordionContent className="text-[#563635]/70">
                          You can edit or remove any marker by using the edit and delete buttons. You can also preview your map before ordering to ensure everything looks perfect.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  {/* Product & Quality */}
                  <div className="bg-[#fcf8ed] p-6 rounded-lg border border-[#563635]/5">
                    <h3 className="font-medium text-[#563635] text-lg mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#b7384e]">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      Product & Quality
                    </h3>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-4">
                        <AccordionTrigger className="text-[#563635] hover:text-[#b7384e] hover:no-underline">
                          What's included in my order?
                        </AccordionTrigger>
                        <AccordionContent className="text-[#563635]/70">
                          Your journey map comes in a high-quality frame with an acrylic front cover for protection. The frame includes both a stand and wall-mounting hardware.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-5">
                        <AccordionTrigger className="text-[#563635] hover:text-[#b7384e] hover:no-underline">
                          What type of paper is used?
                        </AccordionTrigger>
                        <AccordionContent className="text-[#563635]/70">
                          We print on premium 250gsm art paper to ensure vibrant colors and sharp details that will last for years to come.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-6">
                        <AccordionTrigger className="text-[#563635] hover:text-[#b7384e] hover:no-underline">
                          Will my map look exactly like the preview?
                        </AccordionTrigger>
                        <AccordionContent className="text-[#563635]/70">
                          While we strive for exact matches, there might be slight variations in colors due to different screen settings and printing processes. The overall design and layout will remain the same.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  {/* Ordering & Delivery */}
                  <div className="bg-[#fcf8ed] p-6 rounded-lg border border-[#563635]/5">
                    <h3 className="font-medium text-[#563635] text-lg mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#b7384e]">
                        <rect width="20" height="16" x="2" y="4" rx="2"/>
                        <path d="M7 15h0M2 9.5h20"/>
                      </svg>
                      Ordering & Delivery
                    </h3>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-7">
                        <AccordionTrigger className="text-[#563635] hover:text-[#b7384e] hover:no-underline">
                          Can I modify my order after placing it?
                        </AccordionTrigger>
                        <AccordionContent className="text-[#563635]/70">
                          Since we process orders quickly (within 24 hours), please contact us immediately if you need to make changes. We'll do our best to accommodate your request.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-8">
                        <AccordionTrigger className="text-[#563635] hover:text-[#b7384e] hover:no-underline">
                          How is my map packaged for shipping?
                        </AccordionTrigger>
                        <AccordionContent className="text-[#563635]/70">
                          Your journey map is carefully packaged in protective materials and a sturdy box to ensure it arrives in perfect condition. All frames include corner protection.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-9">
                        <AccordionTrigger className="text-[#563635] hover:text-[#b7384e] hover:no-underline">
                          What if my order arrives damaged?
                        </AccordionTrigger>
                        <AccordionContent className="text-[#563635]/70">
                          While rare, if your order arrives damaged, please take photos and contact us within 5 days of delivery. We'll arrange a replacement or refund.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  {/* Gift & Special Occasions */}
                  <div className="bg-[#fcf8ed] p-6 rounded-lg border border-[#563635]/5">
                    <h3 className="font-medium text-[#563635] text-lg mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#b7384e]">
                        <path d="M20 12v10H4V12"/>
                        <rect width="20" height="5" x="2" y="7"/>
                        <rect width="5" height="5" x="10" y="2"/>
                        <path d="M12 12v9"/>
                      </svg>
                      Gift & Special Occasions
                    </h3>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-10">
                        <AccordionTrigger className="text-[#563635] hover:text-[#b7384e] hover:no-underline">
                          Can I send this as a gift?
                        </AccordionTrigger>
                        <AccordionContent className="text-[#563635]/70">
                          Yes! Our journey maps make perfect gifts. They come gift-ready in elegant packaging, and you can include a personalized message at checkout.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-11">
                        <AccordionTrigger className="text-[#563635] hover:text-[#b7384e] hover:no-underline">
                          Do you offer gift wrapping?
                        </AccordionTrigger>
                        <AccordionContent className="text-[#563635]/70">
                          All our frames come in a premium gift box by default, making them perfect for gifting without additional wrapping needed.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-12">
                        <AccordionTrigger className="text-[#563635] hover:text-[#b7384e] hover:no-underline">
                          Can I schedule delivery for a specific date?
                        </AccordionTrigger>
                        <AccordionContent className="text-[#563635]/70">
                          While we can't guarantee specific delivery dates, we recommend ordering at least 10 days before your target date to ensure timely delivery.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <div className="bg-white p-6 rounded-lg border border-[#563635]/10">
                <h2 className="text-xl font-semibold text-[#563635] mb-6">Customer Reviews</h2>
                
                {/* Reviews Stats */}
                <div className="flex items-center justify-between mb-8 p-4 bg-[#fcf8ed] rounded-lg border border-[#563635]/5">
                  <div className="flex items-center gap-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={i < 5 ? "#00b67a" : "none"} stroke={i < 5 ? "#00b67a" : "#563635"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <div>
                      <p className="font-medium text-[#563635]">4.6 out of 5</p>
                      <p className="text-sm text-[#563635]/70">Based on 991 reviews</p>
                    </div>
                  </div>
                  <a href="https://www.trustpilot.com/review/pinenlime.com?stars=5" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-[#563635]/70 hover:text-[#563635]">
                    <span>Reviews from</span>
                    <svg preserveAspectRatio="xMidYMid meet" data-bbox="0 0 1133 278.2" viewBox="0 0 1133 278.2" xmlns="http://www.w3.org/2000/svg" data-type="color" role="presentation" aria-hidden="true" className="h-5">
                      <g>
                        <path fill="#00b67a" d="M297.7 98.6h114.7V120h-45.1v120.3h-24.8V120h-44.9V98.6zm109.8 39.1h21.2v19.8h.4c.7-2.8 2-5.5 3.9-8.1 1.9-2.6 4.2-5.1 6.9-7.2 2.7-2.2 5.7-3.9 9-5.3 3.3-1.3 6.7-2 10.1-2 2.6 0 4.5.1 5.5.2s2 .3 3.1.4v21.8c-1.6-.3-3.2-.5-4.9-.7-1.7-.2-3.3-.3-4.9-.3-3.8 0-7.4.8-10.8 2.3-3.4 1.5-6.3 3.8-8.8 6.7-2.5 3-4.5 6.6-6 11s-2.2 9.4-2.2 15.1v48.8h-22.6V137.7zm164 102.6h-22.2V226h-.4c-2.8 5.2-6.9 9.3-12.4 12.4-5.5 3.1-11.1 4.7-16.8 4.7-13.5 0-23.3-3.3-29.3-10s-9-16.8-9-30.3v-65.1H504v62.9c0 9 1.7 15.4 5.2 19.1 3.4 3.7 8.3 5.6 14.5 5.6 4.8 0 8.7-.7 11.9-2.2 3.2-1.5 5.8-3.4 7.7-5.9 2-2.4 3.4-5.4 4.3-8.8.9-3.4 1.3-7.1 1.3-11.1v-59.5h22.6v102.5zm38.5-32.9c.7 6.6 3.2 11.2 7.5 13.9 4.4 2.6 9.6 4 15.7 4 2.1 0 4.5-.2 7.2-.5s5.3-1 7.6-1.9c2.4-.9 4.3-2.3 5.9-4.1 1.5-1.8 2.2-4.1 2.1-7-.1-2.9-1.2-5.3-3.2-7.1-2-1.9-4.5-3.3-7.6-4.5-3.1-1.1-6.6-2.1-10.6-2.9-4-.8-8-1.7-12.1-2.6-4.2-.9-8.3-2.1-12.2-3.4-3.9-1.3-7.4-3.1-10.5-5.4-3.1-2.2-5.6-5.1-7.4-8.6-1.9-3.5-2.8-7.8-2.8-13 0-5.6 1.4-10.2 4.1-14 2.7-3.8 6.2-6.8 10.3-9.1 4.2-2.3 8.8-3.9 13.9-4.9 5.1-.9 10-1.4 14.6-1.4 5.3 0 10.4.6 15.2 1.7 4.8 1.1 9.2 2.9 13.1 5.5 3.9 2.5 7.1 5.8 9.7 9.8 2.6 4 4.2 8.9 4.9 14.6h-23.6c-1.1-5.4-3.5-9.1-7.4-10.9-3.9-1.9-8.4-2.8-13.4-2.8-1.6 0-3.5.1-5.7.4-2.2.3-4.2.8-6.2 1.5-1.9.7-3.5 1.8-4.9 3.2-1.3 1.4-2 3.2-2 5.5 0 2.8 1 5 2.9 6.7 1.9 1.7 4.4 3.1 7.5 4.3 3.1 1.1 6.6 2.1 10.6 2.9 4 .8 8.1 1.7 12.3 2.6 4.1.9 8.1 2.1 12.1 3.4 4 1.3 7.5 3.1 10.6 5.4 3.1 2.3 5.6 5.1 7.5 8.5 1.9 3.4 2.9 7.7 2.9 12.7 0 6.1-1.4 11.2-4.2 15.5-2.8 4.2-6.4 7.7-10.8 10.3-4.4 2.6-9.4 4.6-14.8 5.8-5.4 1.2-10.8 1.8-16.1 1.8-6.5 0-12.5-.7-18-2.2-5.5-1.5-10.3-3.7-14.3-6.6-4-3-7.2-6.7-9.5-11.1-2.3-4.4-3.5-9.7-3.7-15.8H610zm74.6-69.7h17.1v-30.8h22.6v30.8h20.4v16.9h-20.4v54.8c0 2.4.1 4.4.3 6.2.2 1.7.7 3.2 1.4 4.4.7 1.2 1.8 2.1 3.3 2.7 1.5.6 3.4.9 6 .9 1.6 0 3.2 0 4.8-.1 1.6-.1 3.2-.3 4.8-.7v17.5c-2.5.3-5 .5-7.3.8-2.4.3-4.8.4-7.3.4-6 0-10.8-.6-14.4-1.7-3.6-1.1-6.5-2.8-8.5-5-2.1-2.2-3.4-4.9-4.2-8.2-.7-3.3-1.2-7.1-1.3-11.3v-60.5h-17.1v-17.1zm76.1 0h21.4v13.9h.4c3.2-6 7.6-10.2 13.3-12.8 5.7-2.6 11.8-3.9 18.5-3.9 8.1 0 15.1 1.4 21.1 4.3 6 2.8 11 6.7 15 11.7 4 5 6.9 10.8 8.9 17.4 2 6.6 3 13.7 3 21.2 0 6.9-.9 13.6-2.7 20-1.8 6.5-4.5 12.2-8.1 17.2-3.6 5-8.2 8.9-13.8 11.9-5.6 3-12.1 4.5-19.7 4.5-3.3 0-6.6-.3-9.9-.9-3.3-.6-6.5-1.6-9.5-2.9-3-1.3-5.9-3-8.4-5.1-2.6-2.1-4.7-4.5-6.5-7.2h-.4v51.2h-22.6V137.7zm79 51.4c0-4.6-.6-9.1-1.8-13.5-1.2-4.4-3-8.2-5.4-11.6-2.4-3.4-5.4-6.1-8.9-8.1-3.6-2-7.7-3.1-12.3-3.1-9.5 0-16.7 3.3-21.5 9.9-4.8 6.6-7.2 15.4-7.2 26.4 0 5.2.6 10 1.9 14.4 1.3 4.4 3.1 8.2 5.7 11.4 2.5 3.2 5.5 5.7 9 7.5 3.5 1.9 7.6 2.8 12.2 2.8 5.2 0 9.5-1.1 13.1-3.2 3.6-2.1 6.5-4.9 8.8-8.2 2.3-3.4 4-7.2 5-11.5.9-4.3 1.4-8.7 1.4-13.2zm39.9-90.5h22.6V120h-22.6V98.6zm0 39.1h22.6v102.6h-22.6V137.7zm42.8-39.1H945v141.7h-22.6V98.6zm91.9 144.5c-8.2 0-15.5-1.4-21.9-4.1-6.4-2.7-11.8-6.5-16.3-11.2-4.4-4.8-7.8-10.5-10.1-17.1-2.3-6.6-3.5-13.9-3.5-21.8 0-7.8 1.2-15 3.5-21.6 2.3-6.6 5.7-12.3 10.1-17.1 4.4-4.8 9.9-8.5 16.3-11.2 6.4-2.7 13.7-4.1 21.9-4.1s15.5 1.4 21.9 4.1c6.4 2.7 11.8 6.5 16.3 11.2 4.4 4.8 7.8 10.5 10.1 17.1 2.3 6.6 3.5 13.8 3.5 21.6 0 7.9-1.2 15.2-3.5 21.8-2.3 6.6-5.7 12.3-10.1 17.1-4.4 4.8-9.9 8.5-16.3 11.2-6.4 2.7-13.7 4.1-21.9 4.1zm0-17.9c5 0 9.4-1.1 13.1-3.2 3.7-2.1 6.7-4.9 9.1-8.3 2.4-3.4 4.1-7.3 5.3-11.6 1.1-4.3 1.7-8.7 1.7-13.2 0-4.4-.6-8.7-1.7-13.1s-2.9-8.2-5.3-11.6c-2.4-3.4-5.4-6.1-9.1-8.2-3.7-2.1-8.1-3.2-13.1-3.2s-9.4 1.1-13.1 3.2c-3.7 2.1-6.7 4.9-9.1 8.2-2.4 3.4-4.1 7.2-5.3 11.6-1.1 4.4-1.7 8.7-1.7 13.1 0 4.5.6 8.9 1.7 13.2 1.1 4.3 2.9 8.2 5.3 11.6 2.4 3.4 5.4 6.2 9.1 8.3 3.7 2.2 8.1 3.2 13.1 3.2zm58.4-87.5h17.1v-30.8h22.6v30.8h20.4v16.9h-20.4v54.8c0 2.4.1 4.4.3 6.2.2 1.7.7 3.2 1.4 4.4.7 1.2 1.8 2.1 3.3 2.7 1.5.6 3.4.9 6 .9 1.6 0 3.2 0 4.8-.1 1.6-.1 3.2-.3 4.8-.7v17.5c-2.5.3-5 .5-7.3.8-2.4.3-4.8.4-7.3.4-6 0-10.8-.6-14.4-1.7-3.6-1.1-6.5-2.8-8.5-5-2.1-2.2-3.4-4.9-4.2-8.2-.7-3.3-1.2-7.1-1.3-11.3v-60.5h-17.1v-17.1zm76.1 0h21.4v13.9h.4c3.2-6 7.6-10.2 13.3-12.8 5.7-2.6 11.8-3.9 18.5-3.9 8.1 0 15.1 1.4 21.1 4.3 6 2.8 11 6.7 15 11.7 4 5 6.9 10.8 8.9 17.4 2 6.6 3 13.7 3 21.2 0 6.9-.9 13.6-2.7 20-1.8 6.5-4.5 12.2-8.1 17.2-3.6 5-8.2 8.9-13.8 11.9-5.6 3-12.1 4.5-19.7 4.5-3.3 0-6.6-.3-9.9-.9-3.3-.6-6.5-1.6-9.5-2.9-3-1.3-5.9-3-8.4-5.1-2.6-2.1-4.7-4.5-6.5-7.2h-.4v51.2h-22.6V137.7zm79 51.4c0-4.6-.6-9.1-1.8-13.5-1.2-4.4-3-8.2-5.4-11.6-2.4-3.4-5.4-6.1-8.9-8.1-3.6-2-7.7-3.1-12.3-3.1-9.5 0-16.7 3.3-21.5 9.9-4.8 6.6-7.2 15.4-7.2 26.4 0 5.2.6 10 1.9 14.4 1.3 4.4 3.1 8.2 5.7 11.4 2.5 3.2 5.5 5.7 9 7.5 3.5 1.9 7.6 2.8 12.2 2.8 5.2 0 9.5-1.1 13.1-3.2 3.6-2.1 6.5-4.9 8.8-8.2 2.3-3.4 4-7.2 5-11.5.9-4.3 1.4-8.7 1.4-13.2zm39.9-90.5h22.6V120h-22.6V98.6zm0 39.1h22.6v102.6h-22.6V137.7zm42.8-39.1H945v141.7h-22.6V98.6zm91.9 144.5c-8.2 0-15.5-1.4-21.9-4.1-6.4-2.7-11.8-6.5-16.3-11.2-4.4-4.8-7.8-10.5-10.1-17.1-2.3-6.6-3.5-13.9-3.5-21.8 0-7.8 1.2-15 3.5-21.6 2.3-6.6 5.7-12.3 10.1-17.1 4.4-4.8 9.9-8.5 16.3-11.2 6.4-2.7 13.7-4.1 21.9-4.1s15.5 1.4 21.9 4.1c6.4 2.7 11.8 6.5 16.3 11.2 4.4 4.8 7.8 10.5 10.1 17.1 2.3 6.6 3.5 13.8 3.5 21.6 0 7.9-1.2 15.2-3.5 21.8-2.3 6.6-5.7 12.3-10.1 17.1-4.4 4.8-9.9 8.5-16.3 11.2-6.4 2.7-13.7 4.1-21.9 4.1zm0-17.9c5 0 9.4-1.1 13.1-3.2 3.7-2.1 6.7-4.9 9.1-8.3 2.4-3.4 4.1-7.3 5.3-11.6 1.1-4.3 1.7-8.7 1.7-13.2 0-4.4-.6-8.7-1.7-13.1s-2.9-8.2-5.3-11.6c-2.4-3.4-5.4-6.1-9.1-8.2-3.7-2.1-8.1-3.2-13.1-3.2s-9.4 1.1-13.1 3.2c-3.7 2.1-6.7 4.9-9.1 8.2-2.4 3.4-4.1 7.2-5.3 11.6-1.1 4.4-1.7 8.7-1.7 13.1 0 4.5.6 8.9 1.7 13.2 1.1 4.3 2.9 8.2 5.3 11.6 2.4 3.4 5.4 6.2 9.1 8.3 3.7 2.2 8.1 3.2 13.1 3.2zm58.4-87.5h17.1v-30.8h22.6v30.8h20.4v16.9h-20.4v54.8c0 2.4.1 4.4.3 6.2.2 1.7.7 3.2 1.4 4.4.7 1.2 1.8 2.1 3.3 2.7 1.5.6 3.4.9 6 .9 1.6 0 3.2 0 4.8-.1 1.6-.1 3.2-.3 4.8-.7v17.5c-2.5.3-5 .5-7.3.8-2.4.3-4.8.4-7.3.4-6 0-10.8-.6-14.4-1.7-3.6-1.1-6.5-2.8-8.5-5-2.1-2.2-3.4-4.9-4.2-8.2-.7-3.3-1.2-7.1-1.3-11.3v-60.5h-17.1v-17.1z" data-color="1"></path>
                        <path d="M271.3 98.6H167.7L135.7 0l-32.1 98.6L0 98.5l83.9 61L51.8 258l83.9-60.9 83.8 60.9-32-98.5 83.8-60.9z" fill="#00b67a" data-color="2"></path>
                        <path d="m194.7 181.8-7.2-22.3-51.8 37.6z" fill="#005128" data-color="3"></path>
                      </g>
                    </svg>
                  </a>
                </div>

                {/* Customer Reviews List */}
                <div className="space-y-6">
                  {/* Review 1 */}
                  <div className="border-b border-[#563635]/10 pb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#b7384e]/10 flex items-center justify-center text-[#b7384e] font-medium">
                          TW
                        </div>
                        <div>
                          <h4 className="font-medium text-[#563635]">Tulsipriya Wahengbam</h4>
                          <p className="text-sm text-[#563635]/70">IN • 2 reviews</p>
                        </div>
                      </div>
                      <div className="text-sm text-[#563635]/70">Mar 27, 2025</div>
                    </div>
                    <div className="flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00b67a" stroke="#00b67a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <h5 className="font-medium text-[#563635] mb-2">The product is iconic.❤️</h5>
                    <p className="text-[#563635]/70">Date of experience: March 15, 2025</p>
                  </div>

                  {/* Review 2 */}
                  <div className="border-b border-[#563635]/10 pb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#b7384e]/10 flex items-center justify-center text-[#b7384e] font-medium">
                          AJ
                        </div>
                        <div>
                          <h4 className="font-medium text-[#563635]">Adrija Jana</h4>
                          <p className="text-sm text-[#563635]/70">IN • 1 review</p>
                        </div>
                      </div>
                      <div className="text-sm text-[#563635]/70">Mar 25, 2025</div>
                    </div>
                    <div className="flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00b67a" stroke="#00b67a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <h5 className="font-medium text-[#563635] mb-2">Trustworthy and Meets Expectations</h5>
                    <p className="text-[#563635]/70 mb-2">Smooth ordering experience and trustworthy, since the exact product shown in the preview was delivered. Beautiful designs as well. I'm sold!</p>
                    <p className="text-[#563635]/70">Date of experience: March 25, 2025</p>
                  </div>

                  {/* Review 3 */}
                  <div className="border-b border-[#563635]/10 pb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#b7384e]/10 flex items-center justify-center text-[#b7384e] font-medium">
                          AA
                        </div>
                        <div>
                          <h4 className="font-medium text-[#563635]">aachal agarwal</h4>
                          <p className="text-sm text-[#563635]/70">IN • 2 reviews</p>
                        </div>
                      </div>
                      <div className="text-sm text-[#563635]/70">Mar 8, 2025</div>
                    </div>
                    <div className="flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00b67a" stroke="#00b67a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <h5 className="font-medium text-[#563635] mb-2">This the best gift I could give</h5>
                    <p className="text-[#563635]/70 mb-2">This the best gift I could give, thank you !!</p>
                    <p className="text-[#563635]/70">Date of experience: March 8, 2025</p>
                  </div>

                  {/* Review 4 */}
                  <div className="border-b border-[#563635]/10 pb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#b7384e]/10 flex items-center justify-center text-[#b7384e] font-medium">
                          PR
                        </div>
                        <div>
                          <h4 className="font-medium text-[#563635]">Pubg Rich</h4>
                          <p className="text-sm text-[#563635]/70">IN • 1 review</p>
                        </div>
                      </div>
                      <div className="text-sm text-[#563635]/70">Feb 24, 2025</div>
                    </div>
                    <div className="flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00b67a" stroke="#00b67a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <h5 className="font-medium text-[#563635] mb-2">I loved the product and its amazing</h5>
                    <p className="text-[#563635]/70 mb-2">I loved the product and its amazing</p>
                    <p className="text-[#563635]/70">Date of experience: February 23, 2025</p>
                  </div>

                  {/* Review 5 */}
                  <div className="pb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#b7384e]/10 flex items-center justify-center text-[#b7384e] font-medium">
                          AS
                        </div>
                        <div>
                          <h4 className="font-medium text-[#563635]">Adyasha Soumya Routray</h4>
                          <p className="text-sm text-[#563635]/70">IN • 1 review</p>
                        </div>
                      </div>
                      <div className="text-sm text-[#563635]/70">Feb 11, 2025</div>
                    </div>
                    <div className="flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00b67a" stroke="#00b67a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <h5 className="font-medium text-[#563635] mb-2">Besttt</h5>
                    <p className="text-[#563635]/70 mb-2">Besttt. Love it.</p>
                    <p className="text-[#563635]/70">Date of experience: February 11, 2025</p>
                  </div>
                </div>

                {/* Read More Reviews Button */}
                <div className="mt-8 text-center">
                  <a 
                    href="https://www.trustpilot.com/review/pinenlime.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#000000] text-white rounded-md hover:bg-[#00b67a]/90 transition-colors"
                  >
                    <span>Read more reviews on</span>
                    <svg preserveAspectRatio="xMidYMid meet" data-bbox="0 0 1133 278.2" viewBox="0 0 1133 278.2" xmlns="http://www.w3.org/2000/svg" data-type="color" role="presentation" aria-hidden="true" className="h-5">
                      <g>
                        <path fill="#ffffff" d="M297.7 98.6h114.7V120h-45.1v120.3h-24.8V120h-44.9V98.6zm109.8 39.1h21.2v19.8h.4c.7-2.8 2-5.5 3.9-8.1 1.9-2.6 4.2-5.1 6.9-7.2 2.7-2.2 5.7-3.9 9-5.3 3.3-1.3 6.7-2 10.1-2 2.6 0 4.5.1 5.5.2s2 .3 3.1.4v21.8c-1.6-.3-3.2-.5-4.9-.7-1.7-.2-3.3-.3-4.9-.3-3.8 0-7.4.8-10.8 2.3-3.4 1.5-6.3 3.8-8.8 6.7-2.5 3-4.5 6.6-6 11s-2.2 9.4-2.2 15.1v48.8h-22.6V137.7zm164 102.6h-22.2V226h-.4c-2.8 5.2-6.9 9.3-12.4 12.4-5.5 3.1-11.1 4.7-16.8 4.7-13.5 0-23.3-3.3-29.3-10s-9-16.8-9-30.3v-65.1H504v62.9c0 9 1.7 15.4 5.2 19.1 3.4 3.7 8.3 5.6 14.5 5.6 4.8 0 8.7-.7 11.9-2.2 3.2-1.5 5.8-3.4 7.7-5.9 2-2.4 3.4-5.4 4.3-8.8.9-3.4 1.3-7.1 1.3-11.1v-59.5h22.6v102.5zm38.5-32.9c.7 6.6 3.2 11.2 7.5 13.9 4.4 2.6 9.6 4 15.7 4 2.1 0 4.5-.2 7.2-.5s5.3-1 7.6-1.9c2.4-.9 4.3-2.3 5.9-4.1 1.5-1.8 2.2-4.1 2.1-7-.1-2.9-1.2-5.3-3.2-7.1-2-1.9-4.5-3.3-7.6-4.5-3.1-1.1-6.6-2.1-10.6-2.9-4-.8-8-1.7-12.1-2.6-4.2-.9-8.3-2.1-12.2-3.4-3.9-1.3-7.4-3.1-10.5-5.4-3.1-2.2-5.6-5.1-7.4-8.6-1.9-3.5-2.8-7.8-2.8-13 0-5.6 1.4-10.2 4.1-14 2.7-3.8 6.2-6.8 10.3-9.1 4.2-2.3 8.8-3.9 13.9-4.9 5.1-.9 10-1.4 14.6-1.4 5.3 0 10.4.6 15.2 1.7 4.8 1.1 9.2 2.9 13.1 5.5 3.9 2.5 7.1 5.8 9.7 9.8 2.6 4 4.2 8.9 4.9 14.6h-23.6c-1.1-5.4-3.5-9.1-7.4-10.9-3.9-1.9-8.4-2.8-13.4-2.8-1.6 0-3.5.1-5.7.4-2.2.3-4.2.8-6.2 1.5-1.9.7-3.5 1.8-4.9 3.2-1.3 1.4-2 3.2-2 5.5 0 2.8 1 5 2.9 6.7 1.9 1.7 4.4 3.1 7.5 4.3 3.1 1.1 6.6 2.1 10.6 2.9 4 .8 8.1 1.7 12.3 2.6 4.1.9 8.1 2.1 12.1 3.4 4 1.3 7.5 3.1 10.6 5.4 3.1 2.3 5.6 5.1 7.5 8.5 1.9 3.4 2.9 7.7 2.9 12.7 0 6.1-1.4 11.2-4.2 15.5-2.8 4.2-6.4 7.7-10.8 10.3-4.4 2.6-9.4 4.6-14.8 5.8-5.4 1.2-10.8 1.8-16.1 1.8-6.5 0-12.5-.7-18-2.2-5.5-1.5-10.3-3.7-14.3-6.6-4-3-7.2-6.7-9.5-11.1-2.3-4.4-3.5-9.7-3.7-15.8H610zm74.6-69.7h17.1v-30.8h22.6v30.8h20.4v16.9h-20.4v54.8c0 2.4.1 4.4.3 6.2.2 1.7.7 3.2 1.4 4.4.7 1.2 1.8 2.1 3.3 2.7 1.5.6 3.4.9 6 .9 1.6 0 3.2 0 4.8-.1 1.6-.1 3.2-.3 4.8-.7v17.5c-2.5.3-5 .5-7.3.8-2.4.3-4.8.4-7.3.4-6 0-10.8-.6-14.4-1.7-3.6-1.1-6.5-2.8-8.5-5-2.1-2.2-3.4-4.9-4.2-8.2-.7-3.3-1.2-7.1-1.3-11.3v-60.5h-17.1v-17.1zm76.1 0h21.4v13.9h.4c3.2-6 7.6-10.2 13.3-12.8 5.7-2.6 11.8-3.9 18.5-3.9 8.1 0 15.1 1.4 21.1 4.3 6 2.8 11 6.7 15 11.7 4 5 6.9 10.8 8.9 17.4 2 6.6 3 13.7 3 21.2 0 6.9-.9 13.6-2.7 20-1.8 6.5-4.5 12.2-8.1 17.2-3.6 5-8.2 8.9-13.8 11.9-5.6 3-12.1 4.5-19.7 4.5-3.3 0-6.6-.3-9.9-.9-3.3-.6-6.5-1.6-9.5-2.9-3-1.3-5.9-3-8.4-5.1-2.6-2.1-4.7-4.5-6.5-7.2h-.4v51.2h-22.6V137.7zm79 51.4c0-4.6-.6-9.1-1.8-13.5-1.2-4.4-3-8.2-5.4-11.6-2.4-3.4-5.4-6.1-8.9-8.1-3.6-2-7.7-3.1-12.3-3.1-9.5 0-16.7 3.3-21.5 9.9-4.8 6.6-7.2 15.4-7.2 26.4 0 5.2.6 10 1.9 14.4 1.3 4.4 3.1 8.2 5.7 11.4 2.5 3.2 5.5 5.7 9 7.5 3.5 1.9 7.6 2.8 12.2 2.8 5.2 0 9.5-1.1 13.1-3.2 3.6-2.1 6.5-4.9 8.8-8.2 2.3-3.4 4-7.2 5-11.5.9-4.3 1.4-8.7 1.4-13.2zm39.9-90.5h22.6V120h-22.6V98.6zm0 39.1h22.6v102.6h-22.6V137.7zm42.8-39.1H945v141.7h-22.6V98.6zm91.9 144.5c-8.2 0-15.5-1.4-21.9-4.1-6.4-2.7-11.8-6.5-16.3-11.2-4.4-4.8-7.8-10.5-10.1-17.1-2.3-6.6-3.5-13.9-3.5-21.8 0-7.8 1.2-15 3.5-21.6 2.3-6.6 5.7-12.3 10.1-17.1 4.4-4.8 9.9-8.5 16.3-11.2 6.4-2.7 13.7-4.1 21.9-4.1s15.5 1.4 21.9 4.1c6.4 2.7 11.8 6.5 16.3 11.2 4.4 4.8 7.8 10.5 10.1 17.1 2.3 6.6 3.5 13.8 3.5 21.6 0 7.9-1.2 15.2-3.5 21.8-2.3 6.6-5.7 12.3-10.1 17.1-4.4 4.8-9.9 8.5-16.3 11.2-6.4 2.7-13.7 4.1-21.9 4.1zm0-17.9c5 0 9.4-1.1 13.1-3.2 3.7-2.1 6.7-4.9 9.1-8.3 2.4-3.4 4.1-7.3 5.3-11.6 1.1-4.3 1.7-8.7 1.7-13.2 0-4.4-.6-8.7-1.7-13.1s-2.9-8.2-5.3-11.6c-2.4-3.4-5.4-6.1-9.1-8.2-3.7-2.1-8.1-3.2-13.1-3.2s-9.4 1.1-13.1 3.2c-3.7 2.1-6.7 4.9-9.1 8.2-2.4 3.4-4.1 7.2-5.3 11.6-1.1 4.4-1.7 8.7-1.7 13.1 0 4.5.6 8.9 1.7 13.2 1.1 4.3 2.9 8.2 5.3 11.6 2.4 3.4 5.4 6.2 9.1 8.3 3.7 2.2 8.1 3.2 13.1 3.2zm58.4-87.5h17.1v-30.8h22.6v30.8h20.4v16.9h-20.4v54.8c0 2.4.1 4.4.3 6.2.2 1.7.7 3.2 1.4 4.4.7 1.2 1.8 2.1 3.3 2.7 1.5.6 3.4.9 6 .9 1.6 0 3.2 0 4.8-.1 1.6-.1 3.2-.3 4.8-.7v17.5c-2.5.3-5 .5-7.3.8-2.4.3-4.8.4-7.3.4-6 0-10.8-.6-14.4-1.7-3.6-1.1-6.5-2.8-8.5-5-2.1-2.2-3.4-4.9-4.2-8.2-.7-3.3-1.2-7.1-1.3-11.3v-60.5h-17.1v-17.1zm76.1 0h21.4v13.9h.4c3.2-6 7.6-10.2 13.3-12.8 5.7-2.6 11.8-3.9 18.5-3.9 8.1 0 15.1 1.4 21.1 4.3 6 2.8 11 6.7 15 11.7 4 5 6.9 10.8 8.9 17.4 2 6.6 3 13.7 3 21.2 0 6.9-.9 13.6-2.7 20-1.8 6.5-4.5 12.2-8.1 17.2-3.6 5-8.2 8.9-13.8 11.9-5.6 3-12.1 4.5-19.7 4.5-3.3 0-6.6-.3-9.9-.9-3.3-.6-6.5-1.6-9.5-2.9-3-1.3-5.9-3-8.4-5.1-2.6-2.1-4.7-4.5-6.5-7.2h-.4v51.2h-22.6V137.7zm79 51.4c0-4.6-.6-9.1-1.8-13.5-1.2-4.4-3-8.2-5.4-11.6-2.4-3.4-5.4-6.1-8.9-8.1-3.6-2-7.7-3.1-12.3-3.1-9.5 0-16.7 3.3-21.5 9.9-4.8 6.6-7.2 15.4-7.2 26.4 0 5.2.6 10 1.9 14.4 1.3 4.4 3.1 8.2 5.7 11.4 2.5 3.2 5.5 5.7 9 7.5 3.5 1.9 7.6 2.8 12.2 2.8 5.2 0 9.5-1.1 13.1-3.2 3.6-2.1 6.5-4.9 8.8-8.2 2.3-3.4 4-7.2 5-11.5.9-4.3 1.4-8.7 1.4-13.2zm39.9-90.5h22.6V120h-22.6V98.6zm0 39.1h22.6v102.6h-22.6V137.7zm42.8-39.1H945v141.7h-22.6V98.6zm91.9 144.5c-8.2 0-15.5-1.4-21.9-4.1-6.4-2.7-11.8-6.5-16.3-11.2-4.4-4.8-7.8-10.5-10.1-17.1-2.3-6.6-3.5-13.9-3.5-21.8 0-7.8 1.2-15 3.5-21.6 2.3-6.6 5.7-12.3 10.1-17.1 4.4-4.8 9.9-8.5 16.3-11.2 6.4-2.7 13.7-4.1 21.9-4.1s15.5 1.4 21.9 4.1c6.4 2.7 11.8 6.5 16.3 11.2 4.4 4.8 7.8 10.5 10.1 17.1 2.3 6.6 3.5 13.8 3.5 21.6 0 7.9-1.2 15.2-3.5 21.8-2.3 6.6-5.7 12.3-10.1 17.1-4.4 4.8-9.9 8.5-16.3 11.2-6.4 2.7-13.7 4.1-21.9 4.1zm0-17.9c5 0 9.4-1.1 13.1-3.2 3.7-2.1 6.7-4.9 9.1-8.3 2.4-3.4 4.1-7.3 5.3-11.6 1.1-4.3 1.7-8.7 1.7-13.2 0-4.4-.6-8.7-1.7-13.1s-2.9-8.2-5.3-11.6c-2.4-3.4-5.4-6.1-9.1-8.2-3.7-2.1-8.1-3.2-13.1-3.2s-9.4 1.1-13.1 3.2c-3.7 2.1-6.7 4.9-9.1 8.2-2.4 3.4-4.1 7.2-5.3 11.6-1.1 4.4-1.7 8.7-1.7 13.1 0 4.5.6 8.9 1.7 13.2 1.1 4.3 2.9 8.2 5.3 11.6 2.4 3.4 5.4 6.2 9.1 8.3 3.7 2.2 8.1 3.2 13.1 3.2zm58.4-87.5h17.1v-30.8h22.6v30.8h20.4v16.9h-20.4v54.8c0 2.4.1 4.4.3 6.2.2 1.7.7 3.2 1.4 4.4.7 1.2 1.8 2.1 3.3 2.7 1.5.6 3.4.9 6 .9 1.6 0 3.2 0 4.8-.1 1.6-.1 3.2-.3 4.8-.7v17.5c-2.5.3-5 .5-7.3.8-2.4.3-4.8.4-7.3.4-6 0-10.8-.6-14.4-1.7-3.6-1.1-6.5-2.8-8.5-5-2.1-2.2-3.4-4.9-4.2-8.2-.7-3.3-1.2-7.1-1.3-11.3v-60.5h-17.1v-17.1z" data-color="1"></path>
                        <path d="M271.3 98.6H167.7L135.7 0l-32.1 98.6L0 98.5l83.9 61L51.8 258l83.9-60.9 83.8 60.9-32-98.5 83.8-60.9z" fill="#00b67a" data-color="2"></path>
                        <path d="m194.7 181.8-7.2-22.3-51.8 37.6z" fill="#005128" data-color="3"></path>
                      </g>
                    </svg>
                  </a>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add Marker Modal - Always rendered but controlled by CSS */}
      <div 
        style={{ 
          display: isAddMarkerModalOpen ? 'block' : 'none',
          opacity: isAddMarkerModalOpen ? 1 : 0,
          visibility: isAddMarkerModalOpen ? 'visible' : 'hidden',
          pointerEvents: isAddMarkerModalOpen ? 'auto' : 'none'
        }}
      >
        <AddMarkerModal 
          onClose={handleCloseAddMarkerModal} 
          onAddMarker={handleAddMarker} 
          initialMarker={editingMarkerData} 
          onUpdateMarker={handleUpdateMarker} 
        />
      </div>

      <div ref={mapPreviewContainer} className="w-[500px] h-[500px] relative" style={{
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "none"
      }}></div>

      {/* Map Preview Modal */}
      {isPreviewModalOpen && <MapPreviewModal onClose={handleClosePreviewModal} onSave={handleSaveMapSettings} markers={markers} title={mapTitle} initialSettings={mapData} frameSize={size} />}

      <ProductFooter />
    </div>
  );
}
