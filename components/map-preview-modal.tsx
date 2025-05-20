"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";
import { fetchMapStyles, MapStyle } from "@/lib/map-styles";
import MapboxMap from "./mapbox-map";
import { setMapInstance, getMapInstance } from "@/utils/mapUtils";
import { HEART_LAYOUT_DATA } from "@/lib/heart-layouts";
import { generateMarkerImg, getRoute } from "@/lib/map-utils";
import { Switch } from "@/components/ui/switch";
import { uploadToS3 } from "@/lib/utils";
import { toBlob } from 'html-to-image';
import mapboxgl from "mapbox-gl";
import * as turf from "@turf/turf";

interface MapPreviewModalProps {
  onClose: () => void;
  onSave: (settings: Partial<MapData>) => void;
  markers: Array<Marker>;
  title: string;
  frameSize: number | string;
  initialSettings?: Partial<MapData>;
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
  L: 24,
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
    if (!matches) return color;
    const invertedR = 255 - parseInt(matches[1]);
    const invertedG = 255 - parseInt(matches[2]);
    const invertedB = 255 - parseInt(matches[3]);

    return `rgb(${invertedR}, ${invertedG}, ${invertedB})`;
  }

  // HSL format
  if (color.startsWith("hsl")) {
    const matches = color.match(/(\d+),\s*(\d+)%,\s*(\d+)%/);
    if (!matches) return color;
    const invertedH = (parseInt(matches[1]) + 180) % 360;
    const invertedS = 100 - parseInt(matches[2]);
    const invertedL = 100 - parseInt(matches[3]);

    return `hsl(${invertedH}, ${invertedS}%, ${invertedL}%)`;
  }

  throw new Error("Unsupported color format");
}

// Define types for PersistentMap props
interface PersistentMapProps {
  markers: Array<Marker>;
  frameSize: number | string;
  mapStyle: string;
  routeType: string;
  mapType: string;
  title: string;
  mapRef: React.RefObject<mapboxgl.Map | null>;
  initialCenter?: [number, number];
  initialZoom?: number;
}

