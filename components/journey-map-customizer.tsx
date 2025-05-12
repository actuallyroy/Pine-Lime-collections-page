"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { X, Search, Plus, Minus, MapPin, Check, Trash2, Move, Palette, Loader2, Smile } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "../styles/mapbox-overrides.css"; // Import Mapbox overrides
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { MapStyle, defaultMapStyles, fetchMapStyles } from "@/lib/map-styles";
import MapboxMap from "./mapbox-map";

// Replace with your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// CSS to hide Mapbox controls
const hideMapboxControls = `
  .mapboxgl-ctrl-logo {
    display: none !important;
  }
  .mapboxgl-ctrl-attrib-inner {
    display: none !important;
  }
  .mapboxgl-ctrl-attrib {
    display: none !important;
  }
  
  /* Emoji Picker styles */
  emoji-picker {
    --background: white;
    --border-color: #e0e0e0;
    --category-font-color: #563635;
    --indicator-color: #b7384e;
    --input-border-color: #e0e0e0;
    --input-font-color: #563635;
    --input-placeholder-color: #999;
    --search-background: #f6f6f6;
    --search-focus-background: #fff;
    --search-icon-color: #999;
    --category-font-size: 14px;
    --emoji-size: 24px;
    --num-columns: 8;
    width: 320px;
    height: 400px;
    position: absolute;
    box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    z-index: 100;
  }
`;

// Add a defaultMapStyle constant to match the one in mapbox-map.tsx
const DEFAULT_MAP_STYLE = {
  labelled: "mapbox://styles/pinenlime/ckknu6rsw62dq17nubbhdk7zg",
  unlabelled: "mapbox://styles/pinenlime/ckqzddkfy3p9l18p7toi6zq4r",
};

const DEFAULT_MAP_CENTER: [number, number] = [55.14, 25.069]; // Dubai coordinates
const DEFAULT_MAP_ZOOM = 15;

interface JourneyMapCustomizerProps {
  onClose: () => void;
  onSave: (mapData: any) => void;
  initialMapData?: any;
}

