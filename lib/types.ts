interface Prices {
  sku: string; // primary key
  name: string;
  min_price?: number; // Minimum price in inr
  max_price?: number; // Maximum price in inr
  [currency: string]: number[] | string | number | undefined;
}


interface Marker {
  markerId: string;
  markerSize: "L" | "M" | "S";
  markerLabel: string;
  markerCoordinates: [number, number];
  markerEmoji: string;
  markerLocation: [number, number];
  locationName: string;
}