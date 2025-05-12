"use client"

import type React from "react"

import { useState, useRef, useCallback, useMemo, memo, useEffect } from "react"
import { X, Search, Plus, Minus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import MapboxMap from "./mapbox-map"
import mapboxgl from "mapbox-gl"
// Set the Mapbox access token for Geocoding API
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
import EmojiPicker from 'emoji-picker-react'

// Define the shape of a marker for add and update
type MarkerData = {
  emoji: string;
  label: string;
  location: string;
  position: { x: number; y: number };
  markerImage?: string;
  size: "small" | "medium" | "large";
};

interface AddMarkerModalProps {
  onClose: () => void
  onAddMarker: (marker: MarkerData) => void
  initialMarker?: MarkerData
  onUpdateMarker?: (marker: MarkerData) => void
}

// Create a memoized version of MapboxMap to prevent unnecessary rerenders
const MemoizedMapboxMap = memo(MapboxMap);

// Add marker image generation function
const generateMarkerImg = (emojiTxt: string, label: string, size: number = 40, labelFont: string = "Arial") => {
  const canvas = document.createElement("canvas");
  let fontSize = size * 0.6;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.font = `${fontSize}px ${labelFont}`;
  const labelMetrics = ctx.measureText(label);
  const textWidth = labelMetrics.width + 20;
  let emojiY = size * 0.9;

  let textHeight = size * 0.92;

  ctx.font = `${size}px "Noto Color Emoji"`;
  const emojiMetrics = ctx.measureText(emojiTxt);
  const emojiWidth = emojiMetrics.width;

  canvas.height = textHeight + size + 20;
  canvas.width = Math.max(emojiWidth, textWidth);

  ctx.font = `${size}px "Noto Color Emoji"`;
  ctx.fillText(emojiTxt, textWidth / 2 - emojiWidth / 2 < 0 ? 0 : textWidth / 2 - emojiWidth / 2, emojiY);
  ctx.font = `${fontSize}px ${labelFont}`;
  ctx.strokeStyle = "white"; // Outline color
  ctx.lineWidth = 8; // Outline width
  ctx.lineJoin = "round";
  ctx.strokeText(label, 10, size + size * 0.72);
  ctx.fillText(label, 10, size + size * 0.72);

  return canvas.toDataURL();
};

export default function AddMarkerModal({ onClose, onAddMarker, initialMarker, onUpdateMarker }: AddMarkerModalProps) {
  // Use initialMarker to determine edit mode
  const isEditMode = Boolean(initialMarker);

  const [searchQuery, setSearchQuery] = useState(initialMarker?.location || "")
  const [selectedEmoji, setSelectedEmoji] = useState(initialMarker?.emoji || "❤️")
  const [markerLabel, setMarkerLabel] = useState(initialMarker?.label || "")
  const [markerPosition, setMarkerPosition] = useState<{ x: number; y: number }>(initialMarker?.position || { x: 55.14, y: 25.069 })
  const [markerSize, setMarkerSize] = useState<"small" | "medium" | "large">(initialMarker?.size || "medium")
  
  // Location search related states
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{
    place_name: string;
    center: [number, number];
    id: string;
  }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<number | null>(null)
  
  // Use refs to track map state without causing rerenders
  const mapCenterRef = useRef<[number, number]>([55.14, 25.069])
  const zoomRef = useRef(12)
  // State is only used for the initial render or when we need to force an update
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.14, 25.069])
  const [zoom, setZoom] = useState(12)
  // Track if we need to update the map state
  const shouldUpdateMapRef = useRef(false)

  const mapRef = useRef<HTMLDivElement>(null)


  const handleEmojiClick = (emojiData: any, event: MouseEvent) => {
    setSelectedEmoji(emojiData.emoji);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current !== null) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle clicks outside suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Synchronize ref values with state when needed
  useEffect(() => {
    if (shouldUpdateMapRef.current) {
      setMapCenter(mapCenterRef.current);
      setZoom(zoomRef.current);
      shouldUpdateMapRef.current = false;
    }
  }, [shouldUpdateMapRef.current]);

  // Handle zoom in/out functions
  const handleZoomIn = useCallback(() => {
    zoomRef.current = Math.min(zoomRef.current + 1, 18);
    shouldUpdateMapRef.current = true;
    setZoom(zoomRef.current); // Force update now
  }, []);

  const handleZoomOut = useCallback(() => {
    zoomRef.current = Math.max(zoomRef.current - 1, 5);
    shouldUpdateMapRef.current = true;
    setZoom(zoomRef.current); // Force update now
  }, []);

  // Define marker sizes
  const sizeMap = {
    small: 20,
    medium: 22,
    large: 24
  };

  // Memoize marker data to prevent unnecessary rerenders
  const markerData = useMemo(() => {
    const markerImage = generateMarkerImg(
      selectedEmoji, 
      markerLabel || "",
      sizeMap[markerSize]
    );
    
    return [{
      id: "marker-1",
      coordinates: [markerPosition.x, markerPosition.y] as [number, number],
      title: markerLabel,
      description: searchQuery,
      customMarker: markerImage ? {
        element: document.createElement("img"),
        options: {
          element: (() => {
            const img = document.createElement("img");
            img.src = markerImage;
            img.className = "marker";
            img.height = sizeMap[markerSize];
            return img;
          })()
        }
      } : undefined,
      isDragging: true
    }];
  }, [markerPosition, selectedEmoji, markerLabel, searchQuery, markerSize]);

  // Memoize callback functions for the MapboxMap component
  const handleMapClick = useCallback((coordinates: [number, number]) => {
    // Update both the marker position and map center
    setMarkerPosition({ x: coordinates[0], y: coordinates[1] });
    mapCenterRef.current = coordinates;
    setMapCenter(coordinates);
  }, []);

  const handleMapMoveEnd = useCallback((coordinates: [number, number]) => {
    // Update ref without causing re-render
    mapCenterRef.current = coordinates;
    // Update marker position to match the new center
    setMarkerPosition({ x: coordinates[0], y: coordinates[1] });
  }, []);

  // Confirm adding a marker with label
  const handleAddMarker = useCallback(() => {
    if (!markerPosition) return;
    const markerImage = generateMarkerImg(
      selectedEmoji,
      markerLabel || "New Marker",
      sizeMap[markerSize]
    );
    const markerDataObj: MarkerData = {
      emoji: selectedEmoji,
      label: markerLabel,
      location: searchQuery || "Custom Location",
      position: markerPosition,
      markerImage: markerImage || undefined,
      size: markerSize
    };
    if (isEditMode && onUpdateMarker) {
      onUpdateMarker(markerDataObj);
    } else {
      onAddMarker(markerDataObj);
    }
    onClose();
  }, [markerPosition, selectedEmoji, markerLabel, searchQuery, markerSize, onAddMarker, onUpdateMarker, onClose, isEditMode]);

  // Handle suggestion selection
  const handleSelectLocation = useCallback((suggestion: { place_name: string; center: [number, number] }) => {
    setSearchQuery(suggestion.place_name);
    mapCenterRef.current = suggestion.center;
    shouldUpdateMapRef.current = true;
    setMapCenter(suggestion.center);
    setShowSuggestions(false);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-[#563635]">Add a Marker</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar */}
          <div className="w-80 border-r bg-[#fcf8ed] flex flex-col h-full relative">
            {/* Scrollable content with bottom padding for button */}
            <div className="p-4 flex-1 overflow-auto pb-24">
              <div className="space-y-4">
                {/* Search */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#563635]">Step 1: Search Location</h3>
                  <form className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#563635]/50" />
                      <Input
                        type="text"
                        placeholder="Search for a place..."
                        className="pl-8 border-[#563635]/20 focus-visible:ring-[#b7384e]"
                        value={searchQuery}
                        onChange={(e) => {
                          const query = e.target.value;
                          setSearchQuery(query);
                          
                          // Clear any existing timeout
                          if (searchTimeoutRef.current) {
                            clearTimeout(searchTimeoutRef.current);
                          }
                          
                          // Fetch suggestions when the query is not empty with debounce
                          if (query.trim()) {
                            setIsSearchingLocation(true);
                            
                            // Wait 300ms before making the API call to avoid too many requests while typing
                            searchTimeoutRef.current = window.setTimeout(() => {
                              fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&limit=5`)
                                .then(response => response.json())
                                .then(data => {
                                  if (data.features && data.features.length > 0) {
                                    const suggestions = data.features.map((feature: any) => ({
                                      place_name: feature.place_name,
                                      center: feature.center,
                                      id: feature.id,
                                    }));
                                    setLocationSuggestions(suggestions);
                                    setShowSuggestions(true);
                                  } else {
                                    setLocationSuggestions([]);
                                    setShowSuggestions(false);
                                  }
                                  setIsSearchingLocation(false);
                                })
                                .catch(error => {
                                  console.error('Error fetching suggestions:', error);
                                  setLocationSuggestions([]);
                                  setShowSuggestions(false);
                                  setIsSearchingLocation(false);
                                });
                            }, 300);
                          } else {
                            setLocationSuggestions([]);
                            setShowSuggestions(false);
                            setIsSearchingLocation(false);
                          }
                        }}
                        ref={searchInputRef}
                        onFocus={() => {
                          if (locationSuggestions.length > 0) {
                            setShowSuggestions(true);
                          }
                        }}
                      />
                      
                      {/* Suggestions dropdown */}
                      {showSuggestions && locationSuggestions.length > 0 && (
                        <div 
                          ref={suggestionsRef}
                          className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-[#e0e0e0]"
                        >
                          <ul className="py-1">
                            {locationSuggestions.map((suggestion) => (
                              <li
                                key={suggestion.id}
                                className="px-3 py-2 text-sm hover:bg-[#f6f6f6] cursor-pointer"
                                onClick={() => handleSelectLocation(suggestion)}
                              >
                                {suggestion.place_name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </form>
                  <p className="text-xs text-[#563635]/70">
                    Search for a location, then pan and zoom to find the exact spot
                  </p>
                </div>

                {/* Emoji Picker Selection */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#563635]">Step 2: Choose an Emoji</h3>
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width="100%"
                    height={300}
                    previewConfig={{ showPreview: false }}
                    searchPlaceholder="Search"
                    className="rounded-md border border-[#563635]/20"
                  />
                </div>

                {/* Marker size selection */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#563635]">Step 3: Choose Marker Size</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { size: "small", label: "Small" },
                      { size: "medium", label: "Medium" },
                      { size: "large", label: "Large" }
                    ].map(({ size, label }) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setMarkerSize(size as "small" | "medium" | "large")}
                        className={`p-2 rounded-md border text-sm ${
                          markerSize === size
                            ? "bg-[#b7384e]/10 border-[#b7384e] ring-1 ring-[#b7384e]"
                            : "border-[#563635]/20 hover:border-[#563635]/40"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Label input */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#563635]">Step 4: Add Label (Optional)</h3>
                  <Input
                    type="text"
                    placeholder="Enter a label for this marker"
                    value={markerLabel}
                    onChange={(e) => setMarkerLabel(e.target.value)}
                    className="border-[#563635]/20 focus-visible:ring-[#b7384e]"
                  />
                </div>

                {/* Instructions */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#563635]">Step 5: Place Your Marker</h3>
                  <p className="text-xs text-[#563635]/70">Click on the map to place your marker at the exact location</p>
                  <div className="flex items-center gap-2 p-2 bg-[#563635]/5 rounded-md">
                    <div className="text-xl">{selectedEmoji}</div>
                    <div className="text-sm text-[#563635]">
                      {markerPosition ? "Marker placed! Adjust position by panning the map." : "No marker placed yet"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Fixed Add Marker button at bottom of sidebar */}
            <div className="absolute bottom-0 left-0 w-full border-t p-4 bg-white">
              <Button
                onClick={handleAddMarker}
                disabled={!markerPosition}
                className="w-full bg-[#b7384e] hover:bg-[#b7384e]/90 text-white"
              >
                {initialMarker ? "Update Marker" : "Add This Marker"}
              </Button>
            </div>
          </div>

          {/* Map area */}
          <div className="flex-1 relative overflow-hidden" ref={mapRef}>
            {/* Map */}
            <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
              <MemoizedMapboxMap
                markers={markerData}
                initialZoom={zoom}
                initialCenter={mapCenter}
                onClick={handleMapClick}
                onMoveEnd={handleMapMoveEnd}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
