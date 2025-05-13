"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { X, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image"
import { projectCoordinatesToPixels } from "@/lib/map-utils"
import { fetchMapStyles, MapStyle } from "@/lib/map-styles"
import MapboxMap from "./mapbox-map"
import { setMapInstance, getMapInstance } from "@/utils/mapUtils"
import { HEART_LAYOUT_DATA } from "@/lib/heart-layouts"
import { generateMarkerImg } from "@/lib/map-utils"

interface MapPreviewModalProps {
  onClose: () => void
  onSave: (settings: { style: string; routeType: string; mapType: string; mapCenter?: [number, number]; mapZoom?: number }) => void
  markers: Array<Marker>
  title: string
  initialSettings?: { style: string; routeType: string; mapType: string; mapCenter?: [number, number]; mapZoom?: number }
}

// Map styles keyed to Mapbox style IDs
const MAPBOX_STYLES: Record<string, string> = {
  vintage: "mapbox://styles/mapbox/outdoors-v12",
  retro: "mapbox://styles/mapbox/light-v11",
  minimal: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-v9",
  terrain: "mapbox://styles/mapbox/satellite-streets-v12",
  dark: "mapbox://styles/mapbox/dark-v11",
};

// Define marker sizes
const sizeMap = {
  S: 20,
  M: 22,
  L: 24
};

