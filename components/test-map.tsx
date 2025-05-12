"use client";

import { useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useRef } from "react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function MapboxMap(
  { 
    intrinsicHeight = "8in",
    intrinsicWidth = "8in",
    visibleHeight = "500px",
    visibleWidth = "500px",
    getZoom = () => 12
  }: {
    intrinsicHeight?: string;
    intrinsicWidth?: string;
    visibleHeight?: string;
    visibleWidth?: string;
    getZoom?: () => number;
  }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [scale, setScale] = useState(1);
  const [zoom, setZoom] = useState(12);

  // Convert dimension string to pixels
  const convertToPixels = (size: string): number => {
    const value = parseFloat(size.match(/^[0-9.]+/)?.[0] || "0");
    const unit = size.match(/[a-z%]+$/i)?.[0] || "px";

    // Convert common units to pixels (approximate values)
    switch (unit.toLowerCase()) {
      case "px":
        return value;
      case "in":
        return value * 96; // 1in = 96px (standard)
      case "cm":
        return value * 37.8; // 1cm = 37.8px (approximate)
      case "mm":
        return value * 3.78; // 1mm = 3.78px (approximate)
      case "pt":
        return value * 1.33; // 1pt = 1.33px (approximate)
      case "rem":
      case "em":
        return value * 16; // Assuming 1rem/em = 16px (default browser font size)
      default:
        return value; // If unknown unit, treat as pixels
    }
  };

  useEffect(() => {
    // Calculate scale factor with unit conversion
    const intrinsicW = convertToPixels(intrinsicWidth);
    const intrinsicH = convertToPixels(intrinsicHeight);
    const visibleW = convertToPixels(visibleWidth);
    const visibleH = convertToPixels(visibleHeight);

    // Use the smaller scale to fit both dimensions
    const scaleW = visibleW / intrinsicW;
    const scaleH = visibleH / intrinsicH;
    const newScale = Math.min(scaleW, scaleH);

    setScale(newScale);
  }, [intrinsicHeight, intrinsicWidth, visibleHeight, visibleWidth]);

  useEffect(() => {
    if (mapContainerRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/standard",
        center: [126.9152, 37.5542],
        zoom: 12,
      });
    }
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setZoom(zoom);
    }
  }, [zoom]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.on("zoomend", () => {
        setZoom(mapRef.current?.getZoom() || 12);
      });
    }
  }, []);

  return (
    <div style={{ width: visibleWidth, height: visibleHeight, overflow: "hidden" }}>
      <div
        ref={mapContainerRef}
        style={{
          width: intrinsicWidth,
          height: intrinsicHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
