// Define types for the price data
interface PriceData {
  currency: string;
  products: Array<{
    [sku: string]: {
      name: string;
      price: number[] | number;
    }
  }>;
}

// Cache for price data to avoid multiple fetches
let priceCache: PriceData | null = null;

/**
 * Fetches price data from the CDN
 * @param currencyCode The country code (default: 'IN')
 */
export async function fetchPriceData(currencyCode: string = 'IN'): Promise<PriceData> {
  if (priceCache) return priceCache;
  
  try {
    const response = await fetch(`https://d1wxxs914x4wga.cloudfront.net/Currency/${currencyCode}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch price data for currency: ${currencyCode}`);
    }
    
    priceCache = await response.json() as PriceData;
    return priceCache;
  } catch (error) {
    console.error(`Error fetching price data:`, error);
    throw error;
  }
}

/**
 * Gets the price for a given SKU
 * @param sku The product SKU
 * @param useLowest Whether to return lowest price (true) or first price (false)
 * @param currencyCode The country code (default: 'IN')
 * @returns The price for the SKU or null if not found
 */
export async function getProductPrice(
  sku: string, 
  useLowest: boolean = true,
  currencyCode: string = 'IN'
): Promise<number | null> {
  try {
    const data = await fetchPriceData(currencyCode);
    
    // Look for the product with the matching SKU
    for (const product of data.products) {
      if (product[sku]) {
        const priceArray = product[sku].price;
        
        if (Array.isArray(priceArray) && priceArray.length > 0) {
          // Return either the lowest price or the first price
          return useLowest ? Math.min(...priceArray) : priceArray[0];
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting price for SKU ${sku}:`, error);
    return null;
  }
}

/**
 * Gets the lowest price for a given SKU
 * @param sku The product SKU
 * @param currencyCode The country code (default: 'IN')
 */
export async function getLowestPrice(sku: string, currencyCode: string = 'IN'): Promise<number | null> {
  return getProductPrice(sku, true, currencyCode);
}

/**
 * Gets the first price for a given SKU
 * @param sku The product SKU
 * @param currencyCode The country code (default: 'IN')
 */
export async function getFirstPrice(sku: string, currencyCode: string = 'IN'): Promise<number | null> {
  return getProductPrice(sku, false, currencyCode);
}