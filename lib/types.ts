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

interface MapData {
  mapStyle: string,
  mapZoom: number,
  routeType: "air" | "road" | "none",
  routeColor: string,
  mapBearing: number,
  mapCenter: [number, number],
  title: string | null,
  mapType: "custom" | "fit" | "split",
  markers: Marker[],
};

interface ProductData {
  order_id: string,
  quantity: number,
  sku: string,
  description: string,
  title: string,
  gifttext: string,
  gift: boolean,
  frameSize: string,
  promptData: Record<string, any>,
  cost: string,
  map_type: "journeymap",
  product_id: string,
  frameColor: string,
  mapData: MapData,
  product: "JOURNEY_MAP",
  s3Links: {
    postUrl: string,
    objectURL: string
  }
};