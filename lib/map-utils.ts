/**
 * Map utility functions for working with static maps
 */

import { EmojiStyle } from "emoji-picker-react";

/**
 * Projects geographical coordinates to pixel coordinates on a static map
 * This is a simplified implementation of the Mapbox GL JS project function
 * 
 * @param coordinates [longitude, latitude] coordinates to project
 * @param center Center point of the map [longitude, latitude]
 * @param zoom Zoom level of the map
 * @param width Width of the map in pixels
 * @param height Height of the map in pixels
 * @returns [x, y] pixel coordinates
 */
export function projectCoordinatesToPixels(
  coordinates: [number, number],
  center: [number, number],
  zoom: number,
  width: number,
  height: number
): [number, number] {
  // Constants for the Web Mercator projection
  const TILE_SIZE = 512;
  const WORLD_SIZE = TILE_SIZE * Math.pow(2, zoom);
  
  // Convert longitude to pixel x position
  function longitudeToPixelX(lon: number): number {
    return ((lon + 180) / 360) * WORLD_SIZE;
  }
  
  // Convert latitude to pixel y position
  function latitudeToPixelY(lat: number): number {
    const sinLat = Math.sin((lat * Math.PI) / 180);
    return (0.5 - (Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI))) * WORLD_SIZE;
  }
  
  // Get center point in pixels
  const centerPx = [
    longitudeToPixelX(center[0]),
    latitudeToPixelY(center[1])
  ];
  
  // Get target coordinates in pixels
  const coordPx = [
    longitudeToPixelX(coordinates[0]),
    latitudeToPixelY(coordinates[1])
  ];
  
  // Calculate the pixel position relative to the center
  const dx = coordPx[0] - centerPx[0];
  const dy = coordPx[1] - centerPx[1];
  
  // Calculate the final pixel coordinates on the image
  return [
    width / 2 + dx,
    height / 2 + dy
  ];
}

// Add marker image generation function
export const generateMarkerImg = (emojiTxt: string, label: string, size: number = 20, labelFont: string = "Arial", emojiStyle: EmojiStyle = EmojiStyle.GOOGLE) => {
  const canvas = document.createElement("canvas");
  let fontSize = size * 0.6;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.font = `${fontSize}px ${labelFont}`;
  const labelMetrics = ctx.measureText(label);
  const textWidth = labelMetrics.width + 20;
  let emojiY = size * 0.9;

  let textHeight = size * 0.92;

  const emojiFont = emojiStyle === EmojiStyle.APPLE ? "Apple Color Emoji" : "Noto Color Emoji";
  ctx.font = `${size}px "${emojiFont}"`;
  const emojiMetrics = ctx.measureText(emojiTxt);
  const emojiWidth = emojiMetrics.width;

  canvas.height = textHeight + size + 20;
  canvas.width = Math.max(emojiWidth, textWidth);

  ctx.font = `${size}px "${emojiFont}"`;
  ctx.fillText(emojiTxt, textWidth / 2 - emojiWidth / 2 < 0 ? 0 : textWidth / 2 - emojiWidth / 2, emojiY);
  ctx.font = `${fontSize}px ${labelFont}`;
  ctx.strokeStyle = "white"; // Outline color
  ctx.lineWidth = 8; // Outline width
  ctx.lineJoin = "round";
  ctx.strokeText(label, 10, size + size * 0.72);
  ctx.fillText(label, 10, size + size * 0.72);

  return canvas.toDataURL();
};

/**
 * Calculates the bounds of a map given its center and zoom level
 * 
 * @param center Center point of the map [longitude, latitude]
 * @param zoom Zoom level of the map
 * @param width Width of the map in pixels
 * @param height Height of the map in pixels
 * @returns [minLng, minLat, maxLng, maxLat]
 */
export function calculateMapBounds(
  center: [number, number],
  zoom: number,
  width: number,
  height: number
): [number, number, number, number] {
  const TILE_SIZE = 512;
  const WORLD_SIZE = TILE_SIZE * Math.pow(2, zoom);
  
  // Calculate the distance in pixels from the center to the edge
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  // Convert center to pixels
  const centerPxX = ((center[0] + 180) / 360) * WORLD_SIZE;
  const sinLat = Math.sin((center[1] * Math.PI) / 180);
  const centerPxY = (0.5 - (Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI))) * WORLD_SIZE;
  
  // Calculate the pixels at the corners
  const minPxX = centerPxX - halfWidth;
  const maxPxX = centerPxX + halfWidth;
  const minPxY = centerPxY - halfHeight;
  const maxPxY = centerPxY + halfHeight;
  
  // Convert pixels back to geographical coordinates
  const minLng = (minPxX / WORLD_SIZE) * 360 - 180;
  const maxLng = (maxPxX / WORLD_SIZE) * 360 - 180;
  
  // The formula for latitude is inverse of the Mercator projection equation
  const minLat = (Math.atan(Math.exp((0.5 - minPxY / WORLD_SIZE) * 4 * Math.PI)) * 2 - Math.PI/2) * 180 / Math.PI;
  const maxLat = (Math.atan(Math.exp((0.5 - maxPxY / WORLD_SIZE) * 4 * Math.PI)) * 2 - Math.PI/2) * 180 / Math.PI;
  
  return [minLng, minLat, maxLng, maxLat];
} 

// Function to handle large distance routes on map.
function handleLargeDistance(coordinates: [number, number][], zoomLevel: number, callback: (error: any, result: any) => void) {
  let allRoutes: [number, number][] = [];
  let processCount = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    getRoute([coordinates[i], coordinates[i + 1]], zoomLevel, (error, route) => {
      processCount++;
      if (error) {
        callback(error, []);
        return;
      }
      allRoutes = allRoutes.concat(route);

      // Check if all routes have been processed
      if (processCount === coordinates.length - 1) {
        callback(null, allRoutes);
      }
    }, "driving"); // You can choose to use "walking" here if it makes more sense for your application
  }
}

export function getRoute(coordinates: [number, number][], zoomLevel: number, callback: (error: any, result: any) => void, mode = "walking") {
  const overview = zoomLevel >= 13.7 ? 'full' : 'simplified'
  console.log(overview);

  var url = coordinates.join(";") + "?alternatives=false&geometries=geojson&language=en&overview=" + overview + "&steps=false&access_token=" + process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  fetch(`https://api.mapbox.com/directions/v5/mapbox/${mode}/` + url)
    .then((response) => {
      if (response.status === 422 && mode === "walking") {
        // Try driving mode if walking fails with status 422
        return getRoute(coordinates, zoomLevel, callback, "driving");
      }
      return response.json();
    })
    .then((data) => {
      if (!data || data.code === "InvalidInput") {
        // Handle the case for route exceeding maximum distance
        return handleLargeDistance(coordinates, zoomLevel, callback);
      }

      // Process and return the route
      let res: [number, number][] = [];
      data.routes[0].geometry.coordinates.forEach((coordinate: [number, number]) => {
        res.push(coordinate);
      });
      callback(null, res);
    })
    .catch((error) => {
      callback(error, []);
    });
}