export default function MapPreviewModal({
  onClose,
  onSave,
  markers,
  title,
  initialSettings = { style: "vintage", routeType: "none", mapType: "fit" },
}: MapPreviewModalProps) {
  const [activeTab, setActiveTab] = useState("style")
  const [mapStyle, setMapStyle] = useState(initialSettings.style)
  const [routeType, setRouteType] = useState(initialSettings.routeType)
  const [mapType, setMapType] = useState(initialSettings.mapType)
  const [imageWidth, setImageWidth] = useState(800)
  const [imageHeight, setImageHeight] = useState(600)
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialSettings.mapCenter || [0, 0])
  const [mapZoom, setMapZoom] = useState(initialSettings.mapZoom || 1)
  const [customStyles, setCustomStyles] = useState<MapStyle[]>([])
  const [isLoadingStyles, setIsLoadingStyles] = useState(false)
  const [isInitialFit, setIsInitialFit] = useState(!initialSettings.mapCenter)
  const tempMapState = useRef({ center: mapCenter, zoom: mapZoom })
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const lastCustomState = useRef<{ center: [number, number]; zoom: number } | null>(null)
  const [splitImageUrls, setSplitImageUrls] = useState<string[]>([])
  // Responsive scaling for split map
  const parentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    function handleResize() {
      if (parentRef.current) {
        const parentWidth = parentRef.current.offsetWidth
        const parentHeight = parentRef.current.offsetHeight
        // 2400 is the fixed size of .split-map-cont
        const scaleW = parentWidth / 2400
        const scaleH = parentHeight / 2400
        setScale(Math.min(scaleW, scaleH))
      }
    }
    handleResize()
    // Use ResizeObserver for parent container
    let observer: ResizeObserver | null = null
    if (parentRef.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(handleResize)
      observer.observe(parentRef.current)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (observer && parentRef.current) observer.disconnect()
    }
  }, [])

  // Update map instance reference when it changes
  useEffect(() => {
    if (mapRef.current) {
      setMapInstance(mapRef.current);
    }
  }, [mapRef.current]);

  // Log markers for debugging
  useEffect(() => {
    console.log("Map preview markers:", markers);
    console.log("Markers with coordinates:", markers.filter(m => m.markerCoordinates));
  }, [markers]);
  
  // Calculate the map center and zoom based on markers
  useEffect(() => {
    if (markers.length === 0 || !isInitialFit) return;
    
    // If we have markers with coordinates, use them to calculate map center and zoom
    const markersWithCoords = markers.filter(marker => marker.markerCoordinates);
    
    if (markersWithCoords.length === 0) return;
    
    // Calculate bounds
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    
    markersWithCoords.forEach(marker => {
      if (!marker.markerCoordinates) return;
      const [lng, lat] = marker.markerCoordinates;
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
    
    // Use fitBounds to set the zoom level
    const mapInstance = getMapInstance();
    if (mapInstance) {
      mapInstance.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat]
        ],
        {
          padding: 50, // Add some padding around the bounds
          maxZoom: 15, // Limit maximum zoom level
          duration: 0 // No animation for initial fit
        }
      );
      // Update the zoom level in our state
      setMapZoom(mapInstance.getZoom());
    }
    
    setIsInitialFit(false);
  }, [markers, isInitialFit]);

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
      id: "custom",
      name: "Custom",
      description: "Standard map with all markers shown in their exact positions",
      image: "/placeholder.svg?height=120&width=120&text=Custom",
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
    const hasCoordinates = markers.some(marker => marker.markerCoordinates);
    console.log("Has markers with coordinates:", hasCoordinates);
    
    let longitude, latitude;
    
    if (hasCoordinates) {
      // Find a marker with coordinates to use as center
      const centerMarker = markers.find(marker => marker.markerCoordinates);
      // Use calculated center and zoom if available, otherwise use first marker
      longitude = centerMarker ? centerMarker.markerCoordinates![0] : mapCenter[0];
      latitude = centerMarker ? centerMarker.markerCoordinates![1] : mapCenter[1];
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
    // Get the final map state from the map instance
    const mapInstance = getMapInstance();
    if (mapInstance) {
      const center = mapInstance.getCenter();
      const zoom = mapInstance.getZoom();
      onSave({ 
        style: mapStyle, 
        routeType, 
        mapType,
        mapCenter: [center.lng, center.lat],
        mapZoom: zoom
      })
    } else {
      onSave({ 
        style: mapStyle, 
        routeType, 
        mapType,
        mapCenter: tempMapState.current.center,
        mapZoom: tempMapState.current.zoom
      })
    }
  }

  // Store map state when switching types
  const handleMapTypeChange = (newType: string) => {
    // Store current state before switching
    const mapInstance = getMapInstance();
    if (mapInstance) {
      const center = mapInstance.getCenter();
      const zoom = mapInstance.getZoom();
      if (mapType === 'custom') {
        lastCustomState.current = {
          center: [center.lng, center.lat],
          zoom: zoom
        };
      }
    }
    setMapType(newType);
  };

  // Helper to generate a static Mapbox image URL centered on a single marker
  const getSingleMarkerUrl = (marker: Marker, mapStyle: string) => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const styleId = mapStyle.split('/').pop();
    const [lng, lat] = marker.markerCoordinates || marker.markerLocation;
    const coords = `${lng},${lat},12,0`;
    // Generate marker image as dataURL
    const dataUrl = generateMarkerImg(marker.markerEmoji, marker.markerLabel, sizeMap[marker.markerSize]) as string;
    // Use the API endpoint to convert dataURL to PNG
    const markerApiUrl = encodeURIComponent(`${window.location.origin}/api/marker?dataurl=${encodeURIComponent(dataUrl)}`);
    // Return Mapbox static map URL with custom marker overlay
    return `https://api.mapbox.com/styles/v1/pinenlime/${styleId}/static/url-${markerApiUrl}(${lng},${lat})/${coords}/500x500@2x?access_token=${token}&logo=false&attribution=false`;
  };

  // Pre-generate one image per marker when entering split mode
  useEffect(() => {
    if (mapType !== 'split') return
    const layout = HEART_LAYOUT_DATA.find(item => item.id === markers.length)
    if (!layout) return
    const urls = markers.map(marker => getSingleMarkerUrl(marker, mapStyle))
    setSplitImageUrls(urls)
  }, [mapType, markers, mapStyle])

  // Render map based on selected map type
  const renderMap = () => {
    switch (mapType) {
      case "fit":
        return (
          <div className="w-full h-full relative">
            <MapboxMap
              markers={markers}
              intrinsicHeight="8in"
              intrinsicWidth="8in"
              showFullScreen={false}
              showNavigation={false}
              fitToMarkers={true}
              style={MAPBOX_STYLES[mapStyle] || mapStyle}
              onMoveEnd={(coordinates: [number, number]) => {
                // Store the state in the ref instead of updating state
                const mapInstance = getMapInstance();
                if (mapInstance) {
                  tempMapState.current = {
                    center: coordinates,
                    zoom: mapInstance.getZoom()
                  };
                }
              }}
            />

            {/* Map title */}
            <div className="absolute left-1/2 bottom-8 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded shadow-md">
              <div className="text-center text-lg font-medium text-[#563635]">{title}</div>
            </div>

            {/* Routes between markers */}
            {routeType !== "none" && markers.length > 1 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {markers.slice(0, -1).map((marker, index) => {
                  const nextMarker = markers[index + 1];
                  
                  // Get position either from projected coordinates or from the position property
                  let x1, y1, x2, y2;
                  
                  if (marker.markerCoordinates) {
                    const pixelCoords = getMarkerPixelCoordinates(marker.markerCoordinates);
                    x1 = (pixelCoords[0] / imageWidth) * 100;
                    y1 = (pixelCoords[1] / imageHeight) * 100;
                  } else {
                    x1 = marker.markerLocation[0];
                    y1 = marker.markerLocation[1];
                  }
                  
                  if (nextMarker.markerCoordinates) {
                    const pixelCoords = getMarkerPixelCoordinates(nextMarker.markerCoordinates);
                    x2 = (pixelCoords[0] / imageWidth) * 100;
                    y2 = (pixelCoords[1] / imageHeight) * 100;
                  } else {
                    x2 = nextMarker.markerLocation[0];
                    y2 = nextMarker.markerLocation[1];
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

      case "split": {
        const layout = HEART_LAYOUT_DATA.find(item => item.id === markers.length)
        if (!layout || !layout.markers || splitImageUrls.length !== markers.length) {
          return (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-[#563635]">
                {!layout ? "Split heart layout not available for this number of markers" : "Loading split map..."}
              </div>
            </div>
          )
        }
        return (
          <div ref={parentRef} className="w-full h-full flex items-center justify-center overflow-hidden relative">
            <div
              className="split-map-cont"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              <div className="split-map-parts-cont">
                {layout.markers.map((m, idx) => (
                  <div
                    key={idx}
                    className="split-map-marker"
                    style={{
                      clipPath: `path('${m.clipPath}')`,
                      width: `${m.width}%`,
                      height: `${m.height}%`,
                      top: `${m.top}px`,
                      left: `${m.left}px`,
                    }}
                  >
                    <img
                      src={splitImageUrls[idx]}
                      style={{
                        top: `${m.img.top}%`,
                        left: `${m.img.left}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      alt=""
                    />
                  </div>
                ))}
                <img
                  src={layout.img}
                  className="split-map-img"
                  alt=""
                />
              </div>
              {title && (
                <div className="split-map-title">{title}</div>
              )}
            </div>
          </div>
        )
      }
      case "custom":
      default:
        return (
          <div className="w-full h-full relative">
            <MapboxMap
              markers={markers}
              intrinsicHeight="8in"
              intrinsicWidth="8in"
              showFullScreen={false}
              showNavigation={true}
              style={MAPBOX_STYLES[mapStyle] || mapStyle}
              initialCenter={lastCustomState.current?.center || tempMapState.current.center}
              initialZoom={lastCustomState.current?.zoom || tempMapState.current.zoom}
              onMoveEnd={(coordinates: [number, number]) => {
                // Store the state in the ref instead of updating state
                const mapInstance = getMapInstance();
                if (mapInstance) {
                  tempMapState.current = {
                    center: coordinates,
                    zoom: mapInstance.getZoom()
                  };
                }
              }}
            />

            {/* Map title */}
            <div className="absolute left-1/2 bottom-8 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded shadow-md">
              <div className="text-center text-lg font-medium text-[#563635]">{title}</div>
            </div>

            {/* Routes between markers */}
            {routeType !== "none" && markers.length > 1 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {markers.slice(0, -1).map((marker, index) => {
                  const nextMarker = markers[index + 1];
                  
                  // Get position either from projected coordinates or from the position property
                  let x1, y1, x2, y2;
                  
                  if (marker.markerCoordinates) {
                    const pixelCoords = getMarkerPixelCoordinates(marker.markerCoordinates);
                    x1 = (pixelCoords[0] / imageWidth) * 100;
                    y1 = (pixelCoords[1] / imageHeight) * 100;
                  } else {
                    x1 = marker.markerLocation[0];
                    y1 = marker.markerLocation[1];
                  }
                  
                  if (nextMarker.markerCoordinates) {
                    const pixelCoords = getMarkerPixelCoordinates(nextMarker.markerCoordinates);
                    x2 = (pixelCoords[0] / imageWidth) * 100;
                    y2 = (pixelCoords[1] / imageHeight) * 100;
                  } else {
                    x2 = nextMarker.markerLocation[0];
                    y2 = nextMarker.markerLocation[1];
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

  useEffect(() => {
    const getCustomStyles = async () => {
      setIsLoadingStyles(true)
      try {
        const styles = await fetchMapStyles()
        setCustomStyles(styles)
      } catch (error) {
        console.error("Error fetching custom map styles:", error)
      } finally {
        setIsLoadingStyles(false)
      }
    }
    getCustomStyles()
  }, [])

  // Combine custom and static styles into a uniform display list
  const staticDisplayStyles = mapStyles.map(style => ({
    styleId: style.id,
    title: style.name,
    image: style.image,
  }))
  const customDisplayStyles = customStyles.map(style => ({
    styleId: style.styleId,
    title: style.Title,
    image: style.image,
  }))
  const displayStyles = customDisplayStyles.length > 0 ? customDisplayStyles : staticDisplayStyles

  // Handle style change
  const handleStyleChange = (newStyle: string) => {
    // Store current map position before changing style
    const mapInstance = getMapInstance();
    if (mapInstance) {
      const center = mapInstance.getCenter();
      const zoom = mapInstance.getZoom();
      tempMapState.current = {
        center: [center.lng, center.lat],
        zoom: zoom
      };
    }
    setMapStyle(newStyle);
  };

  // Add effect to disable map interactions for 'fit' type
  useEffect(() => {
    if (mapType === 'fit') {
      const mapInstance = getMapInstance();
      if (mapInstance) {
        // Disable all interactions
        mapInstance.dragPan.disable();
        mapInstance.scrollZoom.disable();
        mapInstance.boxZoom.disable();
        mapInstance.dragRotate.disable();
        mapInstance.keyboard.disable();
        mapInstance.doubleClickZoom.disable();
        mapInstance.touchZoomRotate.disable();
        mapInstance.touchPitch.disable();

        // Handle single marker case
        const markersWithCoords = markers.filter(marker => marker.markerCoordinates);
        if (markersWithCoords.length === 1) {
          const [lng, lat] = markersWithCoords[0].markerCoordinates!;
          mapInstance.flyTo({
            center: [lng, lat],
            zoom: 12, // Reasonable zoom level for a single marker
            duration: 0 // No animation
          });
        }
      }
    }
  }, [mapType, markers]);

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
          <div className="flex-1 flex items-center justify-center bg-[#fcf8ed]">
            <div className="relative w-full h-full">{renderMap()}</div>
          </div>

          {/* Settings panel */}
          <div className="w-80 border-l flex flex-col">
            <div className="p-4 flex-1 overflow-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="style">Map Style</TabsTrigger>
                  <TabsTrigger value="layout">Layout</TabsTrigger>
                </TabsList>

                <TabsContent value="style" className="mt-4 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-[#563635]">Map Style</h3>
                    {isLoadingStyles ? (
                      <div className="flex items-center justify-center p-4 text-[#563635]">
                        Loading map styles...
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {displayStyles.map(style => (
                          <button
                            key={style.styleId}
                            type="button"
                            onClick={() => handleStyleChange(style.styleId)}
                            className={`p-1 rounded-md border hover:border-[#b7384e] transition-colors ${
                              mapStyle === style.styleId ? "border-[#b7384e] ring-1 ring-[#b7384e]" : "border-[#563635]/20"
                            }`}
                          >
                            <div className="aspect-square relative rounded overflow-hidden">
                              <img src={style.image} alt={style.title} className="object-cover w-full h-full" />
                            </div>
                            <p className="text-xs text-center mt-1">{style.title}</p>
                          </button>
                        ))}
                      </div>
                    )}
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
                          onClick={() => handleMapTypeChange(type.id)}
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
            </div>
            <div className="p-4 border-t">
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
