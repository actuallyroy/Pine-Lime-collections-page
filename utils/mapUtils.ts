import { generateMarkerImg, getRoute } from "@/lib/map-utils";
import mapboxgl from "mapbox-gl";
import { toBlob } from "html-to-image";
import { HEART_LAYOUT_DATA } from "@/lib/heart-layouts";
import * as turf from "@turf/turf";


// Define marker sizes
const sizeMap = {
  S: 20,
  M: 22,
  L: 24,
};

// Global reference to the mapbox instance
let mapInstance: mapboxgl.Map | null = null;

/**
 * Set the global map instance
 */
export function setMapInstance(map: mapboxgl.Map | null): void {
  mapInstance = map;
}

/**
 * Get the global map instance
 */
export function getMapInstance(): mapboxgl.Map | null {
  return mapInstance;
}

/**
 * Convert geographic coordinates to pixel coordinates
 */
export function projectToPixel(lngLat: [number, number]): mapboxgl.Point | null {
  if (!mapInstance) return null;
  return mapInstance.project(new mapboxgl.LngLat(lngLat[0], lngLat[1]));
}

/**
 * Convert pixel coordinates to geographic coordinates
 */
export function unprojectToLngLat(point: mapboxgl.Point): mapboxgl.LngLat | null {
  if (!mapInstance) return null;
  return mapInstance.unproject(point);
}

/**
 * Get the current map center
 */
export function getMapCenter(): [number, number] | null {
  if (!mapInstance) return null;
  const center = mapInstance.getCenter();
  return [center.lng, center.lat];
}

/**
 * Get the current map zoom level
 */
export function getMapZoom(): number | null {
  if (!mapInstance) return null;
  return mapInstance.getZoom();
}

/**
 * Fly to a location on the map
 */
export function flyTo(lngLat: [number, number], zoom?: number, options?: Record<string, any>): void {
  if (!mapInstance) return;

  const flyOptions: { center: [number, number]; zoom?: number } & Record<string, any> = {
    center: lngLat,
    ...options,
  };

  if (zoom !== undefined) {
    flyOptions.zoom = zoom;
  }

  mapInstance.flyTo(flyOptions);
}

/**
 * Add a marker to the map
 */
export function addMarker(lngLat: [number, number], options?: mapboxgl.MarkerOptions): mapboxgl.Marker | null {
  if (!mapInstance) return null;
  const marker = new mapboxgl.Marker(options).setLngLat(lngLat).addTo(mapInstance);
  return marker;
}

export function getVirtualMapInstance(height: string = "500px", width: string = "500px", center: [number, number] = [126.9152, 37.5542], zoom: number = 12, bearing: number = 0, mapStyle: string = "mapbox://styles/mapbox/standard", route: [number, number][] = []): mapboxgl.Map {
  
  const mapContainer = document.createElement("div");
  document.body.appendChild(mapContainer);
  mapContainer.style.height = height;
  mapContainer.style.width = width;
  const mapInstance = new mapboxgl.Map({
    container: mapContainer,
    style: mapStyle,
    center: center,
    zoom: zoom,
    bearing: bearing,
  });
  document.body.removeChild(mapContainer);
  return mapInstance;
}

export function getMapBg(height: number, width: number, center: [number, number], zoom: number, mapStyle: string, bearing: number = 0): Promise<string> {
  const styleId = mapStyle.split("/").pop();
  const staticImage = `https://api.mapbox.com/styles/v1/pinenlime/${styleId}/static/${center[0]},${center[1]},${zoom},${bearing}/${width}x${height}@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&logo=false&attribution=false`;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = staticImage;
    img.onload = () => resolve(staticImage);
    img.onerror = () => reject(new Error("Failed to load map background"));
  });
}


