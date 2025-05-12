"use client"

import { useState, useMemo, useEffect } from "react"
import { X, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image"
import { projectCoordinatesToPixels } from "@/lib/map-utils"

interface MapPreviewModalProps {
  onClose: () => void
  onSave: (settings: { style: string; routeType: string; mapType: string }) => void
  markers: Array<{
    emoji: string;
    label: string;
    location: string;
    position: { x: number; y: number };
    coordinates?: [number, number]; // Longitude, latitude
  }>
  title: string
  initialSettings?: { style: string; routeType: string; mapType: string }
}

// Map styles keyed to Mapbox style IDs
const MAPBOX_STYLES = {
  vintage: "mapbox://styles/mapbox/outdoors-v12",
  retro: "mapbox://styles/mapbox/light-v11",
  minimal: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-v9",
  terrain: "mapbox://styles/mapbox/satellite-streets-v12",
  dark: "mapbox://styles/mapbox/dark-v11",
};

export default function MapPreviewModal({
  onClose,
  onSave,
  markers,
  title,
  initialSettings = { style: "vintage", routeType: "none", mapType: "default" },
}: MapPreviewModalProps) {
  const [activeTab, setActiveTab] = useState("style")
  const [mapStyle, setMapStyle] = useState(initialSettings.style)
  const [routeType, setRouteType] = useState(initialSettings.routeType)
  const [mapType, setMapType] = useState(initialSettings.mapType)
  const [imageWidth, setImageWidth] = useState(800)
  const [imageHeight, setImageHeight] = useState(600)
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0])
  const [mapZoom, setMapZoom] = useState(1)

  // Log markers for debugging
  useEffect(() => {
    console.log("Map preview markers:", markers);
    console.log("Markers with coordinates:", markers.filter(m => m.coordinates));
  }, [markers]);

  // Calculate the map center and zoom based on markers
  useEffect(() => {
    if (markers.length === 0) return;
    
    // If we have markers with coordinates, use them to calculate map center and zoom
    const markersWithCoords = markers.filter(marker => marker.coordinates);
    
    if (markersWithCoords.length === 0) return;
    
    // Calculate bounds
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    
    markersWithCoords.forEach(marker => {
      if (!marker.coordinates) return;
      const [lng, lat] = marker.coordinates;
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });
    
    // Add padding
    const padding = 0.1; // 10% padding
    minLng -= (maxLng - minLng) * padding;
    maxLng += (maxLng - minLng) * padding;
    minLat -= (maxLat - minLat) * padding;
    maxLat += (maxLat - minLat) * padding;
    
    // Calculate center
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;
    setMapCenter([centerLng, centerLat]);
    
    // Calculate zoom (simplified)
    const lngDiff = maxLng - minLng;
    const latDiff = maxLat - minLat;
    const maxDiff = Math.max(lngDiff, latDiff);
    
    // Use a simple formula to estimate zoom level
    // Adjust these values based on testing
    let zoom = 12;
    if (maxDiff > 10) zoom = 2;
    else if (maxDiff > 5) zoom = 4;
    else if (maxDiff > 2) zoom = 6;
    else if (maxDiff > 1) zoom = 8;
    else if (maxDiff > 0.5) zoom = 10;
    
    setMapZoom(zoom);
  }, [markers]);

  // Map styles with preview images
  const mapStyles = [
    { id: "vintage", name: "Vintage", image: "/placeholder.svg?height=80&width=80&text=Vintage" },
    { id: "retro", name: "Retro", image: "/placeholder.svg?height=80&width=80&text=Retro" },
    { id: "minimal", name: "Minimal", image: "/placeholder.svg?height=80&width=80&text=Minimal" },
    { id: "satellite", name: "Satellite", image: "/placeholder.svg?height=80&width=80&text=Satellite" },
    { id: "terrain", name: "Terrain", image: "/placeholder.svg?height=80&width=80&text=Terrain" },
    { id: "dark", name: "Dark", image: "/placeholder.svg?height=80&width=80&text=Dark" },
  ]

  // Map types
  const mapTypes = [
    {
      id: "default",
      name: "Default",
      description: "Standard map with all markers shown in their exact positions",
      image: "/placeholder.svg?height=120&width=120&text=Default",
    },
    {
      id: "fit",
      name: "Fit Markers",
      description: "Adjusts marker positions to avoid overlapping",
      image: "/placeholder.svg?height=120&width=120&text=Fit%20Markers",
    },
    {
      id: "split",
      name: "Split Heart",
      description: "Creates a heart shape with each section showing a different location",
      image: "/placeholder.svg?height=120&width=120&text=Split%20Heart",
    },
  ]

  // Get the Mapbox Static Images API URL
  const getMapboxStaticImageUrl = useMemo(() => {
    // Check if we have a valid access token
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    const fallbackToken = 'pk.eyJ1IjoicGluZW5saW1lIiwiYSI6ImNrN3N6eTQ0bzByNmgzbXBsdmlwY25reDIifQ.QZROImVZfGk44ZIJLlYXQg';
    const token = accessToken || fallbackToken;
    
    if (!token) {
      console.error("Missing Mapbox access token in environment variables and no fallback available");
      return "/placeholder.svg?height=800&width=800&text=Missing+Mapbox+Token";
    }
    
    // Get style ID based on selected style
    const styleId = mapStyle === 'vintage' ? 'ckknu6rsw62dq17nubbhdk7zg' :
                   mapStyle === 'retro' ? 'ckkoxifdu2ish17pduguuwkk7' :
                   mapStyle === 'minimal' ? 'ckqzddkfy3p9l18p7toi6zq4r' :
                   mapStyle === 'satellite' ? 'cl8t7rd9t000214qs4xs9l5bn' :
                   mapStyle === 'terrain' ? 'cl8t9aq3r001314pdcl2eil34' :
                   mapStyle === 'dark' ? 'cl8t9r8kj000814nrakkfm353' :
                   'ckknu6rsw62dq17nubbhdk7zg'; // default to vintage
                   
    // Construct URL using the provided reference pattern
    const baseUrl = 'https://api.mapbox.com/styles/v1/pinenlime/';
    const path = styleId + '/static/';
    
    // If no markers with coordinates, use default location (New York)
    const hasCoordinates = markers.some(marker => marker.coordinates);
    console.log("Has markers with coordinates:", hasCoordinates);
    
    let longitude, latitude;
    
    if (hasCoordinates) {
      // Find a marker with coordinates to use as center
      const centerMarker = markers.find(marker => marker.coordinates);
      // Use calculated center and zoom if available, otherwise use first marker
      longitude = centerMarker ? centerMarker.coordinates![0] : mapCenter[0];
      latitude = centerMarker ? centerMarker.coordinates![1] : mapCenter[1];
    } else {
      // Default to Dubai's coordinates as a fallback
      longitude = 55.2708;
      latitude = 25.2048;
    }
    
    const coords = longitude + ',' + latitude + ',' + mapZoom + ',0';
    
    const size = `/${imageWidth}x${imageHeight}@2x`;
    const params = `?access_token=${token}&logo=false&attribution=false`;
    
    const url = baseUrl + path + coords + size + params;
    console.log("Generated Mapbox URL:", url);
    return url;
  }, [mapStyle, mapCenter, mapZoom, imageWidth, imageHeight, markers]);

  // Project geographical coordinates to pixel coordinates for marker positioning
  const getMarkerPixelCoordinates = (markerCoords: [number, number]) => {
    // This function would normally use the Mapbox GL's project function
    // Since we're using a static image, we'll use a simplified version
    return projectCoordinatesToPixels(
      markerCoords,
      mapCenter,
      mapZoom,
      imageWidth,
      imageHeight
    );
  };

  const handleSave = () => {
    onSave({ style: mapStyle, routeType, mapType })
  }

  // Render map based on selected map type
  const renderMap = () => {
    switch (mapType) {
      case "fit":
        return (
          <div className="w-full h-full relative">
            <Image 
              src={getMapboxStaticImageUrl} 
              alt="Map Preview" 
              fill 
              className="object-cover"
              unoptimized
            />

            {/* Map title */}
            <div className="absolute left-1/2 bottom-8 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded shadow-md">
              <div className="text-center text-lg font-medium text-[#563635]">{title}</div>
            </div>

            {/* Markers with adjusted positions to avoid overlap */}
            {markers.map((marker, index) => {
              // Calculate adjusted positions to avoid overlap
              // This is a simplified example - in a real implementation, you'd use a more sophisticated algorithm
              const totalMarkers = markers.length;
              const angleStep = (2 * Math.PI) / totalMarkers;
              const radius = 30; // % from center
              const centerX = 50;
              const centerY = 50;
              const angle = index * angleStep;
              const x = centerX + radius * Math.cos(angle);
              const y = centerY + radius * Math.sin(angle);

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
            {routeType !== "none" && markers.length > 1 && (
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
                      strokeDasharray={routeType === "air" ? "5,5" : "none"}
                    />
                  )
                })}
              </svg>
            )}
          </div>
        )

      case "split":
        return (
          <div className="w-full h-full relative">
            {/* Heart-shaped split map */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Create heart shape with sections */}
                {markers.map((marker, index) => {
                  // Calculate section of the heart for each marker
                  const totalMarkers = markers.length
                  const sectionPath = getSplitHeartSection(index, totalMarkers)

                  return (
                    <g key={index}>
                      <path d={sectionPath} fill={`url(#map-section-${index})`} stroke="#fff" strokeWidth="0.5" />
                      <defs>
                        <pattern id={`map-section-${index}`} patternUnits="userSpaceOnUse" width="100" height="100">
                          <image
                            href={getMapboxStaticImageUrl}
                            x="0"
                            y="0"
                            width="100"
                            height="100"
                            preserveAspectRatio="xMidYMid slice"
                          />
                        </pattern>
                      </defs>

                      {/* Marker label */}
                      <text
                        x={getHeartSectionCenter(index, totalMarkers).x}
                        y={getHeartSectionCenter(index, totalMarkers).y}
                        textAnchor="middle"
                        fill="white"
                        fontSize="4"
                        fontWeight="bold"
                        stroke="#000"
                        strokeWidth="0.5"
                      >
                        {marker.label}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Map title */}
            <div className="absolute left-1/2 bottom-8 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded shadow-md">
              <div className="text-center text-lg font-medium text-[#563635]">{title}</div>
            </div>
          </div>
        )

      case "default":
      default:
        return (
          <div className="w-full h-full relative">
            <Image 
              src={getMapboxStaticImageUrl} 
              alt="Map Preview" 
              fill 
              className="object-cover"
              unoptimized
            />

            {/* Map title */}
            <div className="absolute left-1/2 bottom-8 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded shadow-md">
              <div className="text-center text-lg font-medium text-[#563635]">{title}</div>
            </div>

            {/* Markers */}
            {markers.map((marker, index) => {
              // If the marker has coordinates, project them to pixels
              let left = `${marker.position.x}%`;
              let top = `${marker.position.y}%`;
              
              if (marker.coordinates) {
                const pixelCoords = getMarkerPixelCoordinates(marker.coordinates);
                // Convert to percentage of container
                left = `${(pixelCoords[0] / imageWidth) * 100}%`;
                top = `${(pixelCoords[1] / imageHeight) * 100}%`;
              }
              
              return (
                <div
                  key={index}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{
                    left: left,
                    top: top,
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
              );
            })}

            {/* Routes between markers */}
            {routeType !== "none" && markers.length > 1 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {markers.slice(0, -1).map((marker, index) => {
                  const nextMarker = markers[index + 1];
                  
                  // Get position either from projected coordinates or from the position property
                  let x1, y1, x2, y2;
                  
                  if (marker.coordinates) {
                    const pixelCoords = getMarkerPixelCoordinates(marker.coordinates);
                    x1 = (pixelCoords[0] / imageWidth) * 100;
                    y1 = (pixelCoords[1] / imageHeight) * 100;
                  } else {
                    x1 = marker.position.x;
                    y1 = marker.position.y;
                  }
                  
                  if (nextMarker.coordinates) {
                    const pixelCoords = getMarkerPixelCoordinates(nextMarker.coordinates);
                    x2 = (pixelCoords[0] / imageWidth) * 100;
                    y2 = (pixelCoords[1] / imageHeight) * 100;
                  } else {
                    x2 = nextMarker.position.x;
                    y2 = nextMarker.position.y;
                  }
                  
                  return (
                    <line
                      key={index}
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke="#b7384e"
                      strokeWidth="2"
                      strokeDasharray={routeType === "air" ? "5,5" : "none"}
                    />
                  );
                })}
              </svg>
            )}
          </div>
        )
    }
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-[#563635]">Preview Your Journey Map</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Map preview */}
          <div className="flex-1 p-6 flex items-center justify-center bg-[#fcf8ed]">
            <div className="relative aspect-[3/4] w-full max-w-md mx-auto">{renderMap()}</div>
          </div>

          {/* Settings panel */}
          <div className="w-80 border-l p-4 flex flex-col overflow-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="style">Map Style</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
              </TabsList>

              <TabsContent value="style" className="mt-4 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#563635]">Map Style</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {mapStyles.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setMapStyle(style.id)}
                        className={`p-1 rounded-md border hover:border-[#b7384e] transition-colors ${
                          mapStyle === style.id ? "border-[#b7384e] ring-1 ring-[#b7384e]" : "border-[#563635]/20"
                        }`}
                      >
                        <div className="aspect-square relative rounded overflow-hidden">
                          <img
                            src={style.image || "/placeholder.svg"}
                            alt={style.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <p className="text-xs text-center mt-1">{style.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#563635]">Route Type</h3>
                  <RadioGroup value={routeType} onValueChange={setRouteType} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="route-none" />
                      <Label htmlFor="route-none">No Routes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="road" id="route-road" />
                      <Label htmlFor="route-road">Road Routes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="air" id="route-air" />
                      <Label htmlFor="route-air">Air Routes</Label>
                    </div>
                  </RadioGroup>
                </div>
              </TabsContent>

              <TabsContent value="layout" className="mt-4 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#563635]">Map Layout</h3>
                  <div className="space-y-3">
                    {mapTypes.map((type) => (
                      <div
                        key={type.id}
                        className={`p-3 border rounded-md cursor-pointer ${
                          mapType === type.id
                            ? "border-[#b7384e] bg-[#b7384e]/5"
                            : "border-[#563635]/20 hover:border-[#563635]/40"
                        }`}
                        onClick={() => setMapType(type.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 shrink-0 rounded overflow-hidden border border-[#563635]/10">
                            <img
                              src={type.image || "/placeholder.svg"}
                              alt={type.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <h4 className="font-medium text-[#563635]">{type.name}</h4>
                              {type.id === "split" && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-4 w-4 text-[#563635]/60" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs max-w-[200px]">
                                        Best with 3-7 markers. Creates a beautiful heart-shaped collage of your journey.
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <p className="text-xs text-[#563635]/70 mt-1">{type.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

            </Tabs>

            <div className="mt-auto pt-4">
              <Button onClick={handleSave} className="w-full bg-[#b7384e] hover:bg-[#b7384e]/90 text-white">
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
