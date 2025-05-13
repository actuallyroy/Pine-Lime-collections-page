"use client"

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import "../styles/mapbox-overrides.css" // Import Mapbox overrides
import { setMapInstance } from "../utils/mapUtils" // Import the setMapInstance function
import { generateMarkerImg } from "@/lib/map-utils"

// Use a mapbox token from env or fallback to a public token
const mbToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoicGluZW5saW5lIiwiYSI6ImNrN3N6eTQ0bzByNmgzbXBsdmlwY25reDIifQ.QZROImVZfGk44ZIJLlYXQg'
mapboxgl.accessToken = mbToken

// Define marker sizes
const sizeMap = {
  S: 20,
  M: 22,
  L: 24
};

interface MapboxMapProps {
  initialCenter?: [number, number]
  initialZoom?: number
  markers?: Array<Marker>
  onMarkerClick?: (markerId: string) => void
  onClick?: (coordinates: [number, number]) => void
  onMoveEnd?: (coordinates: [number, number]) => void
  onMove?: (coordinates: [number, number]) => void
  style?: string // Accept a full style URL or style name
  intrinsicHeight?: string
  intrinsicWidth?: string
  showFullScreen?: boolean
  showNavigation?: boolean
  fitToMarkers?: boolean
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
  onMove,
  style = DEFAULT_MAP_STYLE, // Use the default style
  intrinsicHeight,
  intrinsicWidth,
  showFullScreen = true,
  showNavigation = true,
  fitToMarkers = false,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const isUserInteracting = useRef(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  
  // Scaling support for intrinsic/visible dimensions
  const [scale, setScale] = useState(1)
  const convertToPixels = useCallback((size: string): number => {
    const value = parseFloat(size.match(/^[0-9.]+/)?.[0] || "0")
    const unit = size.match(/[a-z%]+$/i)?.[0] || "px"
    switch (unit.toLowerCase()) {
      case "px":
        return value
      case "in":
        return value * 96
      case "cm":
        return value * 37.8
      case "mm":
        return value * 3.78
      case "pt":
        return value * 1.33
      case "rem":
      case "em":
        return value * 16
      default:
        return value
    }
  }, [])

  // Measure wrapper size and adjust scale based on intrinsic dimensions
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [visibleSize, setVisibleSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    if (!wrapperRef.current) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setVisibleSize({ width, height })
      }
    })
    observer.observe(wrapperRef.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!intrinsicWidth || !intrinsicHeight) {
      return
    }
    const intrinsicW = convertToPixels(intrinsicWidth)
    const intrinsicH = convertToPixels(intrinsicHeight)
    if (visibleSize.width && visibleSize.height) {
      const scaleW = visibleSize.width / intrinsicW
      const scaleH = visibleSize.height / intrinsicH
      setScale(Math.min(scaleW, scaleH))
    }
  }, [intrinsicHeight, intrinsicWidth, visibleSize, convertToPixels])
  
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
        projection: 'mercator',
        attributionControl: false,
        crossSourceCollisions: false,
        pitchWithRotate: false,
        touchPitch: false,
        preserveDrawingBuffer: true,
      })

      // Add default controls
      if (showNavigation) {
        mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
      }
      if (showFullScreen) {
        mapInstance.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      }

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
          
          // Add markers after map is loaded
          markers.forEach((marker) => {
            let markerElement: HTMLElement;
            const dataUrl = generateMarkerImg(
              marker.markerEmoji!,
              marker.markerLabel!,
              sizeMap[marker.markerSize]
            );
            const img = document.createElement("img");
            img.src = dataUrl || "";
            img.className = "marker";
            img.height = sizeMap[marker.markerSize];
            markerElement = img;

            // Create popup
            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <h3 class="font-bold">${marker.markerLabel || ""}</h3>
            `)

            // Add marker to map
            const mapboxMarker = new mapboxgl.Marker(markerElement)
              .setLngLat(marker.markerCoordinates)
              .setPopup(popup)
              .addTo(mapInstance)

            // Store marker reference
            markersRef.current.push(mapboxMarker)

            // Add click handler
            markerElement.addEventListener("click", (e) => {
              e.stopPropagation();
              if (onMarkerClick) {
                onMarkerClick(marker.markerId)
              }
            })
          })
        }
      })

      mapInstance.on("error", (e) => {
        // Log the underlying error for clarity
        console.error("Mapbox error:", e.error || e)
        if (isMounted) {
          setMapError("Failed to load map")
        }
      })

      // Setup moveend handler with debounce
      const moveEndHandler = () => {
        if (onMoveEnd && mapInstance) {
          const center = mapInstance.getCenter()
          onMoveEnd([center.lng, center.lat])
        }
      }

      const moveHandler = () => {
        if (onMove && mapInstance) {
          const center = mapInstance.getCenter()
          onMove([center.lng, center.lat])
        }
      }

      mapInstance.on("moveend", moveEndHandler)
      mapInstance.on("move", moveHandler)

      // Cleanup on unmount
      return () => {
        isMounted = false;
        if (mapInstance) {
          mapInstance.off("moveend", moveEndHandler)
          mapInstance.off("move", moveHandler)
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
  }, [styleUrl, initialCenter, initialZoom, onClick, onMoveEnd, markers, onMarkerClick])

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
          const dataUrl = generateMarkerImg(
            marker.markerEmoji!,
            marker.markerLabel!,
            sizeMap[marker.markerSize]
          );
          const img = document.createElement("img");
          img.src = dataUrl || "";
          img.className = "marker";
          img.height = sizeMap[marker.markerSize];
          markerElement = img;
        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <h3 class="font-bold">${marker.markerLabel || ""}</h3>
        `)

        // Add marker to map
        const mapboxMarker = new mapboxgl.Marker(markerElement)
          .setLngLat(marker.markerCoordinates)
          .setPopup(popup)
          .addTo(map.current!)

        // Store marker reference
        markersRef.current.push(mapboxMarker)

        // Add click handler
        markerElement.addEventListener("click", (e) => {
          e.stopPropagation();
          if (onMarkerClick) {
            onMarkerClick(marker.markerId)
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
      const centerMarker = markers.find(m => m.markerId === "center");
      
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

  // Fit bounds to markers if requested
  useEffect(() => {
    if (!map.current || !mapLoaded || !fitToMarkers) return;
    const coords = (markers || [])
      .map(m => m.markerCoordinates)
      .filter(Boolean) as [number, number][];
    if (coords.length < 2) return;
    let minLng = Math.min(...coords.map(c => c[0]));
    let maxLng = Math.max(...coords.map(c => c[0]));
    let minLat = Math.min(...coords.map(c => c[1]));
    let maxLat = Math.max(...coords.map(c => c[1]));
    map.current.fitBounds(
      [ [minLng, minLat], [maxLng, maxLat] ],
      { padding: 50, maxZoom: 15, duration: 0 }
    );
  }, [mapLoaded, fitToMarkers, markers]);

  // Compute container style: scale intrinsic dimensions or fill wrapper
  const containerStyle = intrinsicWidth && intrinsicHeight
    ? {
        width: intrinsicWidth,
        height: intrinsicHeight,
        transform: `scale(${scale})`,
        transformOrigin: "center",
      }
    : { width: "100%", height: "100%" }

  return (
    <div ref={wrapperRef} className="relative w-full h-full overflow-hidden">
      <div
        ref={mapContainer}
        style={containerStyle}
      />
      {!mapLoaded && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
        }}>
          <div style={{ color: "#6b7280" }}>{mapError || "Loading map..."}</div>
        </div>
      )}
    </div>
  )
} 

// Memoize the entire component to prevent unnecessary re-renders
const MapboxMap = React.memo(MapboxMapInner);
export default MapboxMap; 