// New PersistentMap component
function PersistentMap({ markers, frameSize, mapStyle, routeType, mapType, title, mapRef, initialCenter, initialZoom }: PersistentMapProps) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const navControlRef = useRef<mapboxgl.NavigationControl | null>(null);
  const mapState = useRef<{ center: [number, number]; zoom: number }>({ center: [0, 0], zoom: 1 });
  // Store custom view state: center, zoom, pitch, bearing
  const customStateRef = useRef<{ center: [number, number]; zoom: number; pitch: number; bearing: number }>({
    center: mapState.current.center,
    zoom: mapState.current.zoom,
    pitch: 0,
    bearing: 0,
  });

  // Auto-scaling based on frameSize
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(1);
  const cssSize = typeof frameSize === 'number' ? `${frameSize}in` : frameSize;
  // Calculate pixel size for the map container
  const pxSize = (() => {
    if (typeof frameSize === 'number') return frameSize * 96;
    if (typeof frameSize === 'string' && frameSize.endsWith('in')) return parseFloat(frameSize) * 96;
    if (typeof frameSize === 'string' && frameSize.endsWith('px')) return parseFloat(frameSize);
    return 384; // fallback to 4in
  })();
  const [offset, setOffset] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (!parentRef.current) return;
    const intrinsicPx = pxSize;
    const handleResize = () => {
      if (!parentRef.current) return;
      const { clientWidth, clientHeight } = parentRef.current;
      const scaleW = clientWidth / intrinsicPx;
      const scaleH = clientHeight / intrinsicPx;
      const newScale = Math.min(scaleW, scaleH);
      setScale(newScale);
      // Center the map
      const scaledWidth = intrinsicPx * newScale;
      const scaledHeight = intrinsicPx * newScale;
      setOffset({
        left: (clientWidth - scaledWidth) / 2,
        top: (clientHeight - scaledHeight) / 2,
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [frameSize]);

  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      // Initialize map with saved center/zoom if provided
      const center = initialCenter || mapState.current.center;
      const zoom = initialZoom !== undefined ? initialZoom : mapState.current.zoom;
      // update internal state refs
      mapState.current.center = center;
      mapState.current.zoom = zoom;
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: center,
        zoom: zoom,
      });
    } else if (mapRef.current) {
      // Update map style
      mapRef.current.setStyle(mapStyle);
    }
  }, [mapStyle, initialCenter, initialZoom]);

  // Add, update and fit markers whenever style or markers change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handleAddMarkers = () => {
      // Remove existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      // Clean up any existing marker lines
      for (let i = 0; i < markers.length; i++) {
        const layerId = `marker-line-layer-${i}`;
        const sourceId = `marker-line-${i}`;
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      }

      // Handle 'fit' mode with overlap fix
      if (mapType === "fit" && markers.length > 0) {
        // Fit bounds to original coordinates
        const bounds = new mapboxgl.LngLatBounds();
        markers.forEach((marker) => bounds.extend(marker.markerCoordinates));
        map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 0 });

        // Compute pixel positions for markers
        const offsetThreshold = 40;
        const pixelPositions = markers.map((marker, index) => ({
          marker,
          index,
          pixelPos: map.project(marker.markerCoordinates),
        }));

        // Group overlapping markers
        const groups: any[] = [];
        pixelPositions.forEach((item: { marker: any; index: number; pixelPos: any }) => {
          let added = false;
          for (const group of groups) {
            const rep = group[0].pixelPos;
            const dx = item.pixelPos.x - rep.x;
            const dy = item.pixelPos.y - rep.y;
            if (Math.sqrt(dx * dx + dy * dy) < offsetThreshold) {
              group.push(item);
              added = true;
              break;
            }
          }
          if (!added) {
            groups.push([item]);
          }
        });

        // Calculate new geographic coordinates with offsets
        const newCoords: Array<[number, number]> = [];
        groups.forEach((group: Array<{ marker: any; index: number; pixelPos: any }>) => {
          const count = group.length;
          group.forEach((item: { marker: any; index: number; pixelPos: any }, i: number) => {
            let newPixel = item.pixelPos;
            if (count > 1) {
              const angle = (2 * Math.PI * i) / count;
              newPixel = {
                x: item.pixelPos.x + offsetThreshold * Math.cos(angle),
                y: item.pixelPos.y + offsetThreshold * Math.sin(angle),
              };
            }
            const { lng, lat } = map.unproject(newPixel);
            newCoords[item.index] = [lng, lat];
          });
        });

        // Add markers at adjusted positions and draw lines to original positions
        newCoords.forEach((coord, i) => {
          const markerData = markers[i];
          const dataUrl = generateMarkerImg(markerData.markerEmoji, markerData.markerLabel, sizeMap[markerData.markerSize]);
          const img = document.createElement("img");
          img.src = dataUrl || "";
          img.className = "marker";
          img.height = sizeMap[markerData.markerSize];
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3 class=\"font-bold\">${markerData.markerLabel}</h3>`);
          const m = new mapboxgl.Marker(img).setLngLat(coord).setPopup(popup).addTo(map);
          markersRef.current.push(m);
          img.addEventListener("click", (e) => e.stopPropagation());

          // If marker was moved (coordinates are different), draw a line to original position
          if (coord[0] !== markerData.markerCoordinates[0] || coord[1] !== markerData.markerCoordinates[1]) {
            const sourceId = `marker-line-${i}`;
            const layerId = `marker-line-layer-${i}`;

            // Add a source for the line
            map.addSource(sourceId, {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: [markerData.markerCoordinates, coord]
                }
              }
            });

            // Add a layer for the line
            map.addLayer({
              id: layerId,
              type: 'line',
              source: sourceId,
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#b7384e',
                'line-width': 2,
                'line-dasharray': [2, 2]
              }
            });
          }
        });

        return;
      }

      // Default marker placement for non-fit modes
      markers.forEach((marker) => {
        let markerElement: HTMLElement | null = null;
        const dataUrl = generateMarkerImg(marker.markerEmoji, marker.markerLabel, sizeMap[marker.markerSize]);
        const img = document.createElement("img");
        img.src = dataUrl || "";
        img.className = "marker";
        img.height = sizeMap[marker.markerSize];
        markerElement = img;
        if (markerElement) {
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3 class=\"font-bold\">${marker.markerLabel}</h3>`);
          const m = new mapboxgl.Marker(markerElement).setLngLat(marker.markerCoordinates).setPopup(popup).addTo(map);
          markersRef.current.push(m);
          markerElement.addEventListener("click", (e) => e.stopPropagation());
        }
      });
    };
    if (map.isStyleLoaded()) {
      handleAddMarkers();
    } else {
      map.on("load", handleAddMarkers);
    }
    map.on("style.load", handleAddMarkers);
    return () => {
      map.off("load", handleAddMarkers);
      map.off("style.load", handleAddMarkers);
    };
  }, [markers, mapStyle, mapType]);

  // Render route based on routeType and markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const displayRoute = (coordinates: [number, number][]) => {
      if (map.getSource("route-source")) {
        (map.getSource("route-source") as mapboxgl.GeoJSONSource).setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates },
        });
      } else {
        var landColor = "#000000";
        try {
          // Only attempt to read paint properties if the layer exists
          if (map.getLayer("land")) {
            const landPaint = map.getPaintProperty("land", "background-color");
            if (Array.isArray(landPaint)) {
              landColor = landPaint[landPaint.length - 1];
            } else if (typeof landPaint === "string") {
              landColor = landPaint;
            }
          } else if (map.getLayer("background")) {
            const bgPaint = map.getPaintProperty("background", "background-color");
            if (Array.isArray(bgPaint)) {
              landColor = bgPaint[bgPaint.length - 1];
            } else if (typeof bgPaint === "string") {
              landColor = bgPaint;
            }
          }
        } catch (error) {
          console.error("Error getting land color:", error);
        }
        map.addSource("route-source", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates },
          },
        });
        map.addLayer({
          id: "curved-line",
          type: "line",
          source: "route-source",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": getNegativeColor(landColor),
            "line-width": 4,
            // "line-pattern": ["image", "blue-line"]
            "line-dasharray": [1, 1.5],
          },
        });
      }
    };

    const renderRoute = () => {
      // Remove any existing route layers and then the source
      if (map.getLayer("route-layer")) {
        map.removeLayer("route-layer");
      }
      if (map.getLayer("curved-line")) {
        map.removeLayer("curved-line");
      }
      if (map.getSource("route-source")) {
        map.removeSource("route-source");
      }
      // Only draw if we have at least 2 points and a route type
      if (routeType === "none" || markers.length < 2) return;

      const coords = markers.map((m) => m.markerCoordinates);
      if (routeType === "air") {
        const line = turf.lineString(coords as number[][]);
        const curved = turf.bezierSpline(line, { sharpness: 1 });
        setTimeout(() => {
          displayRoute(curved.geometry.coordinates as [number, number][]);
        }, 1000);
      } else if (routeType === "road") {
        getRoute(coords as [number, number][], map.getZoom(), (err, result) => {
          if (!err) {
            setTimeout(() => {
              displayRoute(result);
            }, 500);
          }
        });
      }
    };

    map.on("style.load", renderRoute);
    // Draw route immediately for current routeType
    renderRoute();
    return () => {
      map.off("style.load", renderRoute);
    };
  }, [routeType, markers]);

  // Store custom map center, zoom, pitch, bearing on user interactions in 'custom' mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handleMoveEnd = () => {
      if (mapType === "custom") {
        const center = map.getCenter();
        customStateRef.current = {
          center: [center.lng, center.lat],
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing(),
        };
      }
    };
    map.on("moveend", handleMoveEnd);
    return () => {
      map.off("moveend", handleMoveEnd);
    };
  }, [mapType]);

  // Toggle navigation controls and interactions based on mapType
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Remove existing nav control if any
    if (navControlRef.current) {
      map.removeControl(navControlRef.current);
      navControlRef.current = null;
    }
    if (mapType === "custom") {
      // Add zoom, rotation, and pitch controls
      navControlRef.current = new mapboxgl.NavigationControl({
        showZoom: true,
        showCompass: true,
        visualizePitch: true,
      });
      map.addControl(navControlRef.current, "top-right");
      // Restore saved center/zoom if provided
      if (initialCenter && initialZoom !== undefined) {
        map.jumpTo({
          center: initialCenter,
          zoom: initialZoom,
          pitch: 0,
          bearing: 0,
        });
      } else {
        // If user has customized view, restore it, else fit markers
        const isCustomView = customStateRef.current.center[0] !== mapState.current.center[0] || customStateRef.current.center[1] !== mapState.current.center[1] || customStateRef.current.zoom !== mapState.current.zoom;
        if (isCustomView) {
          map.jumpTo({
            center: customStateRef.current.center,
            zoom: customStateRef.current.zoom,
            pitch: customStateRef.current.pitch,
            bearing: customStateRef.current.bearing,
          });
        } else if (markers.length > 0) {
          // Fit bounds to markers
          const bounds = new mapboxgl.LngLatBounds();
          markers.forEach((marker) => bounds.extend(marker.markerCoordinates));
          map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 0 });
          // Update custom state to the fitted view
          const center = [bounds.getCenter().lng, bounds.getCenter().lat] as [number, number];
          customStateRef.current = {
            center,
            zoom: map.getZoom(),
            pitch: map.getPitch(),
            bearing: map.getBearing(),
          };
        }
      }
     
     // Enable interactions
     map.dragPan.enable();
     map.scrollZoom.enable();
     map.boxZoom.enable();
     map.dragRotate.enable();
     map.keyboard.enable();
     map.doubleClickZoom.enable();
     map.touchZoomRotate.enable();
     map.touchPitch.enable();
    } else if (mapType === "fit") {
      // Disable interactions and hide controls
      map.dragPan.disable();
      map.scrollZoom.disable();
      map.boxZoom.disable();
      map.dragRotate.disable();
      map.keyboard.disable();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disable();
      map.touchPitch.disable();
    }
  }, [mapType, markers, initialCenter, initialZoom]);

  return (
    <div ref={parentRef} className="w-full h-full relative overflow-hidden">
      <div
        ref={mapContainerRef}
        style={{
          width: pxSize,
          height: pxSize,
          minWidth: pxSize,
          minHeight: pxSize,
          maxWidth: pxSize,
          maxHeight: pxSize,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          background: '#e5e7eb', // fallback bg
          position: 'absolute',
          left: `${offset.left}px`,
          top: `${offset.top}px`,
        }}
      />
      <div className="absolute left-1/2 bottom-9 transform -translate-x-1/2 bg-white/90">
        <div className="title">{title}</div>
      </div>
    </div>
  );
}

