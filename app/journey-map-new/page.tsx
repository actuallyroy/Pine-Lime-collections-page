"use client";

import { useState, useEffect } from "react";
import { ChevronRight, Heart, Plus, Trash2, ShoppingCart, AlertTriangle, Edit } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { fetchMapStyles, MapStyle } from "@/lib/map-styles";

export default function JourneyMapPage() {
  const [frame, setFrame] = useState("brown");
  const [size, setSize] = useState("8");
  const [price, setPrice] = useState(69.99);
  const [originalPrice, setOriginalPrice] = useState(79.99);
  const [isSticky, setIsSticky] = useState(false);
  const [isAddMarkerModalOpen, setIsAddMarkerModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [editingMarkerIndex, setEditingMarkerIndex] = useState<number | null>(null);
  const [editingMarkerData, setEditingMarkerData] = useState<Marker | undefined>(undefined);
  const [mapTitle, setMapTitle] = useState("Our Journey");
  const [mapData, setMapData] = useState<Partial<MapData>>({ mapStyle: "default", routeType: "none", mapType: "custom" });
  const [hasPreviewedMap, setHasPreviewedMap] = useState(false);
  const [showPreviewWarning, setShowPreviewWarning] = useState(false);
  const [mapStyles, setMapStyles] = useState<MapStyle[]>([]);
  const [modalKey, setModalKey] = useState(0);

  // Handle scroll for sticky add to cart on mobile
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsSticky(scrollPosition > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update price based on selections
  useEffect(() => {
    const basePrice = size === "a3" ? 69.99 : 89.99;
    const framePrice = frame === "none" ? 0 : frame === "teak" ? 39.99 : 29.99;

    setPrice(basePrice + framePrice);
    setOriginalPrice((basePrice + framePrice) * 1.15); // 15% off
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
    setModalKey(prev => prev + 1);
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
    setMapData(settings);
    setIsPreviewModalOpen(false);
    setHasPreviewedMap(true);
    setShowPreviewWarning(false);
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!hasPreviewedMap && markers.length > 0) {
      setShowPreviewWarning(true);
      // Scroll to warning
      setTimeout(() => {
        document.getElementById("preview-warning")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      // Add to cart logic here
      console.log("Adding to cart:", { markers, mapTitle, mapData, frame, size });
      alert("Added to cart!");
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
                <span className="text-3xl font-bold text-[#b7384e]">${price.toFixed(2)}</span>
                <span className="text-lg text-[#563635]/60 line-through">${originalPrice.toFixed(2)}</span>
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
                    { value: "brown", label: "Dark Brown", price: "+$29.99" },
                    { value: "natural", label: "Natural", price: "+$29.99" },
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
                      <span className={`text-sm ${frame === option.value ? "text-[#b7384e]" : "text-[#563635]/70"}`}>{option.price}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Size Selection */}
              <div>
                <h3 className="text-lg font-medium text-[#563635] mb-3">Size</h3>
                <RadioGroup value={size} onValueChange={setSize} className="flex flex-wrap gap-3">
                  {[
                    { value: "4", label: "4x4 in", price: "$69.99" },
                    { value: "6", label: "6x6 in", price: "$89.99" },
                    { value: "8", label: "8x8 in", price: "$109.99" },
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
                      </div>
                      <span className={`text-sm ${size === option.value ? "text-[#b7384e]" : "text-[#563635]/70"}`}>{option.price}</span>
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
                            <div className="text-sm font-medium text-[#563635] truncate">{marker.markerLabel}</div>
                            <div className="text-xs text-[#563635]/70 truncate">{marker.locationName}</div>
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
            <div className="flex gap-4 mt-6">
                <Button className="flex-1 bg-[#b7384e] hover:bg-[#b7384e]/90 text-white py-6 text-lg" disabled={markers.length === 0} onClick={handleAddToCart}>
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
          key={modalKey}
          onClose={handleCloseAddMarkerModal} 
          onAddMarker={handleAddMarker} 
          initialMarker={editingMarkerData} 
          onUpdateMarker={handleUpdateMarker} 
        />
      </div>

      {/* Map Preview Modal */}
      {isPreviewModalOpen && <MapPreviewModal onClose={handleClosePreviewModal} onSave={handleSaveMapSettings} markers={markers} title={mapTitle} initialSettings={mapData} frameSize={size} />}

      <ProductFooter />
    </div>
  );
}
