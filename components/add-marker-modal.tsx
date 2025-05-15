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
import dynamic from 'next/dynamic'
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })
import { EmojiStyle } from 'emoji-picker-react'
import { generateMarkerImg } from "@/lib/map-utils"

interface AddMarkerModalProps {
  onClose: () => void
  onAddMarker: (marker: Marker) => void
  initialMarker?: Marker
  onUpdateMarker?: (marker: Marker) => void
}

// Create a memoized version of MapboxMap to prevent unnecessary rerenders
const MemoizedMapboxMap = memo(MapboxMap);


export default function AddMarkerModal({ onClose, onAddMarker, initialMarker, onUpdateMarker }: AddMarkerModalProps) {
  // Use initialMarker to determine edit mode
  const isEditMode = Boolean(initialMarker);

  const [searchQuery, setSearchQuery] = useState(initialMarker?.locationName || "")
  const [selectedEmoji, setSelectedEmoji] = useState(initialMarker?.markerEmoji || "❤️")
  const [markerLabel, setMarkerLabel] = useState(initialMarker?.markerLabel || "")
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(initialMarker?.markerCoordinates || [55.14, 25.069])
  const [markerSize, setMarkerSize] = useState<"L" | "M" | "S">(initialMarker?.markerSize || "M")
  
  // Update state when initialMarker changes
  useEffect(() => {
    if (initialMarker) {
      setSearchQuery(initialMarker.locationName || "");
      setSelectedEmoji(initialMarker.markerEmoji || "❤️");
      setMarkerLabel(initialMarker.markerLabel || "");
      setMarkerPosition(initialMarker.markerCoordinates || [55.14, 25.069]);
      setMarkerSize(initialMarker.markerSize || "M");
      
      // Update map center
      if (initialMarker.markerLocation) {
        mapCenterRef.current = [initialMarker.markerLocation[0], initialMarker.markerLocation[1]];
        setMapCenter([initialMarker.markerLocation[0], initialMarker.markerLocation[1]]);
      }
    }
  }, [initialMarker]);

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
  
  // Determine initial map center based on edit mode marker
  const initialCenterValue: [number, number] = initialMarker?.markerLocation
    ? [initialMarker.markerLocation[0], initialMarker.markerLocation[1]]
    : [55.14, 25.069];
  // Use refs to track map state without causing rerenders
  const mapCenterRef = useRef<[number, number]>(initialCenterValue)
  const zoomRef = useRef(12)
  // State is only used for the initial render or when we need to force an update
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenterValue)
  const [zoom, setZoom] = useState(12)
  // Track if we need to update the map state
  const shouldUpdateMapRef = useRef(false)

  const mapRef = useRef<HTMLDivElement>(null)

  const isAppleDevice = useMemo(() => typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent), []);
  const emojiPickerStyle = isAppleDevice ? EmojiStyle.APPLE : EmojiStyle.GOOGLE;

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

  // Memoize marker data to prevent unnecessary rerenders
  const markerData = useMemo(() => {    
    return [{
      markerId: initialMarker?.markerId || "",
      markerSize: markerSize,
      markerLabel: markerLabel,
      markerCoordinates: markerPosition,
      markerEmoji: selectedEmoji,
      markerLocation: markerPosition,
    }];
  }, [markerPosition, selectedEmoji, markerLabel, searchQuery, markerSize, emojiPickerStyle]);

  // Memoize callback functions for the MapboxMap component
  const handleMapClick = useCallback((coordinates: [number, number]) => {
    // Update both the marker position and map center
    setMarkerPosition(coordinates);
    mapCenterRef.current = coordinates;
    setMapCenter(coordinates);
  }, []);

  const handleMove = useCallback((coordinates: [number, number]) => {
    setMarkerPosition(coordinates);
  }, []);

  // Mapping of marker sizes to pixel values for center overlay
  const sizePxMap: Record<"S"|"M"|"L", number> = { S: 20, M: 22, L: 24 };
  // Generate center overlay marker image
  const centerMarkerImg = useMemo(
    () => generateMarkerImg(selectedEmoji, markerLabel, sizePxMap[markerSize]),
    [selectedEmoji, markerLabel, markerSize]
  );

  // Confirm adding a marker with label, using reverse geocoding if no search query
  const handleAddMarker = useCallback(async () => {
    if (!markerPosition) return;
    let locationName = searchQuery;
    if (!locationName) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${markerPosition[0]},${markerPosition[1]}.json?access_token=${mapboxgl.accessToken}&limit=1`
        );
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          locationName = data.features[0].place_name;
        } else {
          locationName = "Unknown Location";
        }
      } catch (error) {
        console.error("Reverse geocoding error:", error);
        locationName = "Unknown Location";
      }
    }
    const markerDataObj: Marker = {
      markerId: initialMarker?.markerId || `marker-${Date.now()}`, // Generate a new ID only if not editing
      markerEmoji: selectedEmoji,
      markerLabel: markerLabel,
      markerLocation: [markerPosition[0], markerPosition[1]],
      markerCoordinates: markerPosition,
      markerSize: markerSize,
      locationName: locationName
    };
    if (isEditMode && onUpdateMarker) {
      onUpdateMarker(markerDataObj);
    } else {
      onAddMarker(markerDataObj);
    }
    onClose();
  }, [markerPosition, searchQuery, selectedEmoji, markerLabel, markerSize, onAddMarker, onUpdateMarker, onClose, isEditMode, initialMarker]);

  // Handle suggestion selection
  const handleSelectLocation = useCallback((suggestion: { place_name: string; center: [number, number] }) => {
    setSearchQuery(suggestion.place_name);
    mapCenterRef.current = suggestion.center;
    shouldUpdateMapRef.current = true;
    setMapCenter(suggestion.center);
    // Update marker position to the selected location
    setMarkerPosition(suggestion.center);
    setShowSuggestions(false);
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden transition-opacity duration-200"
      style={{ 
        opacity: 1,
        visibility: 'visible',
        pointerEvents: 'auto'
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full md:max-w-5xl h-full md:h-[80vh] flex flex-col transform transition-transform duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-[#563635]">Add a Marker</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col-reverse md:flex-row overflow-hidden">
          {/* Left sidebar */}
          <div className="w-full md:w-80 h-1/2 md:h-full border-b md:border-r bg-[#fcf8ed] flex flex-col relative">
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
                        value={typeof searchQuery === 'string' ? searchQuery : ''}
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

                {/* Label input */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#563635]">Step 2: Add Label (Optional)</h3>
                  <Input
                    type="text"
                    placeholder="Enter a label for this marker"
                    value={markerLabel}
                    onChange={(e) => setMarkerLabel(e.target.value)}
                    className="border-[#563635]/20 focus-visible:ring-[#b7384e]"
                  />
                </div>


                {/* Emoji Picker Selection */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#563635]">Step 3: Choose an Emoji</h3>
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width="100%"
                    height={300}
                    previewConfig={{ showPreview: false }}
                    searchPlaceholder="Search"
                    className="rounded-md border border-[#563635]/20"
                    emojiStyle={emojiPickerStyle}
                  />
                </div>

                {/* Marker size selection */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#563635]">Step 4: Choose Marker Size</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { size: "S", label: "Small" },
                      { size: "M", label: "Medium" },
                      { size: "L", label: "Large" }
                    ].map(({ size, label }) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setMarkerSize(size as "S" | "M" | "L")}
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

                {/* Instructions */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#563635]">Step 5: Place Your Marker</h3>
                  <p className="text-xs text-[#563635]/70">Pan around the map to place your marker at the exact location</p>
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
            <div className="absolute bottom-0 left-0 w-full border-t p-4 bg-white z-10">
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
          <div className="w-full h-1/2 md:flex-1 md:h-full relative overflow-hidden" ref={mapRef}>
            {/* Map */}
            <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
              <MemoizedMapboxMap
                initialZoom={zoom}
                initialCenter={mapCenter}
                onClick={handleMapClick}
                onMove={handleMove}
              />
              {/* Static center marker overlay for smooth panning */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <img
                  src={centerMarkerImg || ""}
                  alt="Center marker"
                  className="marker"
                  style={{ height: sizePxMap[markerSize] * 3 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
