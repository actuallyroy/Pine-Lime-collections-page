"use client"

import { useState } from "react"
import MapboxMap from "@/components/mapbox-map"

export default function MapExample() {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)

  const markers = [
    {
      id: "1",
      coordinates: [-74.006, 40.7128] as [number, number],
      title: "New York City",
      description: "The Big Apple",
    },
    {
      id: "2",
      coordinates: [-118.2437, 34.0522] as [number, number],
      title: "Los Angeles",
      description: "City of Angels",
    },
    {
      id: "3",
      coordinates: [-87.6298, 41.8781] as [number, number],
      title: "Chicago",
      description: "The Windy City",
    },
  ]

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Map Example</h1>
      
      <div className="h-[600px] w-full rounded-lg overflow-hidden border border-gray-200">
        <MapboxMap
          initialCenter={[-95.7129, 37.0902]} // Center of USA
          initialZoom={4}
          markers={markers}
          onMarkerClick={(markerId) => setSelectedMarker(markerId)}
          style="streets"
        />
      </div>

      {selectedMarker && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold">Selected Location:</h2>
          <p>{markers.find(m => m.id === selectedMarker)?.title}</p>
        </div>
      )}
    </div>
  )
} 