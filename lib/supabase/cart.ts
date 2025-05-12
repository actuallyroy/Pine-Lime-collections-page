import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

[
  {
    "quantity": 1,
    "order_id": "1bd16ad0-a4c5-4d80-ad1d-d1136653a4af",
    "sku": "000211-0024",
    "description": "3 x 3 inches\nSquare Shaped Fridge Magnet",
    "frameSize": "Fridge Magnet",
    "product_image": "wix:image://v1/c29151_b9d7febf917c4968979027277aef35e4~mv2.png/Hodophile%20Magnet%202.png#originWidth=1200&originHeight=1000",
    "id": "eee8c3c4-ae7a-4252-b1eb-ee0e80895f1d",
    "cost": "149",
    "product_id": "Hodophile Fridge Magnet",
    "collectionItemId": "Hodophile Fridge Magnet",
    "category": "Magnets",
    "title": "Hodophile Fridge Magnet",
    "frameColor": "Natural",
    "product": "MAGNET"
  }
]

export interface Product {
  order_id: string; // uuid
  product_id: string; // uuid
  id: string; // uuid
  title: string; // name of the product
  description: string; // description of the product
  product_image: string; // URL of the product image
  frameSize: string; // size of the product
  frameColor: string; // color of the product
  category?: string; // category of the product
  price: number; // price of the product
  quantity: number; // quantity of the product in cart
  sku: string; // SKU of the product
  product: string; // type of the product (e.g., MAGNET)
  [key: string]: any; // additional properties
}

// Define types for cart items
export interface Cart {
  title?: string; // 
  userId?: string; // uuid
  products? : any; // json
  status?: string; // enum('CART', 'PAID', 'CANCELLED')
  userEmail: any; // json
  address: any; // json
  cart_id: string // uuid / primary key
  paymentOrderData?: any; // json
  paymentVerificationData: any; // json
  sender: any; // json
  order_date: string; // timestamp with time zone
  totals: any; // json
}

/**
 * Add an item to the cart
 * @param item CartItem to add to the cart
 * @returns Promise with the added item data or error
 */
export async function addToCart(item: CartItem): Promise<{ data: any; error: any }> {
  try {
    // Check if the item already exists in the cart for the user
    const { data: existingItem, error: fetchError } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', item.user_id)
      .eq('product_id', item.product_id)
      .eq('variant_id', item.variant_id || '')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Error other than "no rows returned"
      return { data: null, error: fetchError };
    }

    if (existingItem) {
      // Item exists, update the quantity
      const { data, error } = await supabase
        .from('cart')
        .update({ quantity: existingItem.quantity + item.quantity })
        .eq('id', existingItem.id)
        .select();

      return { data, error };
    } else {
      // Item doesn't exist, insert new row
      const { data, error } = await supabase
        .from('cart')
        .insert([item])
        .select();

      return { data, error };
    }
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return { data: null, error };
  }
}

/**
 * Remove an item from the cart
 * @param userId User ID
 * @param itemId Cart item ID to remove
 * @returns Promise with the operation result
 */
export async function removeFromCart(userId: string, itemId: string) {
  try {
    const { data, error } = await supabase
      .from('cart')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    return { data, error };
  } catch (error) {
    console.error('Error removing item from cart:', error);
    return { data: null, error };
  }
}

/**
 * Get a user's cart items
 * @param userId User ID
 * @returns Promise with the user's cart items
 */
export async function getCartItems(userId: string) {
  try {
    const { data, error } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', userId);

    return { data, error };
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return { data: null, error };
  }
}
