"use client"

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import "../styles/mapbox-overrides.css" // Import Mapbox overrides
import { setMapInstance } from "../utils/mapUtils" // Import the setMapInstance function

// Replace with your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

interface MapboxMapProps {
  initialCenter?: [number, number]
  initialZoom?: number
  markers?: Array<{
    id: string
    coordinates: [number, number]
    title?: string
    description?: string
    customMarker?: {
      element: HTMLElement
      options: {
        element: HTMLElement
      }
    }
    isDragging?: boolean // Add this flag to indicate if marker should stay centered
  }>
  onMarkerClick?: (markerId: string) => void
  onClick?: (coordinates: [number, number]) => void
  onMoveEnd?: (coordinates: [number, number]) => void
  style?: string // Accept a full style URL or style name
}

// Directly define the style URLs in this component to avoid cross-file reference issues
const DEFAULT_MAP_STYLE = "mapbox://styles/mapbox/streets-v12";

function MapboxMapInner({
  initialCenter = [55.14, 25.069], // Default to New York
  initialZoom = 15,
  markers = [],
  onMarkerClick,
  onClick,
  onMoveEnd,
  style = DEFAULT_MAP_STYLE, // Use the default style
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const isUserInteracting = useRef(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  
  // Cache the style URL computation to prevent unnecessary recalculations
  const styleUrl = useMemo(() => {
    if (!style || !style.includes('mapbox://')) {
      if (style === 'labelled') {
        return DEFAULT_MAP_STYLE;
      } else if (style === 'unlabelled') {
        return DEFAULT_MAP_STYLE;
      } else if (style && !style.startsWith('mapbox://')) {
        return `mapbox://styles/mapbox/${style}`;
      } else {
        return DEFAULT_MAP_STYLE;
      }
    }
    return style;
  }, [style]);
  
  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainer.current) return
    
    let isMounted = true;
    
    // Clean up previous map instance if it exists
    if (map.current) {
      map.current.remove()
      map.current = null
      setMapInstance(null) // Reset global reference
    }

    try {
      const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: initialCenter,
      zoom: initialZoom,
      preserveDrawingBuffer: true,
    })

      // Add default controls
      mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
      mapInstance.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      map.current = mapInstance;
      setMapInstance(mapInstance); // Set global reference

      // Track user interaction to avoid unnecessary React state updates
      mapInstance.on("dragstart", () => {
        isUserInteracting.current = true;
      });
      
      mapInstance.on("dragend", () => {
        isUserInteracting.current = false;
      });
      
      mapInstance.on("zoomstart", () => {
        isUserInteracting.current = true;
      });
      
      mapInstance.on("zoomend", () => {
        isUserInteracting.current = false;
      });

      mapInstance.on("load", () => {
        if (isMounted) {
      setMapLoaded(true)
          setMapError(null)
        }
      })

      mapInstance.on("error", (e) => {
        console.error("Mapbox error:", e)
        if (isMounted) {
          setMapError("Failed to load map")
        }
      })

      // Setup click handler with debounce to prevent multiple calls
      const clickHandler = () => {
        if (onClick && mapInstance && !isUserInteracting.current) {
          const center = mapInstance.getCenter()
          onClick([center.lng, center.lat])
        }
      }
      mapInstance.on("click", clickHandler)

      // Setup moveend handler with debounce
      const moveEndHandler = () => {
        if (onMoveEnd && mapInstance && !isUserInteracting.current) {
          const center = mapInstance.getCenter()
          onMoveEnd([center.lng, center.lat])
        }
      }
      mapInstance.on("moveend", moveEndHandler)

    // Cleanup on unmount
    return () => {
        isMounted = false;
        if (mapInstance) {
          mapInstance.off("click", clickHandler)
          mapInstance.off("moveend", moveEndHandler)
          mapInstance.off("dragstart", () => {})
          mapInstance.off("dragend", () => {})
          mapInstance.off("zoomstart", () => {})
          mapInstance.off("zoomend", () => {})
          mapInstance.remove()
        }
        map.current = null
        setMapInstance(null) // Reset global reference on unmount
      }
    } catch (error) {
      console.error("Error initializing map:", error)
      if (isMounted) {
        setMapError("Failed to initialize map")
      }
      return () => { isMounted = false; }
    }
  }, [styleUrl, initialCenter, initialZoom, onClick, onMoveEnd])

  // Update the map when props change without full re-initialization
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    try {
      const currentCenter = map.current.getCenter();
      const currentZoom = map.current.getZoom();
      
      // Only update center if it's different
      if (currentCenter.lng !== initialCenter[0] || currentCenter.lat !== initialCenter[1]) {
        // Use flyTo for smoother transitions
        map.current.flyTo({
          center: initialCenter,
          zoom: initialZoom,
          duration: 500
        });
      } 
      // Only update zoom if it's different and no center change
      else if (currentZoom !== initialZoom) {
        map.current.easeTo({
          zoom: initialZoom,
          duration: 300
        });
      }
    } catch (error) {
      console.error("Error updating map:", error)
    }
  }, [initialCenter, initialZoom, mapLoaded])

  // Update markers when they change
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    try {
      // Remove existing markers
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []

      // Add new markers
      markers.forEach((marker) => {
        let markerElement: HTMLElement;
        
        if (marker.customMarker) {
          // Use custom marker element
          markerElement = marker.customMarker.options.element;
        } else {
          // Create default marker element
          markerElement = document.createElement("div")
          markerElement.className = "marker"
          markerElement.style.width = "30px"
          markerElement.style.height = "30px"
          markerElement.style.backgroundImage = "url('/map-marker.svg')"
          markerElement.style.backgroundSize = "cover"
          markerElement.style.cursor = "pointer"
        }

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <h3 class="font-bold">${marker.title || ""}</h3>
          <p>${marker.description || ""}</p>
        `)

        // Add marker to map
        const mapboxMarker = new mapboxgl.Marker(markerElement)
          .setLngLat(marker.coordinates)
          .setPopup(popup)
          .addTo(map.current!)

        // Store marker reference
        markersRef.current.push(mapboxMarker)

        // Add click handler
        markerElement.addEventListener("click", (e) => {
          e.stopPropagation();
          if (onMarkerClick) {
            onMarkerClick(marker.id)
          }
        })
      })
    } catch (error) {
      console.error("Error updating markers:", error)
    }
  }, [markers, mapLoaded, onMarkerClick])

  // Add effect to handle map movement and keep marker centered
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const handleMapMove = () => {
      const center = map.current!.getCenter();
      const centerMarker = markers.find(m => m.isDragging);
      
      if (centerMarker) {
        // Update marker position to match the new center
        const marker = markersRef.current.find(m => m.getElement().classList.contains('marker'));
        if (marker) {
          marker.setLngLat([center.lng, center.lat]);
        }
      }
    };

    map.current.on('move', handleMapMove);

    return () => {
      if (map.current) {
        map.current.off('move', handleMapMove);
      }
    };
  }, [mapLoaded, markers]);

  // Add a useEffect to resize the map when it becomes visible
  useEffect(() => {
    if (map.current && mapLoaded) {
      try {
      // Force resize to ensure proper rendering
        const resizeTimer = setTimeout(() => {
        map.current?.resize()
      }, 100)
        
        return () => clearTimeout(resizeTimer);
      } catch (error) {
        console.error("Error resizing map:", error)
      }
    }
  }, [mapLoaded])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 h-full w-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-gray-500">{mapError || "Loading map..."}</div>
        </div>
      )}
    </div>
  )
} 

// Memoize the entire component to prevent unnecessary re-renders
const MapboxMap = React.memo(MapboxMapInner);
export default MapboxMap; 