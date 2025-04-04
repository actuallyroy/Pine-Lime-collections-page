import { createClient } from "@supabase/supabase-js";
import { UUID } from "crypto";
import { fetchPriceData } from "./prices"; // Import the fetchPriceData function

// Initialize the Supabase client (make sure your environment variables are set)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);

interface collection {
  id: string;
  faq: null;
  sku: string;
  owner: UUID;
  title: string;
  extras: any;
  keywords: string;
  description: string;
  created_date: string;
  product_code: "REWIND" | "MEMORY_MAP" | "REFLECTION" | "GAME" | "PAIGAAM" | "HAMPER" | "VINTAGE_POSTER" | "MUG" | "MAGNET" | "DECOR_MAP" | "JOURNEY_MAP" | "ROCKET_RUN";
  product_name: string;
  updated_date: string;
  collection_id: number;
  product_images: [
    {
      id: number;
      image_url: string;
      image_type: "primary" | "image1" | "image2";
      product_id: UUID;
    }
  ];
  cta_button_text: string;
  price?: number; // Add price field
}

interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Add this interface after your existing interfaces
interface FilterOptions {
  priceRange?: {
    min?: number;
    max?: number;
  };
  skus?: string[]; // Filter by SKU
  productCodes?: Array<string>; // Filter by product_code
  keywords?: string[]; // Filter by keywords
  sortBy?: "price_asc" | "price_desc" | "newest" | "oldest"; // Sorting options
  // Add more filter options as needed
}

/**
 * Fetches a paginated collection (by slug) with its related products and images
 *
 * @param {string} slug - The slug for the collection
 * @param {number} page - The page number (default: 1)
 * @param {number} pageSize - Items per page (default: 9)
 * @param {FilterOptions} filters - Optional filters to apply to the results
 * @returns {Promise<PaginatedResponse<collection> | null>} Paginated collection data
 */
export async function getCollectionBySlug(slug: string, page: number = 1, pageSize: number = 9, currency = "IN", filters?: FilterOptions): Promise<PaginatedResponse<collection> | null> {
  try {
    const priceData = await fetchPriceData(currency);
    let filteredSkus: string[] = [];
    // filter skus based on filters.priceRange
    if (filters && filters.priceRange) {
      priceData.products.forEach((item) => {
        Object.keys(item).forEach((key) => {
          if (Array.isArray(item[key].price)) {
            const minPrice = Math.min(...item[key].price);
            const maxPrice = Math.max(...item[key].price);
            if (minPrice >= (filters.priceRange?.min ?? 0) && maxPrice <= (filters.priceRange?.max ?? Infinity)) {
              filteredSkus.push(key);

            }
          }else{
            if (item[key].price >= (filters.priceRange?.min ?? 0) && item[key].price <= (filters.priceRange?.max?? Infinity)) {
              filteredSkus.push(key);
            }
          }
        });
      });
    }

    console.log(filteredSkus);
    

    // Format the tag name from slug
    const tagName = slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Get the tag first
    const { data: tagData, error: tagError } = await supabase.from("tags").select("id").eq("name", tagName).single();

    if (tagError) throw tagError;

    // Start building our query
    let query = supabase
      .from("products")
      .select(
        `
        *,
        product_images(*),
        product_tags!inner(*)
      `,
        { count: "exact" }
      )
      .eq("product_tags.tag_id", tagData.id);

    // Apply filters for skus
    if (filteredSkus && filteredSkus.length > 0) {
      query = query.in("sku", filteredSkus);
    }

    // // Apply database-level filters if available
    if (filters?.productCodes && filters.productCodes.length > 0) {
      query = query.in("product_code", filters.productCodes);
    }

    if (filters?.keywords && filters.keywords.length > 0) {
      // For each keyword, check if it's in the product's keywords field
      filters.keywords.forEach((keyword) => {
        query = query.ilike("keywords", `%${keyword}%`);
      });
    }

    // Calculate start and end for range - apply after filters but before in-memory filters
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize - 1;

    // Apply pagination
    const { data: queriedProducts, error: productsError, count: count } = await query.range(startIndex, endIndex);


    if (productsError) throw productsError;

    const products = queriedProducts.map((product) => {
      // find the minimum price from the priceData for the product's SKU
      const productPriceData = priceData.products.find((item) => item[product.sku]);
      let productPrice = 0;
      if(productPriceData && Array.isArray(productPriceData[product.sku]?.price)){
        productPrice = Math.min(...productPriceData[product.sku].price as number[]);
      }else{
        productPrice = productPriceData ? productPriceData[product.sku].price as number : 0;
      }

      return {
        ...product,
        price: productPrice, // Set the price to the calculated value
      };
    });


    // Additional in-memory filtering can be applied here if needed

    return {
      data: products,
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  } catch (error) {
    console.error("Error fetching collection by slug:", error);
    return null;
  }
}