export default function MapPreviewModal({ onClose, onSave, markers, title, frameSize, initialSettings = { mapStyle: "vintage", routeType: "none", mapType: "fit" } }: MapPreviewModalProps) {
  const [activeTab, setActiveTab] = useState("style");
  const [mapStyle, setMapStyle] = useState(initialSettings.mapStyle || "ckknu6rsw62dq17nubbhdk7zg");
  const [routeType, setRouteType] = useState(initialSettings.routeType || "none");
  const [mapType, setMapType] = useState(initialSettings.mapType || "fit");
  const [showLabels, setShowLabels] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialSettings.mapCenter || [0, 0]);
  const [mapZoom, setMapZoom] = useState(initialSettings.mapZoom || 1);
  const [customStyles, setCustomStyles] = useState<MapStyle[]>([]);
  const [isLoadingStyles, setIsLoadingStyles] = useState(false);
  const [isInitialFit, setIsInitialFit] = useState(!initialSettings.mapCenter);
  const tempMapState = useRef({ center: mapCenter, zoom: mapZoom });
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const lastCustomState = useRef<{ center: [number, number]; zoom: number } | null>(null);
  const [splitImageUrls, setSplitImageUrls] = useState<string[]>([]);
  const parentRef = useRef<HTMLDivElement>(null);
  const [mapBg, setMapBg] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const lastMapState = useRef<{ center: [number, number]; zoom: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [hasFitted, setHasFitted] = useState(false);

  // Store map state before tab switch
  const handleTabChange = (newTab: string) => {
    const mapInstance = getMapInstance();
    if (mapInstance) {
      const center = mapInstance.getCenter();
      lastMapState.current = {
        center: [center.lng, center.lat],
        zoom: mapInstance.getZoom(),
      };
    }
    setActiveTab(newTab);
  };
  // Fetch custom styles and set initial style
  useEffect(() => {
    const getCustomStyles = async () => {
      setIsLoadingStyles(true);
      try {
        const styles = await fetchMapStyles();
        setCustomStyles(styles);

        if (styles.length > 0) {
          // Only override if current mapStyle isn't in fetched custom styles
          const saved = mapStyle;
          const available = styles.some(s => s.styleId === saved || s.styleIdLabelled === saved);
          if (!available) {
            const defaultStyle = showLabels ? styles[0].styleIdLabelled : styles[0].styleId;
            setMapStyle(defaultStyle);
            const instance = getMapInstance();
            if (instance) instance.setStyle(defaultStyle);
          }
        }
      } catch (error) {
        console.error("Error fetching custom map styles:", error);
      } finally {
        setIsLoadingStyles(false);
      }
    };
    getCustomStyles();
  }, []); // Run only once on mount

  // Map styles with preview images
  const mapStyles = [
    { id: "vintage", name: "Vintage", image: "/placeholder.svg?height=80&width=80&text=Vintage" },
    { id: "retro", name: "Retro", image: "/placeholder.svg?height=80&width=80&text=Retro" },
    { id: "minimal", name: "Minimal", image: "/placeholder.svg?height=80&width=80&text=Minimal" },
    { id: "satellite", name: "Satellite", image: "/placeholder.svg?height=80&width=80&text=Satellite" },
    { id: "terrain", name: "Terrain", image: "/placeholder.svg?height=80&width=80&text=Terrain" },
    { id: "dark", name: "Dark", image: "/placeholder.svg?height=80&width=80&text=Dark" },
  ];

  // Combine custom and static styles into a uniform display list
  const staticDisplayStyles = mapStyles.map((style) => ({
    styleId: style.id,
    styleIdLabelled: style.id,
    title: style.name,
    image: style.image,
    Title: style.name,
    ID: style.id,
    border: "none",
  }));
  const customDisplayStyles = customStyles.map((style) => ({
    styleId: style.styleId,
    styleIdLabelled: style.styleIdLabelled,
    title: style.Title,
    image: style.image,
    Title: style.Title,
    ID: style.ID,
    border: style.border,
  }));
  const displayStyles = customDisplayStyles.length > 0 ? customDisplayStyles : staticDisplayStyles;

  // Initialize map style with labels
  useEffect(() => {
    const mapInstance = getMapInstance();
    if (mapInstance && showLabels) {
      // Find the current style
      const currentStyle = displayStyles.find((style) => style.styleId === mapStyle || style.styleIdLabelled === mapStyle);

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
      const currentStyle = displayStyles.find((style) => style.styleId === mapStyle || style.styleIdLabelled === mapStyle);

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
        const parentWidth = parentRef.current.offsetWidth;
        const parentHeight = parentRef.current.offsetHeight;
        // 2400 is the fixed size of .split-map-cont
        const scaleW = parentWidth / 2400;
        const scaleH = parentHeight / 2400;
        const newScale = Math.min(scaleW, scaleH);
        setScale(newScale);

        // Calculate centered position
        const scaledWidth = 2400 * newScale;
        const scaledHeight = 2400 * newScale;
        const left = (parentWidth - scaledWidth) / 2;
        const top = (parentHeight - scaledHeight) / 2;

        // Apply the transform and position
        const splitMapCont = parentRef.current.querySelector(".split-map-cont") as HTMLDivElement;
        if (splitMapCont) {
          splitMapCont.style.transform = `scale(${newScale})`;
          splitMapCont.style.transformOrigin = "top left";
          splitMapCont.style.position = "absolute";
          splitMapCont.style.left = `${left}px`;
          splitMapCont.style.top = `${top}px`;
        }
        return true; // Return true if resize was successful
      }
      return false; // Return false if parentRef is not available
    }

    // Use interval to keep checking until parentRef is available
    const intervalId = setInterval(() => {
      const success = handleResize();
      if (success) {
        clearInterval(intervalId);
      }
    }, 100); // Check every 100ms

    // Use ResizeObserver for parent container
    let observer: ResizeObserver | null = null;
    if (parentRef.current && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(handleResize);
      observer.observe(parentRef.current);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("resize", handleResize);
      if (observer && parentRef.current) observer.disconnect();
    };
  }, []); // Empty dependency array since we want this to run only once on mount

  // Update map instance reference when it changes
  useEffect(() => {
    if (mapRef.current) {
      setMapInstance(mapRef.current);
    }
  }, [mapRef.current]);

  // Log markers for debugging
  useEffect(() => {
    console.log("Map preview markers:", markers);
    console.log(
      "Markers with coordinates:",
      markers.filter((m) => m.markerCoordinates)
    );
  }, [markers]);

  // Calculate the map center and zoom based on markers
  useEffect(() => {
    if (markers.length === 0 || !isInitialFit) return;

    // If we have markers with coordinates, use them to calculate map center and zoom
    const markersWithCoords = markers.filter((marker) => marker.markerCoordinates);

    if (markersWithCoords.length === 0) return;

    // Calculate bounds
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    markersWithCoords.forEach((marker) => {
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
          [maxLng, maxLat],
        ],
        {
          padding: 50, // Add some padding around the bounds
          maxZoom: 15, // Limit maximum zoom level
          duration: 0, // No animation for initial fit
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
      id: "fit",
      name: "Fit Markers",
      description: "Adjusts marker positions to avoid overlapping",
      image: "/placeholder.svg?height=120&width=120&text=Fit%20Markers",
    },
    {
      id: "custom",
      name: "Custom",
      description: "Standard map with all markers shown in their exact positions",
      image: "/placeholder.svg?height=120&width=120&text=Custom",
    },
    ...(markers.length >= 2 && markers.length <= 6
      ? [
          {
            id: "split",
            name: "Heart",
            description: "Creates a heart shape with each section showing a different location",
            image: "/placeholder.svg?height=120&width=120&text=Split%20Heart",
          },
        ]
      : []),
  ];

  const handleSave = () => {
    // Get the final map state from the map instance
    const mapInstance = mapRef.current
    if (mapInstance) {
      const center = mapInstance.getCenter();
      const zoom = mapInstance.getZoom();
      onSave({
        mapStyle,
        routeType,
        mapType,
        mapCenter: [center.lng, center.lat],
        mapZoom: zoom,
        mapHeight: mapInstance.getCanvas().clientHeight,
        mapWidth: mapInstance.getCanvas().clientWidth,
      });
    } else {
      onSave({
        mapStyle,
        routeType,
        mapType,
        mapCenter: tempMapState.current.center,
        mapZoom: tempMapState.current.zoom,
      });
    }
  };

  // Store map state when switching types
  const handleMapTypeChange = (newType: "custom" | "fit" | "split") => {
    setMapType(newType);
  };

  // Helper to generate a static Mapbox image URL centered on a single marker
  const getSingleMarkerUrl = (marker: Marker, mapStyle: string) => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const styleId = mapStyle.split("/").pop();
    const [lng, lat] = marker.markerCoordinates || marker.markerLocation;
    const coords = `${lng},${lat},12,0`;
    // Generate marker image as dataURL
    const dataUrl = generateMarkerImg(marker.markerEmoji, marker.markerLabel, sizeMap[marker.markerSize]) as string;
    // Use the API endpoint to convert dataURL to PNG
    const markerApiUrl = encodeURIComponent(`https://collections.pinenlime.com/api/marker?dataurl=${dataUrl}`);
    // Return Mapbox static map URL with custom marker overlay
    return `https://api.mapbox.com/styles/v1/pinenlime/${styleId}/static/url-${markerApiUrl}(${lng},${lat})/${coords}/${parseInt(frameSize as string) * 48}x${parseInt(frameSize as string) * 48}@2x?access_token=${token}&logo=false&attribution=false`;
  };

  // Pre-generate one image per marker when entering split mode
  useEffect(() => {
    if (mapType !== "split") return;
    const layout = HEART_LAYOUT_DATA.find((item) => item.id === markers.length);
    if (!layout) return;
    const urls = markers.map((marker) => getSingleMarkerUrl(marker, mapStyle));
    setSplitImageUrls(urls);
  }, [mapType, markers, mapStyle]);

  // Get the appropriate style URL based on whether labels are enabled
  const getStyleUrl = (style: MapStyle) => {
    return showLabels ? style.styleIdLabelled : style.styleId;
  };

  // Get the current map style URL
  const getCurrentMapStyle = () => {
    const currentStyle = displayStyles.find((style) => getStyleUrl(style) === mapStyle);
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
        zoom: zoom,
      };
    }
    setMapStyle(newStyle);
  };

  // Add effect to disable map interactions for 'fit' type
  useEffect(() => {
    if (mapType === "fit" && !hasFitted) {
      const mapInstance = getMapInstance();
      if (mapInstance) {
        // Store current state before disabling interactions
        const currentCenter = mapInstance.getCenter();
        const currentZoom = mapInstance.getZoom();
        tempMapState.current = {
          center: [currentCenter.lng, currentCenter.lat],
          zoom: currentZoom,
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
        const markersWithCoords = markers.filter((marker) => marker.markerCoordinates);
        if (markersWithCoords.length === 1) {
          const [lng, lat] = markersWithCoords[0].markerCoordinates!;
          mapInstance.flyTo({
            center: [lng, lat],
            zoom: 12, // Reasonable zoom level for a single marker
            duration: 0,
          });
        } else if (markersWithCoords.length > 1) {
          // Calculate bounds for multiple markers
          let minLng = Infinity;
          let maxLng = -Infinity;
          let minLat = Infinity;
          let maxLat = -Infinity;

          markersWithCoords.forEach((marker) => {
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
              [maxLng, maxLat],
            ],
            {
              padding: 50,
              maxZoom: 15,
              duration: 0,
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
  const renderHeartMap = () => {
    const layout = HEART_LAYOUT_DATA.find((item) => item.id === markers.length);
    if (!layout || !layout.markers || splitImageUrls.length !== markers.length) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-[#563635]">{!layout ? "Split heart layout not available for this number of markers" : "Loading split map..."}</div>
        </div>
      );
    }
    return (
      <div ref={parentRef} className="w-full h-full flex items-center justify-center overflow-hidden relative">
        <div
          className="split-map-cont"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
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
                    transform: "translate(-50%, -50%)",
                  }}
                  alt=""
                />
              </div>
            ))}
            <img src={layout.img} className="split-map-img" alt="" />
          </div>
          {title && (
            <div className="split-map-title absolute left-1/2 bottom-8 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded shadow-md" style={{ scale: 1 / scale }}>
              {title}
            </div>
          )}
        </div>
      </div>
    );
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-full sm:max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-2 sm:p-4 border-b">
          <h2 className="text-xl font-bold text-[#563635]">Preview Your Journey Map</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Map preview */}
          <div ref={mapContainerRef} className="flex-1 flex items-center justify-center bg-[#fcf8ed] min-h-[300px] md:min-h-0">
            <div className="w-full h-full relative" style={{ display: mapType === "split" ? "none" : "block" }}>
              <PersistentMap
                markers={markers}
                frameSize={frameSize}
                mapStyle={getCurrentMapStyle()}
                routeType={routeType}
                mapType={mapType}
                title={title}
                mapRef={mapRef}
                initialCenter={mapCenter}
                initialZoom={mapZoom}
              />
              {mapBg && <img className="absolute inset-0 w-full h-full object-cover" src={mapBg} alt="" />}
            </div>
            <div className="w-full h-full" style={{ display: mapType === "split" ? "block" : "none" }}>{renderHeartMap()}</div>
          </div>

          {/* Settings panel */}
          <div className="w-full md:w-80 border-t md:border-l flex flex-col h-auto max-h-[50vh] md:max-h-full">
            <div className="p-2 sm:p-4 flex-1 overflow-auto">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="w-full">
                  <TabsTrigger value="style" className="flex-1">
                    Map Style
                  </TabsTrigger>
                  <TabsTrigger value="layout" className="flex-1">
                    Layout
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="style" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-[#563635]">Map Style</h3>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="show-labels" className="text-sm">
                          Labels
                        </Label>
                        <Switch id="show-labels" checked={showLabels} onCheckedChange={setShowLabels} />
                      </div>
                    </div>
                    {isLoadingStyles ? (
                      <div className="flex items-center justify-center p-2 text-[#563635]">Loading map styles...</div>
                    ) : (
                      <div className="grid grid-cols-5 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:max-h-[300px] overflow-y-auto">
                        {displayStyles.map((style) => (
                          <button key={style.styleId} type="button" onClick={() => handleStyleChange(getStyleUrl(style))} className={`p-1 rounded-md border hover:border-[#b7384e] transition-colors ${mapStyle === getStyleUrl(style) ? "border-[#b7384e] ring-1 ring-[#b7384e]" : "border-[#563635]/20"}`}>
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
                        <Label htmlFor="route-none" className="text-sm">
                          No Routes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="road" id="route-road" />
                        <Label htmlFor="route-road" className="text-sm">
                          Road Routes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="air" id="route-air" />
                        <Label htmlFor="route-air" className="text-sm">
                          Air Routes
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </TabsContent>

                <TabsContent value="layout" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-[#563635]">Map Layout</h3>
                    <div className="space-y-2">
                      {mapTypes.map((type) => (
                        <div key={type.id} className={`p-2 border rounded-md cursor-pointer ${mapType === type.id ? "border-[#b7384e] bg-[#b7384e]/5" : "border-[#563635]/20"}`} onClick={() => handleMapTypeChange(type.id as "custom" | "fit" | "split")}>
                          <div className="flex items-start gap-2">
                            <div className="w-12 h-12 shrink-0 rounded overflow-hidden border border-[#563635]/10">
                              <img src={type.image || "/placeholder.svg"} alt={type.name} className="w-full h-full object-cover" />
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
                                        <p className="text-xs max-w-[200px]">Best with 3-7 markers. Creates a beautiful heart-shaped collage of your journey.</p>
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
            <div className="p-2 sm:p-4 border-t">
              <Button onClick={handleSave} className="w-full bg-[#b7384e] hover:bg-[#b7384e]/90 text-white">
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
