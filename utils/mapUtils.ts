import mapboxgl from 'mapbox-gl';

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
    ...options
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
  const marker = new mapboxgl.Marker(options)
    .setLngLat(lngLat)
    .addTo(mapInstance);
  return marker;
} 

export function getVirtualMapInstance(height: string = '500px', width: string = '500px'): mapboxgl.Map {
  const mapContainer = document.createElement("div")
  mapContainer.style.height = height
  mapContainer.style.width = width
  return new mapboxgl.Map({
    container: mapContainer,
    style: "mapbox://styles/mapbox/standard",
    center: [126.9152, 37.5542],
    zoom: 12,
  });
}



