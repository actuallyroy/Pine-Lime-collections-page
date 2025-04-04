// api key: IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcImQxZTdiYmViLWI0M2ItNDI0Ni05YTczLWJjYTY5NWNlMzA3M1wiLFwiaWRlbnRpdHlcIjp7XCJ0eXBlXCI6XCJhcHBsaWNhdGlvblwiLFwiaWRcIjpcIjA0NzQ2NTc3LTE2YWItNGJmNy1hZWNkLTY2MTAwMjVhOGUzNVwifSxcInRlbmFudFwiOntcInR5cGVcIjpcImFjY291bnRcIixcImlkXCI6XCJjMjkxNTE5OS0zZDdkLTQ1YWMtOTcxOS1jOGVkNDc0ZGE3MDFcIn19IiwiaWF0IjoxNzQzMzk5NDI5fQ.TBtOP5nlfzjBKUglbQqyN2imKEUC_O4ZQe0ALz7tDVQ5KrsCG-SRJKig2PAynjAA2T9GpL82QlnC6xu0902BNzKzMD9wNZGD7ifReVxjtzuletTbJz7FYq-pJkf4YKd38FNTMczPq9fnOpmYwHPegCUa0tBaE7BRNhdfgzemt2bh_PIinHgcwbXfFaqQDNZOAFM7HHFkjJxxgm1CHRPJI2KWy7HfJCn5sR7B2YTW_bPVu1z8E-Q_pKV2KWY1keOvUt7kUWQjrWZyabRi_md9nfi5kNhDuRR-Q1TZ9Rj8jSZ2M13b01uo2o9uonpmG1EgapRWpMlWo9VirfxwFA_Mrg
// lib/wixCms.ts

export interface Collection {
    id: string;
    title: string;
    sku: string;
    productImage: string;
    image1: string;
    image2: string;
    description: string;
    productName: string;
    ctaButtonText: string;
    tags: string[]; // Assuming tags is returned as an array
    product: string;
    slug: string; // Corresponds to "link-collections-1-title"
    extras: any;   // Adjust type if you have a defined structure
    _createdDate: string;
    _updatedDate: string;
    keywords: string;
    hamperProducts: string[];           // References to other products
    Collections_hamperProducts: string[]; // References from hamper products
  }
  
  /**
   * Fetches collection data from Wix CMS using its REST API by slug.
   *
   * @param slug The URL slug for the collection.
   * @returns A Collection object if found, otherwise null.
   */
  export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
    // Retrieve your Wix API configuration from environment variables
    const API_KEY = process.env.WIX_API_KEY;
    const BASE_URL = process.env.WIX_CMS_BASE_URL; // e.g., "https://www.wixapis.com/cms/v1"
  
    if (!API_KEY || !BASE_URL) {
      throw new Error("Wix API key or Base URL is not configured in environment variables.");
    }
  
    // Construct the API endpoint URL.
    // (This example assumes a query parameter; adjust based on your Wix API specification.)
    //https://www.wixapis.com/wix-data/v2/items/5331fc15-9441-4fd4-bc7b-7f6870c69228?dataCollectionId=cities
    const url = `${BASE_URL}/37d73332-0424-49ac-bcc5-378a3456c27c/dataCollectionId=collections`;
  
    const response = await fetch(url, {
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json',
      },
    });
  
    if (!response.ok) {
      console.error("Error fetching collection data:", await response.text());
      return null;
    }
  
    const data = await response.json();
  
    // Assuming your API returns an object with an "items" array.
    if (!data.items || data.items.length === 0) {
      return null;
    }
  
    const item = data.items[0];
  
    // Map the API response to your Collection interface.
    const collection: Collection = {
      id: item.id,
      title: item.title,
      sku: item.sku,
      productImage: item.productImage,
      image1: item.image1,
      image2: item.image2,
      description: item.description,
      productName: item.productName,
      ctaButtonText: item.ctaButtonText,
      tags: item.tags,
      product: item.product,
      slug: item["link-collections-1-title"],
      extras: item.extras,
      _createdDate: item._createdDate,
      _updatedDate: item._updatedDate,
      keywords: item.keywords,
      hamperProducts: item.hamperProducts,
      Collections_hamperProducts: item.Collections_hamperProducts,
    };
  
    return collection;
  }
  