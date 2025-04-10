import { supabase } from "./client";

interface Prices {
  sku: string; // primary key
  name: string;
  min_price?: number; // Minimum price in inr
  max_price?: number; // Maximum price in inr
  [currency: string]: number[] | string | number | undefined;
}

enum Currency {
  INR = "inr",
  USD = "usd",
  AED = "aed",
  GBP = "gbp",
  EUR = "eur",
  AUD = "aud",
  CAD = "cad",
}

export async function getPrices(currency: Currency = Currency.INR): Promise<Prices[]> {
  const { data, error } = await supabase
    .from("product_prices")
    .select(`sku, name, ${currency}`)
    .order("sku", { ascending: true });

  if (error) {
    console.error("Error fetching prices:", error);
    return [];
  }

  return data as unknown as Prices[];
}

export async function getPricesFromSkus(currency: Currency = Currency.INR, skus: string[]): Promise<Prices[]> {
  // sort by prices in ascending order
  const { data, error } = await supabase
    .from("product_prices")
    .select("*")
    .in("sku", skus)
    .order(currency, { ascending: true });

  if (error) {
    console.error("Error fetching prices:", error);
    return [];
  }

  return data as Prices[];
}
