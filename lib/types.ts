interface Prices {
    sku: string; // primary key
    name: string;
    min_price?: number; // Minimum price in inr
    max_price?: number; // Maximum price in inr
    [currency: string]: number[] | string | number | undefined;
  }
  