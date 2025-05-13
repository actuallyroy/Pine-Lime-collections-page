// Map style interface
export interface MapStyle {
  Title: string;
  ID: string;
  image: string;
  styleId: string;
  styleIdLabelled: string;
  border: string;
}

// Default fallback styles if the fetch fails
export const defaultMapStyles = [
  { id: "streets-v12", name: "Streets", image: "/placeholder.svg?height=80&width=80&text=Streets" },
  { id: "satellite-v9", name: "Satellite", image: "/placeholder.svg?height=80&width=80&text=Satellite" },
  { id: "satellite-streets-v12", name: "Satellite Streets", image: "/placeholder.svg?height=80&width=80&text=Satellite+Streets" },
  { id: "outdoors-v12", name: "Outdoors", image: "/placeholder.svg?height=80&width=80&text=Outdoors" },
  { id: "light-v11", name: "Light", image: "/placeholder.svg?height=80&width=80&text=Light" },
  { id: "dark-v11", name: "Dark", image: "/placeholder.svg?height=80&width=80&text=Dark" },
];

// Fetch map styles from CDN
export async function fetchMapStyles(): Promise<MapStyle[]> {
  try {
    const response = await fetch('https://d1wxxs914x4wga.cloudfront.net/MapDesigns/design.json');
    if (!response.ok) {
      throw new Error('Failed to fetch map styles');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching map styles:', error);
    return [];
  }
}

// Get a specific style by ID
export function getStyleById(styles: MapStyle[], styleId: string): MapStyle | undefined {
  return styles.find(style => style.styleId === styleId);
}

// Get style image by style ID
export function getStyleImageById(styles: MapStyle[], styleId: string): string | null {
  const style = getStyleById(styles, styleId);
  return style ? style.image : null;
} 