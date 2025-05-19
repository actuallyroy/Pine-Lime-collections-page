import { generateMarkerImg } from "@/lib/map-utils";
import mapboxgl from "mapbox-gl";
import { toBlob } from "html-to-image";
import { HEART_LAYOUT_DATA } from "@/lib/heart-layouts";

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

export function getVirtualMapInstance(height: string = "500px", width: string = "500px"): mapboxgl.Map {
  const mapContainer = document.createElement("div");
  mapContainer.style.height = height;
  mapContainer.style.width = width;
  return new mapboxgl.Map({
    container: mapContainer,
    style: "mapbox://styles/mapbox/standard",
    center: [126.9152, 37.5542],
    zoom: 12,
  });
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



export async function generateMapPreview(mapPreviewContainer: HTMLDivElement, markers: Marker[], mapTitle: string, mapData: MapData, frameSize: string = "4 in"): Promise<Blob> {
  switch (mapData.mapType) {
    case "fit":
    case "custom":
      return new Promise(async (resolve, reject) => {
        const mapInstance = getVirtualMapInstance(mapData.mapHeight + "px", mapData.mapWidth + "px");
        mapInstance.setStyle(mapData.mapStyle);
        mapInstance.setZoom(mapData.mapZoom);
        if (mapData.mapBearing) {
          mapInstance.setBearing(mapData.mapBearing);
        }
        mapInstance.once("idle", async () => {
          try {
            const mapBg = await getMapBg(
              mapData.mapHeight || 500,
              mapData.mapWidth || 500,
              mapData.mapCenter,
              mapData.mapZoom,
              mapData.mapStyle,
              mapData.mapBearing
            );
            mapPreviewContainer.style.backgroundImage = `url(${mapBg})`;
            
            // Add markers
            for (const marker of markers) {
              const markerCoordinates = projectToPixel([marker.markerLocation[0], marker.markerLocation[1]]);
              if (!markerCoordinates) continue;
              
              const markerImage = generateMarkerImg(marker.markerEmoji, marker.markerLabel, sizeMap[marker.markerSize]);
              const markerElement = document.createElement("div");
              markerElement.style.position = "absolute";
              markerElement.style.left = `${markerCoordinates.x - 30}px`;
              markerElement.style.top = `${markerCoordinates.y - 30}px`;
              markerElement.style.width = `60px`;
              markerElement.style.height = `60px`;
              markerElement.style.backgroundImage = `url(${markerImage})`;
              markerElement.style.backgroundSize = "contain";
              markerElement.style.backgroundRepeat = "no-repeat";
              markerElement.style.backgroundPosition = "center";
              mapPreviewContainer.appendChild(markerElement);
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
