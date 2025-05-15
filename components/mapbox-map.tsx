"use client"

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import "../styles/mapbox-overrides.css" // Import Mapbox overrides
import { setMapInstance } from "../utils/mapUtils" // Import the setMapInstance function
import { generateMarkerImg } from "@/lib/map-utils"
import { getRoute } from "@/lib/map-utils"
import * as turf from "@turf/turf"

// Use a mapbox token from env or fallback to a public token
const mbToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoicGluZW5saW5lIiwiYSI6ImNrN3N6eTQ0bzByNmgzbXBsdmlwY25reDIifQ.QZROImVZfGk44ZIJLlYXQg'
if (typeof window !== 'undefined') {
  mapboxgl.accessToken = mbToken
}

// Define marker sizes
const sizeMap = {
  S: 20,
  M: 22,
  L: 24
};


function getNegativeColor(color: string) {
  // HEX format
  if (color.charAt(0) == "#") {
    const hex = color.substring(1);
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    const invertedR = 255 - r;
    const invertedG = 255 - g;
    const invertedB = 255 - b;

    return `#${((1 << 24) + (invertedR << 16) + (invertedG << 8) + invertedB).toString(16).slice(1)}`;
  }

  // RGB format
  if (color.startsWith("rgb")) {
    const matches = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (!matches) {
      throw new Error("Invalid RGB color format");
    }
    const invertedR = 255 - parseInt(matches[1]);
    const invertedG = 255 - parseInt(matches[2]);
    const invertedB = 255 - parseInt(matches[3]);

    return `rgb(${invertedR}, ${invertedG}, ${invertedB})`;
  }

  // HSL format
  if (color.startsWith("hsl")) {
    const matches = color.match(/(\d+),\s*(\d+)%,\s*(\d+)%/);
    if (!matches) {
      throw new Error("Invalid HSL color format");
    }
    const invertedH = (parseInt(matches[1]) + 180) % 360;
    const invertedS = 100 - parseInt(matches[2]);
    const invertedL = 100 - parseInt(matches[3]);

    return `hsl(${invertedH}, ${invertedS}%, ${invertedL}%)`;
  }

  throw new Error("Unsupported color format");
}

function colorToHex(color: string) {
  // Create a temporary div to utilize browser's ability to convert colors
  const div = document.createElement("div");
  div.style.color = color;

  // Attach the div to the body to compute the computed style
  document.body.appendChild(div);

  // Get the computed style
  const computedColor = getComputedStyle(div).color;

  // Remove the div after getting the computed style
  document.body.removeChild(div);

  // Extract the RGB values
  const match = computedColor.match(/\d+/g);
  if (!match) {
    throw new Error("Invalid color format");
  }
  const [r, g, b] = match;

  // Convert RGB to Hex
  const hex = `${Number(r).toString(16).padStart(2, "0")}${Number(g).toString(16).padStart(2, "0")}${Number(b).toString(16).padStart(2, "0")}`;

  return hex.toUpperCase();
}
interface MapboxMapProps {
  initialCenter?: [number, number]
  initialZoom?: number
  markers?: Array<Marker>
  onMarkerClick?: (markerId: string) => void
  onClick?: (coordinates: [number, number]) => void
  onMoveEnd?: (coordinates: [number, number]) => void
  onMove?: (coordinates: [number, number]) => void
  routeType?: "air" | "road" | "none"
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
  routeType = "none",
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

  // // Function to display the route on the MAP
  function displayRoute(coordinates: [number, number][]) {
    // Check if the route source already exists
    if (map.current?.getSource("route-source")) {
      // Update the source data if the source exists
    (map.current.getSource("route-source") as mapboxgl.GeoJSONSource).setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: coordinates,
      },
    });
    } else {
      const landColor = map.current?.getPaintProperty("land", "background-color") || 
                      map.current?.getPaintProperty("background", "background-color");
      // Add a new source and layer if they don't exist
      map.current?.addSource("route-source", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: coordinates,
          },
        },
      });

      map.current?.addLayer({
        id: "curved-line",
        type: "line",
        source: "route-source",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": getNegativeColor(landColor as string),
          "line-width": 4,
          // "line-pattern": ["image", "blue-line"]
          "line-dasharray": [1, 1.5],
        },
      });
    }
  }

  function renderRoute() {
    if (markers.length < 2) {
      if (map.current?.getSource("route-source")) {
        map.current?.removeLayer("curved-line");
        map.current?.removeSource("route-source");
      }
      return;
    }
    switch (routeType) {
      case "air":
        if (markers.length >= 2) {
          let coordinates = markers.map((marker) => marker.markerLocation);
          var line = turf.lineString(coordinates);
          var curved = turf.bezierSpline(line, { sharpness: 1 });
          setTimeout(() => {
            displayRoute(curved.geometry.coordinates as [number, number][]);
          }, 500);
        }
        break;
      case "road":
        if (markers.length >= 2) {
          getRoute(
            markers.map((marker) => marker.markerLocation),
            map.current?.getZoom() || 15,
            (err: any, coordinates: any) => {
              if (err) {
                console.log(err);
                return;
              }
              setTimeout(() => {
                displayRoute(coordinates);
              }, 500);
            }
          );
        }
        break;
      case "none":
        if (map.current?.getSource("route-source")) {
          map.current?.removeLayer("curved-line");
          map.current?.removeSource("route-source");
        }
        break;
      default:
        break;
    }
  }

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
            let markerElement: HTMLElement | null = null;
            const dataUrl = generateMarkerImg(
              marker.markerEmoji!,
              marker.markerLabel!,
              sizeMap[marker.markerSize]
            );
            const img = typeof document !== 'undefined' ? document.createElement("img") : null;
            if (img) {
              img.src = dataUrl || "";
              img.className = "marker";
              img.height = sizeMap[marker.markerSize];
              markerElement = img;
            }

            if (markerElement) {
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
            }
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

      // Initial route rendering
      mapInstance.on("style.load", () => {
        renderRoute();
      });

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
          // Defer removal to avoid blocking the UI thread
          setTimeout(() => {
            mapInstance.remove();
          }, 0);
        }
        map.current = null;
        setMapInstance(null); // Reset global reference on unmount
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
        let markerElement: HTMLElement | null = null;
          const dataUrl = generateMarkerImg(
            marker.markerEmoji!,
            marker.markerLabel!,
            sizeMap[marker.markerSize]
          );
          const img = typeof document !== 'undefined' ? document.createElement("img") : null;
          if (img) {
            img.src = dataUrl || "";
            img.className = "marker";
            img.height = sizeMap[marker.markerSize];
            markerElement = img;
          }
        if (markerElement) {
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
        }
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
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${scale})`,
      }
    : { width: "100%", height: "100%" }

  return (
    <div ref={wrapperRef} className="relative w-full h-full overflow-hidden">
      <div
        ref={mapContainer}
        style={containerStyle as React.CSSProperties}
      />
      {!mapLoaded && (
        <div style={{
          position: "absolute" as const,
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