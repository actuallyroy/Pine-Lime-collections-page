import { createClient } from "@supabase/supabase-js";
// Initialize the Supabase client (make sure your environment variables are set)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);

export interface CollectionItem {
  id: string;
  faq: null;
  sku: string;
  owner: string; // Assuming UUID string
  title: string;
  extras: any;
  keywords: string;
  description: string;
  created_date: string;
  product_code: "REWIND" | "MEMORY_MAP" | "REFLECTION" | "GAME" | "PAIGAAM" | "HAMPER" | "VINTAGE_POSTER" | "MUG" | "MAGNET" | "DECOR_MAP" | "JOURNEY_MAP" | "ROCKET_RUN";
  product_name: string;
  updated_date: string;
  collection_id: number;
  product_images: Array<{
    id: number;
    image_url: string;
    image_type: "primary" | "image1" | "image2";
    product_id: string; // Assuming UUID string
  }>;
  product_prices?: any; // Adjust according to your structure
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  keywords: string[];
}

export interface FilterOptions {
  priceRange?: {
    min?: number;
    max?: number;
  };
  skus?: string[]; // Filter by SKU
  productCodes?: string[]; // Filter by product_code
  keywords?: string[]; // Filter by keywords
  sortBy?: "price_asc" | "price_desc" | "newest" | "oldest"; // Sorting options
}

/**
 * Fetches a paginated collection by slug by calling the RPC function on the database.
 *
 * @param {string} slug - The slug for the collection.
 * @param {number} page - The page number (default: 1).
 * @param {number} pageSize - Items per page (default: 9).
 * @param {string} currency - The currency code (default: "inr").
 * @param {FilterOptions} filters - Optional filter options.
 * @param {"price_asc" | "price_desc" | "newest" | "oldest"} sortBy - Sorting option (default: "newest").
 * @returns {Promise<PaginatedResponse<CollectionItem> | null>}
 */
export async function getCollectionBySlug(
  slug: string,
  page: number = 1,
  pageSize: number = 9,
  currency: string = "inr",
  filters?: FilterOptions,
): Promise<PaginatedResponse<CollectionItem> | null> {  
  try {
    // Call the RPC function that does the work on the database side
    const { data, error } = await supabase.rpc("get_collection_by_slug", {
      p_slug: slug,
      p_page: page,
      p_page_size: pageSize,
      p_currency: currency,
      p_skus: filters?.skus ?? null,
      p_product_codes: filters?.productCodes ?? null,
      p_keywords: filters?.keywords ?? null,
      p_min_price: filters?.priceRange?.min ?? null,
      p_max_price: filters?.priceRange?.max ?? null,
      p_sort_by: filters?.sortBy,
    });
    
    if (error) {
      console.error("Error fetching collection:", error);
      return null;
    }

    // Depending on how Supabase returns the RPC result, you might need to extract the single row.
    // For example, if the RPC returns an array with one row:
    const result = Array.isArray(data) ? data[0] : data;

    // Map the returned key to your interface (if needed, e.g. "page_size" to "pageSize")
    // This example assumes your RPC returns: data, count, page, page_size, total_pages.
    return {
      data: result.data,
      count: result.count,
      page: result.page,
      pageSize: result.page_size,
      totalPages: result.total_pages,
      keywords: result.top_keywords
    };
  } catch (error) {
    console.error("Error fetching collection:", error);
    return null;
  }
}

/**
 * Fetches search suggestions based on user input using direct queries
 * 
 * @param {string} searchTerm - The partial search term entered by user
 * @param {number} limit - Maximum number of suggestions to return (default: 5)
 * @returns {Promise<string[]>} - Array of search suggestions
 */
export async function getSearchSuggestions(
  searchTerm: string,
  limit: number = 5
): Promise<string[]> {
  try {
    // Return empty array for empty or very short search terms
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }
    
    const term = searchTerm.trim().toLowerCase();
    
    // Direct query to find matching titles and keywords
    const { data, error } = await supabase
      .from('tags') // Limited it to collections only TODO: Include product suggestions in future
      .select('name')
      .or(`name.ilike.%${term}%`)
      .limit(limit * 2);  // Fetch more results than needed to account for filtering
    
    if (error) {
      console.error("Error fetching search suggestions:", error);
      return [];
    }
    
    // Extract and deduplicate suggestions from titles and keywords
    const suggestions = new Set<string>();
    
    if (data) {
      data.forEach(item => {
        if (item.name && item.name.toLowerCase().includes(term)) {
          suggestions.add(item.name);
        }
      });
    }
    
    return Array.from(suggestions).slice(0, limit);
  } catch (error) {
    console.error("Error in search suggestions:", error);
    return [];
  }
}