export default function JourneyMapCustomizer({ onClose, onSave, initialMapData }: JourneyMapCustomizerProps) {
  // Debug initialMapData
  useEffect(() => {
    console.log("InitialMapData:", initialMapData);
  }, [initialMapData]);

  // Map state
  const [mapTitle, setMapTitle] = useState(initialMapData?.title || "Our Journey");
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialMapData?.center || DEFAULT_MAP_CENTER);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{
    place_name: string;
    center: [number, number];
    id: string;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  
  // Always use the direct style URL for the default
  // Force the default style if initialMapData is null or the style is the streets style
  const initialStyle = initialMapData?.style && 
    initialMapData.style !== "mapbox://styles/mapbox/streets-v12" 
    ? initialMapData.style 
    : DEFAULT_MAP_STYLE.labelled;
    
  const [mapStyle, setMapStyle] = useState(initialStyle);
  
  console.log("Initial map style set to:", initialStyle);

  const [showLabels, setShowLabels] = useState(initialMapData?.showLabels ?? true);
  const [routeType, setRouteType] = useState(initialMapData?.routeType || "none");
  const [zoom, setZoom] = useState(initialMapData?.zoom || DEFAULT_MAP_ZOOM);
  const [markers, setMarkers] = useState<Array<{ emoji: string; label: string; position: { x: number; y: number } }>>(initialMapData?.markers || []);

  // Custom map styles state
  const [customStyles, setCustomStyles] = useState<MapStyle[]>([]);
  const [isLoadingStyles, setIsLoadingStyles] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState("markers");
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [newMarkerEmoji, setNewMarkerEmoji] = useState("📍");
  const [newMarkerLabel, setNewMarkerLabel] = useState("");
  const [isDraggingMarker, setIsDraggingMarker] = useState(false);
  const [draggedMarkerIndex, setDraggedMarkerIndex] = useState<number | null>(null);
  
  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const mapMarkers = useRef<mapboxgl.Marker[]>([]);

  // Fetch custom map styles using the utility function
  useEffect(() => {
    const getStyles = async () => {
      setIsLoadingStyles(true);
      try {
        const styles = await fetchMapStyles();
        setCustomStyles(styles);

        // If the initial style is not a default one, keep it
        if (!mapStyle.startsWith("mapbox://styles/mapbox/")) {
          // Otherwise set the first custom style as default
          if (styles.length > 0) {
            setMapStyle(styles[0].styleId);
          }
        }
      } catch (error) {
        console.error("Error fetching map styles:", error);
      } finally {
        setIsLoadingStyles(false);
      }
    };

    getStyles();
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current !== null) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Load emoji picker script once
  useEffect(() => {
    // This effect only runs client-side
    if (typeof window === 'undefined') return;
    
    // Check if script is already added
    if (!document.querySelector('script[src*="emoji-picker-element"]')) {
      // Import the script directly
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js';
      script.type = 'module';
      document.head.appendChild(script);
    }
  }, []);
  
  // Handle emoji picker events
  useEffect(() => {
    // This effect only runs client-side
    if (typeof window === 'undefined') return;
    
    // Handle emoji selection
    const handleEmojiSelect = (event: any) => {
      setNewMarkerEmoji(event.detail.unicode);
      setShowEmojiPicker(false);
    };
    
    // Add the event listener when the picker is shown
    if (showEmojiPicker && emojiPickerRef.current) {
      const picker = emojiPickerRef.current.querySelector('emoji-picker');
      picker?.addEventListener('emoji-click', handleEmojiSelect);
    }
    
    // Handle clicks outside emoji picker
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current && 
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      
      // Clean up event listener
      if (emojiPickerRef.current) {
        const picker = emojiPickerRef.current.querySelector('emoji-picker');
        picker?.removeEventListener('emoji-click', handleEmojiSelect);
      }
    };
  }, [showEmojiPicker]);

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

  // Save the map customization
  const handleSave = () => {
    // Determine the correct style URL to save
    let finalStyleUrl = mapStyle;
    
    console.log("Saving map with style:", mapStyle);
    
    // Handle custom styles from our API
    const isCustomStyle = customStyles.some((style) => style.styleId === mapStyle);
    if (isCustomStyle && showLabels) {
      const currentStyle = customStyles.find((style) => style.styleId === mapStyle);
      if (currentStyle) {
        finalStyleUrl = currentStyle.styleIdLabelled;
        console.log("Saving with custom labelled style:", finalStyleUrl);
      }
    }
    // Handle our default styles
    else if (mapStyle === 'labelled') {
      finalStyleUrl = DEFAULT_MAP_STYLE.labelled;
    } else if (mapStyle === 'unlabelled') {
      finalStyleUrl = DEFAULT_MAP_STYLE.unlabelled;
    }
    // Handle standard Mapbox styles
    else if (!mapStyle.includes('mapbox://')) {
      finalStyleUrl = `mapbox://styles/mapbox/${mapStyle}`;
    }
    
    console.log("Final style URL saved:", finalStyleUrl);
    
    onSave({
      title: mapTitle,
      style: finalStyleUrl,
      showLabels,
      routeType,
      zoom,
      center: mapCenter,
      markers,
    });
  };

  // Replace the static map styles with custom styles from the API
  const renderMapStyles = (customStyles: MapStyle[], isLoadingStyles: boolean, mapStyle: string, setMapStyle: (style: string) => void) => {
    if (isLoadingStyles) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-[#563635]" />
          <span className="ml-2 text-[#563635]">Loading map styles...</span>
        </div>
      );
    }

    // Helper function to check if a style is selected
    const isStyleSelected = (styleId: string) => {
      // Direct match
      if (mapStyle === styleId) return true;
      
      // Match with our default labelled style
      if (styleId === 'streets-v12' && mapStyle === `mapbox://styles/mapbox/streets-v12`) return true;
      if (styleId === DEFAULT_MAP_STYLE.labelled && mapStyle === DEFAULT_MAP_STYLE.labelled) return true;
      
      return false;
    };

    if (customStyles.length === 0) {
      // Fallback to default styles if custom ones fail to load
      return (
        <div className="grid grid-cols-3 gap-2">
          {defaultMapStyles.map((style) => (
            <button key={style.id} type="button" onClick={() => setMapStyle(`mapbox://styles/mapbox/${style.id}`)} className={`p-1 rounded-md border hover:border-[#b7384e] transition-colors ${isStyleSelected(style.id) ? "border-[#b7384e] ring-1 ring-[#b7384e]" : "border-[#563635]/20"}`}>
              <div className="aspect-square relative rounded overflow-hidden">
                <Image src={style.image || "/placeholder.svg"} alt={style.name} width={80} height={80} className="object-cover h-full" />
              </div>
              <p className="text-xs text-center mt-1">{style.name}</p>
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-2 max-h-[350px] overflow-y-auto">
        {customStyles.map((style) => (
          <button key={style.ID} type="button" onClick={() => setMapStyle(style.styleId)} className={`p-1 rounded-md border hover:border-[#b7384e] transition-colors ${isStyleSelected(style.styleId) ? "border-[#b7384e] ring-1 ring-[#b7384e]" : "border-[#563635]/20"}`}>
            <div className="aspect-square relative rounded overflow-hidden">
              <Image src={style.image} alt={style.Title} width={80} height={80} className="object-cover h-full aspect-square min-w-[121px]" />
            </div>
            <p className="text-xs text-center mt-1">{style.Title}</p>
          </button>
        ))}
      </div>
    );
  };

  // Confirm adding a marker with label
  const handleAddMarker = () => {
    if (draggedMarkerIndex === null) return;

    const updatedMarkers = [...markers];
    updatedMarkers[draggedMarkerIndex] = {
      ...updatedMarkers[draggedMarkerIndex],
      label: newMarkerLabel,
    };

    setMarkers(updatedMarkers);
    setIsAddingMarker(false);
    setSelectedMarker(null);
    setDraggedMarkerIndex(null);

    // Hide the label input dialog
    document.getElementById("marker-label-dialog")?.classList.add("hidden");
  };

  // Cancel adding a marker
  const handleCancelAddMarker = () => {
    if (draggedMarkerIndex !== null) {
      const updatedMarkers = [...markers];
      updatedMarkers.pop(); // Remove the temporary marker
      setMarkers(updatedMarkers);
    }

    setIsAddingMarker(false);
    setSelectedMarker(null);
    setDraggedMarkerIndex(null);

    // Hide the label input dialog
    document.getElementById("marker-label-dialog")?.classList.add("hidden");
  };

  // Remove a marker
  const handleRemoveMarker = (index: number) => {
    const updatedMarkers = [...markers];
    updatedMarkers.splice(index, 1);
    setMarkers(updatedMarkers);
  };

  // Start dragging a marker
  const handleMarkerDragStart = (index: number) => {
    setIsDraggingMarker(true);
    setDraggedMarkerIndex(index);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <style>{hideMapboxControls}</style>
      <div className="flex flex-col bg-white rounded-lg shadow-xl w-fit h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-[#563635]">Customize Your Journey Map</h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex gap-4 p-4 h-full justify-center">
          {/* Map preview */}
          <div className="border rounded-md overflow-hidden relative aspect-[4/3] md:aspect-square min-h-[400px] min-w-[400px] h-full">
            <MapboxMap
              initialCenter={mapCenter}
              initialZoom={zoom}
              markers={markers.map((marker, index) => ({
                id: `marker-${index}`,
                coordinates: [marker.position.x, marker.position.y],
                title: marker.label,
                description: marker.emoji
              }))}
              style={mapStyle}
            />

            {/* Map title overlay */}
            <div className="absolute left-1/2 bottom-8 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded shadow-md z-10">
              <input className="text-center text-lg font-medium text-[#563635] bg-transparent border-none focus:outline-none focus:ring-0 w-full" placeholder="Enter map title..." type="text" value={mapTitle} onChange={(e) => setMapTitle(e.target.value)} />
            </div>

            {/* Map controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-[#563635]/20 shadow-md">
                    <Palette className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2">{renderMapStyles(customStyles, isLoadingStyles, mapStyle, setMapStyle)}</PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setIsAddingMarker(true);
                  setNewMarkerEmoji("📍");
                }}
                className={`h-10 w-10 bg-white border-[#563635]/20 shadow-md ${isAddingMarker ? "border-[#b7384e] text-[#b7384e]" : ""}`}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Customization options */}
          <div className="min-w-[424px]">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="markers">Markers</TabsTrigger>
                <TabsTrigger value="style">Map Style</TabsTrigger>
              </TabsList>
              <TabsContent value="markers" className="space-y-4 mt-4">
                {/* Marker tools */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#563635]">Add Markers</h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingMarker(!isAddingMarker);
                        setNewMarkerEmoji("📍");
                      }}
                      className={isAddingMarker ? "border-[#b7384e] text-[#b7384e]" : ""}
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      {isAddingMarker ? "Cancel" : "Add Marker"}
                    </Button>

                    {isAddingMarker && (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <button
                            ref={emojiButtonRef}
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="w-8 h-8 flex items-center justify-center rounded-md border border-[#563635]/20 hover:border-[#b7384e]"
                          >
                            <Smile className="h-5 w-5" />
                          </button>
                          <div className="ml-2 w-8 h-8 flex items-center justify-center rounded-md text-lg border border-[#b7384e] bg-[#b7384e]/10">
                            {newMarkerEmoji}
                          </div>
                        </div>
                        
                        {showEmojiPicker && (
                          <div 
                            className="absolute z-50" 
                            style={{ top: "220px", left: "120px" }} 
                            ref={emojiPickerRef}
                            dangerouslySetInnerHTML={{ __html: '<emoji-picker></emoji-picker>' }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Search */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#563635]">Search Location</h3>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#563635]/50" />
                      <Input 
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
                        placeholder="Search for a location..."
                        className="pl-8"
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
                                onClick={() => {
                                  const [lng, lat] = suggestion.center;
                                  setMapCenter([lng, lat]);
                                  setSearchQuery(suggestion.place_name);
                                  setShowSuggestions(false);
                                  console.log(`Selected location: ${suggestion.place_name} at ${lng}, ${lat}`);
                                }}
                              >
                                {suggestion.place_name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Marker list */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#563635]">Your Markers</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {markers.length === 0 ? (
                      <p className="text-sm text-[#563635]/70">No markers added yet. Click the + button on the map to add markers.</p>
                    ) : (
                      markers.map((marker, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-md border border-[#563635]/20">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{marker.emoji}</span>
                            <span className="text-sm font-medium text-[#563635]">{marker.label || "Unnamed"}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleRemoveMarker(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="style" className="space-y-4 mt-4">
                {/* Style options */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#563635]">Map Style</h3>
                  {renderMapStyles(customStyles, isLoadingStyles, mapStyle, setMapStyle)}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-labels" className="text-sm font-medium text-[#563635]">
                      Show Labels
                    </Label>
                    <Switch id="show-labels" checked={showLabels} onCheckedChange={setShowLabels} />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#563635]">Route Type</h3>
                  <RadioGroup value={routeType} onValueChange={setRouteType} className="grid grid-cols-3 gap-2">
                    <div>
                      <RadioGroupItem value="none" id="route-none" className="peer sr-only" />
                      <Label htmlFor="route-none" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#b7384e] [&:has([data-state=checked])]:border-[#b7384e]">
                        <span className="text-xs">None</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="straight" id="route-straight" className="peer sr-only" />
                      <Label htmlFor="route-straight" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#b7384e] [&:has([data-state=checked])]:border-[#b7384e]">
                        <span className="text-xs">Straight</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="curved" id="route-curved" className="peer sr-only" />
                      <Label htmlFor="route-curved" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#b7384e] [&:has([data-state=checked])]:border-[#b7384e]">
                        <span className="text-xs">Curved</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#563635]">Zoom Level</h3>
                  <Slider
                    value={[zoom]}
                    min={1}
                    max={20}
                    step={0.5}
                    onValueChange={(values) => {
                      setZoom(values[0]);
                    }}
                  />
                  <div className="flex justify-between text-xs text-[#563635]/70">
                    <span>World</span>
                    <span>Street</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="p-4 border-t flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>

        {/* Marker label input dialog */}
        <div id="marker-label-dialog" className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 hidden">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-[#563635]">Add Marker Label</h3>
            </div>
            <div className="p-4">
              <Input placeholder="Enter a label for this marker..." value={newMarkerLabel} onChange={(e) => setNewMarkerLabel(e.target.value)} className="w-full" />
            </div>
            <div className="p-4 border-t flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancelAddMarker}>
                Cancel
              </Button>
              <Button onClick={handleAddMarker}>
                <Check className="h-4 w-4 mr-1" />
                Add Marker
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
