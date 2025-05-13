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
import { Switch } from "@/components/ui/switch"

interface MapPreviewModalProps {
  onClose: () => void
  onSave: (settings: Partial<MapData>) => void
  markers: Array<Marker>
  title: string
  initialSettings?: Partial<MapData>
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
  initialSettings = { mapStyle: "vintage", routeType: "none", mapType: "fit" },
}: MapPreviewModalProps) {
  const [activeTab, setActiveTab] = useState("style")
  const [mapStyle, setMapStyle] = useState(initialSettings.mapStyle || "default")
  const [routeType, setRouteType] = useState(initialSettings.routeType || "none")
  const [mapType, setMapType] = useState(initialSettings.mapType || "custom")
  const [showLabels, setShowLabels] = useState(true)
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
  const parentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const lastMapState = useRef<{ center: [number, number]; zoom: number } | null>(null)
  const [hasFitted, setHasFitted] = useState(false)

  // Store map state before tab switch
  const handleTabChange = (newTab: string) => {
    const mapInstance = getMapInstance()
    if (mapInstance) {
      const center = mapInstance.getCenter()
      lastMapState.current = {
        center: [center.lng, center.lat],
        zoom: mapInstance.getZoom()
      }
    }
    setActiveTab(newTab)
  }

  // Restore map state when switching back to map view
  useEffect(() => {
    if (activeTab === "style" && lastMapState.current) {
      const mapInstance = getMapInstance()
      if (mapInstance) {
        mapInstance.flyTo({
          center: lastMapState.current.center,
          zoom: lastMapState.current.zoom,
          duration: 0
        })
      }
    }
  }, [activeTab])

  // Fetch custom styles and set initial style
  useEffect(() => {
    const getCustomStyles = async () => {
      setIsLoadingStyles(true)
      try {
        const styles = await fetchMapStyles()
        setCustomStyles(styles)
        
        // If we have custom styles, use the first one as initial style
        if (styles.length > 0) {
          const initialStyle = showLabels ? styles[0].styleIdLabelled : styles[0].styleId
          setMapStyle(initialStyle)
          
          // Update map instance if it exists
          const mapInstance = getMapInstance()
          if (mapInstance) {
            mapInstance.setStyle(initialStyle)
          }
        }
      } catch (error) {
        console.error("Error fetching custom map styles:", error)
      } finally {
        setIsLoadingStyles(false)
      }
    }
    getCustomStyles()
  }, [showLabels]) // Re-run when showLabels changes to get correct labelled/unlabelled version

  // Map styles with preview images
  const mapStyles = [
    { id: "vintage", name: "Vintage", image: "/placeholder.svg?height=80&width=80&text=Vintage" },
    { id: "retro", name: "Retro", image: "/placeholder.svg?height=80&width=80&text=Retro" },
    { id: "minimal", name: "Minimal", image: "/placeholder.svg?height=80&width=80&text=Minimal" },
    { id: "satellite", name: "Satellite", image: "/placeholder.svg?height=80&width=80&text=Satellite" },
    { id: "terrain", name: "Terrain", image: "/placeholder.svg?height=80&width=80&text=Terrain" },
    { id: "dark", name: "Dark", image: "/placeholder.svg?height=80&width=80&text=Dark" },
  ]

  // Combine custom and static styles into a uniform display list
  const staticDisplayStyles = mapStyles.map(style => ({
    styleId: style.id,
    styleIdLabelled: style.id,
    title: style.name,
    image: style.image,
    Title: style.name,
    ID: style.id,
    border: "none"
  }))
  const customDisplayStyles = customStyles.map(style => ({
    styleId: style.styleId,
    styleIdLabelled: style.styleIdLabelled,
    title: style.Title,
    image: style.image,
    Title: style.Title,
    ID: style.ID,
    border: style.border
  }))
  const displayStyles = customDisplayStyles.length > 0 ? customDisplayStyles : staticDisplayStyles

  // Initialize map style with labels
  useEffect(() => {
    const mapInstance = getMapInstance();
    if (mapInstance && showLabels) {
      // Find the current style
      const currentStyle = displayStyles.find(style => 
        style.styleId === mapStyle || style.styleIdLabelled === mapStyle
      );
      
      if (currentStyle) {
        // Set to the labelled version
        const labelledStyle = currentStyle.styleIdLabelled;
        mapInstance.setStyle(labelledStyle);
        setMapStyle(labelledStyle);
      }
    }
  }, [displayStyles, mapStyle, showLabels]); // Added mapStyle and showLabels as dependencies

  // Add effect to update map style when labels toggle changes
  useEffect(() => {
    const mapInstance = getMapInstance();
    if (mapInstance) {
      // Find the current style
      const currentStyle = displayStyles.find(style => 
        style.styleId === mapStyle || style.styleIdLabelled === mapStyle
      );
      
      if (currentStyle) {
        // Update to the appropriate style URL based on label toggle
        const newStyleUrl = showLabels ? currentStyle.styleIdLabelled : currentStyle.styleId;
        mapInstance.setStyle(newStyleUrl);
        setMapStyle(newStyleUrl);
      }
    }
  }, [showLabels, displayStyles, mapStyle]); // Added mapStyle as dependency

  useEffect(() => {
    function handleResize() {
      if (parentRef.current) {
        const parentWidth = parentRef.current.offsetWidth
        const parentHeight = parentRef.current.offsetHeight
        // 2400 is the fixed size of .split-map-cont
        const scaleW = parentWidth / 2400
        const scaleH = parentHeight / 2400
        const newScale = Math.min(scaleW, scaleH)
        setScale(newScale)

        // Calculate centered position
        const scaledWidth = 2400 * newScale
        const scaledHeight = 2400 * newScale
        const left = (parentWidth - scaledWidth) / 2
        const top = (parentHeight - scaledHeight) / 2

        // Apply the transform and position
        const splitMapCont = parentRef.current.querySelector('.split-map-cont') as HTMLDivElement
        if (splitMapCont) {
          splitMapCont.style.transform = `scale(${newScale})`
          splitMapCont.style.transformOrigin = 'top left'
          splitMapCont.style.position = 'absolute'
          splitMapCont.style.left = `${left}px`
          splitMapCont.style.top = `${top}px`
        }
        return true // Return true if resize was successful
      }
      return false // Return false if parentRef is not available
    }

    // Use interval to keep checking until parentRef is available
    const intervalId = setInterval(() => {
      const success = handleResize()
      if (success) {
        clearInterval(intervalId)
      }
    }, 100) // Check every 100ms

    // Use ResizeObserver for parent container
    let observer: ResizeObserver | null = null
    if (parentRef.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(handleResize)
      observer.observe(parentRef.current)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('resize', handleResize)
      if (observer && parentRef.current) observer.disconnect()
    }
  }, []) // Empty dependency array since we want this to run only once on mount

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
        mapStyle, 
        routeType, 
        mapType,
        mapCenter: [center.lng, center.lat],
        mapZoom: zoom
      })
    } else {
      onSave({ 
        mapStyle, 
        routeType, 
        mapType,
        mapCenter: tempMapState.current.center,
        mapZoom: tempMapState.current.zoom
      })
    }
  }

  // Store map state when switching types
  const handleMapTypeChange = (newType: "custom" | "fit" | "split") => {
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
    const markerApiUrl = encodeURIComponent(`https://collections.pinenlime.com/api/marker?dataurl=${encodeURIComponent(dataUrl)}`);
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

  // Get the appropriate style URL based on whether labels are enabled
  const getStyleUrl = (style: MapStyle) => {
    return showLabels ? style.styleIdLabelled : style.styleId;
  };

  // Get the current map style URL
  const getCurrentMapStyle = () => {
    const currentStyle = displayStyles.find(style => 
      getStyleUrl(style) === mapStyle
    );
    if (currentStyle) {
      return getStyleUrl(currentStyle);
    }
    return MAPBOX_STYLES[mapStyle] || mapStyle;
  };

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
    if (mapType === 'fit' && !hasFitted) {
      const mapInstance = getMapInstance();
      if (mapInstance) {
        // Store current state before disabling interactions
        const currentCenter = mapInstance.getCenter();
        const currentZoom = mapInstance.getZoom();
        tempMapState.current = {
          center: [currentCenter.lng, currentCenter.lat],
          zoom: currentZoom
        };

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
        } else if (markersWithCoords.length > 1) {
          // Calculate bounds for multiple markers
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
          
          mapInstance.fitBounds(
            [
              [minLng, minLat],
              [maxLng, maxLat]
            ],
            {
              padding: 50,
              maxZoom: 15,
              duration: 0
            }
          );
        }
        setHasFitted(true);
      }
    }
  }, [mapType, markers, hasFitted]);

  // Reset hasFitted when map type changes
  useEffect(() => {
    setHasFitted(false);
  }, [mapType]);

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
              fitToMarkers={false} // Disable automatic fitting since we handle it manually
              routeType={routeType}
              style={getCurrentMapStyle()}
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
                <div className="split-map-title absolute left-1/2 bottom-8 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded shadow-md" style={{scale: 1/scale}}>{title}</div>
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
              style={getCurrentMapStyle()}
              routeType={routeType}
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col md:flex-row">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-[#563635]">Preview Your Journey Map</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Map preview */}
          <div className="flex-1 flex items-center justify-center bg-[#fcf8ed] min-h-[300px] md:min-h-0">
            <div className="relative w-full h-full">{renderMap()}</div>
          </div>

          {/* Settings panel */}
          <div className="w-full md:w-80 border-t md:border-l flex flex-col h-[360px]">
            <div className="p-4 flex-1 overflow-auto">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="w-full">
                  <TabsTrigger value="style" className="flex-1">Map Style</TabsTrigger>
                  <TabsTrigger value="layout" className="flex-1">Layout</TabsTrigger>
                </TabsList>

                <TabsContent value="style" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-[#563635]">Map Style</h3>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="show-labels" className="text-sm">Labels</Label>
                        <Switch
                          id="show-labels"
                          checked={showLabels}
                          onCheckedChange={setShowLabels}
                        />
                      </div>
                    </div>
                    {isLoadingStyles ? (
                      <div className="flex items-center justify-center p-2 text-[#563635]">
                        Loading map styles...
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-3 gap-1.5 sm:max-h-[300px] overflow-y-auto">
                        {displayStyles.map(style => (
                          <button
                            key={style.styleId}
                            type="button"
                            onClick={() => handleStyleChange(getStyleUrl(style))}
                            className={`p-1 rounded-md border hover:border-[#b7384e] transition-colors ${
                              mapStyle === getStyleUrl(style) ? "border-[#b7384e] ring-1 ring-[#b7384e]" : "border-[#563635]/20"
                            }`}
                          >
                            <div className="aspect-square relative rounded overflow-hidden">
                              <img src={style.image} alt={style.title} className="object-cover w-full h-full" />
                            </div>
                            <p className="text-xs text-center mt-0.5 truncate">{style.title}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm font-medium text-[#563635]">Route Type</h3>
                    <RadioGroup value={routeType} onValueChange={(value) => setRouteType(value as "air" | "road" | "none")} className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="route-none" />
                        <Label htmlFor="route-none" className="text-sm">No Routes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="road" id="route-road" />
                        <Label htmlFor="route-road" className="text-sm">Road Routes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="air" id="route-air" />
                        <Label htmlFor="route-air" className="text-sm">Air Routes</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </TabsContent>

                <TabsContent value="layout" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-[#563635]">Map Layout</h3>
                    <div className="space-y-2">
                      {mapTypes.map((type) => (
                        <div
                          key={type.id}
                          className={`p-2 border rounded-md cursor-pointer ${
                            mapType === type.id
                              ? "border-[#b7384e] bg-[#b7384e]/5"
                              : "border-[#563635]/20 hover:border-[#563635]/40"
                          }`}
                          onClick={() => handleMapTypeChange(type.id as "custom" | "fit" | "split")}
                        >
                          <div className="flex items-start gap-2">
                            <div className="w-12 h-12 shrink-0 rounded overflow-hidden border border-[#563635]/10">
                              <img
                                src={type.image || "/placeholder.svg"}
                                alt={type.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <h4 className="font-medium text-sm text-[#563635] truncate">{type.name}</h4>
                                {type.id === "split" && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-3 w-3 text-[#563635]/60 flex-shrink-0" />
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
                              <p className="text-xs text-[#563635]/70 mt-0.5 line-clamp-2">{type.description}</p>
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