// Helper to generate a static Mapbox image URL centered on a single marker
const getSingleMarkerUrl = (marker: Marker, mapStyle: string, frameSize: string) => {
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

// Utility to compute the negative/inverted color for better contrast
function getNegativeColor(color: string): string {
  if (color.charAt(0) === "#") {
    const hex = color.substring(1);
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    const invertedR = 255 - r;
    const invertedG = 255 - g;
    const invertedB = 255 - b;
    return `#${((1 << 24) + (invertedR << 16) + (invertedG << 8) + invertedB)
      .toString(16)
      .slice(1)}`;
  }
  if (color.startsWith("rgb")) {
    const matches = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (!matches) return color;
    const invertedR = 255 - parseInt(matches[1]);
    const invertedG = 255 - parseInt(matches[2]);
    const invertedB = 255 - parseInt(matches[3]);
    return `rgb(${invertedR}, ${invertedG}, ${invertedB})`;
  }
  if (color.startsWith("hsl")) {
    const matches = color.match(/(\d+),\s*(\d+)%?,\s*(\d+)%?/);
    if (!matches) return color;
    const invertedH = (parseInt(matches[1]) + 180) % 360;
    const invertedS = 100 - parseInt(matches[2]);
    const invertedL = 100 - parseInt(matches[3]);
    return `hsl(${invertedH}, ${invertedS}%, ${invertedL}%)`;
  }
  return color;
}

export async function generateMapPreview(mapPreviewContainer: HTMLDivElement, markers: Marker[], mapTitle: string, mapData: MapData, frameSize: string = "4 in"): Promise<Blob> {
  mapPreviewContainer.innerHTML = "";
  switch (mapData.mapType) {
    case "fit":
    case "custom":
      return new Promise(async (resolve, reject) => {
        const mapInstance = await getVirtualMapInstance(mapData.mapHeight + "px", mapData.mapWidth + "px", mapData.mapCenter, mapData.mapZoom, mapData.mapBearing, mapData.mapStyle);
        mapPreviewContainer.style.height = mapData.mapHeight + "px";
        mapPreviewContainer.style.width = mapData.mapWidth + "px";
        mapInstance.once("idle", async () => {
          try {
            // Draw route on the map before capturing
            const routeType = mapData.routeType;
            if (routeType !== "none" && markers.length >= 2) {
              const coords = markers.map(m => m.markerLocation) as [number, number][];
              const displayRoute = (coordinates: [number, number][]) => {
                if (mapInstance.getSource("route-source")) {
                  (mapInstance.getSource("route-source") as mapboxgl.GeoJSONSource).setData({
                    type: "Feature",
                    properties: {},
                    geometry: { type: "LineString", coordinates },
                  });
                } else {
                  let landColor = "#000000";
                  try {
                    if (mapInstance.getLayer("land")) {
                      const paint = mapInstance.getPaintProperty("land", "background-color");
                      if (Array.isArray(paint)) landColor = paint[paint.length - 1] as string;
                      else if (typeof paint === "string") landColor = paint;
                    } else if (mapInstance.getLayer("background")) {
                      const paint = mapInstance.getPaintProperty("background", "background-color");
                      if (Array.isArray(paint)) landColor = paint[paint.length - 1] as string;
                      else if (typeof paint === "string") landColor = paint;
                    }
                  } catch (e) {
                    console.error("Error getting land color:", e);
                  }
                  mapInstance.addSource("route-source", {
                    type: "geojson",
                    data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } },
                  });
                  mapInstance.addLayer({
                    id: "route-layer",
                    type: "line",
                    source: "route-source",
                    layout: { "line-join": "round", "line-cap": "round" },
                    paint: {
                      "line-color": mapData.routeColor || getNegativeColor(landColor),
                      "line-width": 4,
                      "line-dasharray": [1, 1.5],
                    },
                  });
                }
              };
              if (routeType === "air") {
                const line = turf.lineString(coords as number[][]);
                const curved = turf.bezierSpline(line, { sharpness: 1 });
                displayRoute(curved.geometry.coordinates as [number, number][]);
                // Wait for the map to be idle after drawing the route
                await new Promise<void>(resolve => {
                  mapInstance.once("idle", () => {
                    resolve();
                  });
                });
              } else if (routeType === "road") {
                await new Promise<void>((res, rej) => {
                  getRoute(coords, mapInstance.getZoom(), (err, result) => {
                    if (err) return rej(err);
                    displayRoute(result);
                    mapInstance.once("idle", () => res());
                  });
                });
              }
            }
            // Capture the canvas with the route drawn
            const mapBg = mapInstance.getCanvas().toDataURL();
            mapPreviewContainer.style.backgroundImage = `url(${mapBg})`;
            
            // Add markers
            for (const marker of markers) {
              const markerCoords = projectToPixel([marker.markerLocation[0], marker.markerLocation[1]]);
              if (!markerCoords) continue;
              const markerImage = generateMarkerImg(marker.markerEmoji, marker.markerLabel, sizeMap[marker.markerSize]);
              const el = document.createElement("div");
              el.style.position = "absolute";
              el.style.left = `${markerCoords.x - 30}px`;
              el.style.top = `${markerCoords.y - 30}px`;
              el.style.width = `60px`;
              el.style.height = `60px`;
              el.style.backgroundImage = `url(${markerImage})`;
              el.style.backgroundSize = "contain";
              el.style.backgroundRepeat = "no-repeat";
              el.style.backgroundPosition = "center";
              mapPreviewContainer.appendChild(el);
            }
            
            // Add title
            const titleDiv = document.createElement("div");
            titleDiv.style.position = "absolute";
            titleDiv.style.bottom = "20px";
            titleDiv.style.left = "50%";
            titleDiv.style.transform = "translate(-50%, -50%)";
            titleDiv.style.fontSize = "20px";
            titleDiv.style.background = "white";
            titleDiv.style.padding = "4px 40px";
            titleDiv.style.border = "1px solid";
            titleDiv.style.outline = "7px solid white";
            titleDiv.textContent = mapTitle;
            mapPreviewContainer.appendChild(titleDiv);
            
            mapPreviewContainer.style.display = "block";
            const blob = await toBlob(mapPreviewContainer);
            if (!blob) {
              reject(new Error("Failed to generate map preview"));
              return;
            }
            resolve(blob);
            mapPreviewContainer.style.display = "none";
          } catch (error) {
            reject(error);
          }
        });
      });

    case "split":
      return new Promise(async (resolve, reject) => {
        try {
          const N = markers.length;
          mapPreviewContainer.style.height = "1000px";
          mapPreviewContainer.style.width = "1000px";
          mapPreviewContainer.classList.add("split-map-container");
          
          const layout = HEART_LAYOUT_DATA.find(layout => layout.id === N);
          if (!layout) {
            throw new Error("Invalid layout configuration");
          }          
          // Add markers
          for (const [index, marker] of markers.entries()) {
            const markerConfig = layout.markers[index];
            if (!markerConfig) continue;
            
            const { top, left, height, width, clipPath, img } = markerConfig;
            const markerImage = getSingleMarkerUrl(marker, mapData.mapStyle, frameSize);
            
            const markerElement = document.createElement("div");
            markerElement.className = "split-map-marker";
            markerElement.style.position = "absolute";
            markerElement.style.top = `${top}px`;
            markerElement.style.left = `${left}px`;
            markerElement.style.width = `${width}%`;
            markerElement.style.height = `${height}%`;
            markerElement.style.clipPath = `path('${clipPath}')`;
            
            const markerImg = new Image();
            markerImg.style.position = "absolute";
            markerImg.style.top = `${img.top}%`;
            markerImg.style.left = `${img.left}%`;
            markerImg.src = markerImage;
            
            markerImg.onload = () => {
              markerElement.style.backgroundImage = `url(${markerImage})`;
              markerElement.appendChild(markerImg);
            };
            
            mapPreviewContainer.appendChild(markerElement);
          }

          const bgImg = new Image();
          bgImg.style.position = "absolute";
          bgImg.style.zIndex = "1";
          bgImg.src = layout.img;
          bgImg.onload = () => {
            mapPreviewContainer.appendChild(bgImg);
          };

          // Add title
          const titleDiv = document.createElement("div");
          titleDiv.style.position = "absolute";
          titleDiv.style.bottom = "20px";
          titleDiv.style.left = "50%";
          titleDiv.style.transform = "translate(-50%, -50%)";
          titleDiv.style.fontSize = "20px";
          titleDiv.style.background = "white";
          titleDiv.style.padding = "4px 40px";
          titleDiv.style.border = "1px solid";
          titleDiv.style.outline = "7px solid white";
          titleDiv.style.zIndex = "2";
          titleDiv.textContent = mapTitle;
          mapPreviewContainer.appendChild(titleDiv);

          mapPreviewContainer.style.display = "block";
          const blob = await toBlob(mapPreviewContainer);
          if (!blob) {
            reject(new Error("Failed to generate map preview"));
            return;
          }
          resolve(blob);
          mapPreviewContainer.style.display = "none";
          mapPreviewContainer.classList.remove("split-map-container");
          mapPreviewContainer.style.height = "0px";
          mapPreviewContainer.style.width = "0px";
        } catch (error) {
          reject(error);
        }
      });

    default:
      throw new Error("Invalid map type");
  }
}
