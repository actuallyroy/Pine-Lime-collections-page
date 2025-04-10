"use client";
import { getCollectionBySlug } from "@/lib/supabase/collections";
import { useEffect } from "react";

export default function Test() {
  const slug = "gifts-for-boyfriend"; // Replace with your actual slug
  const page = 1; // Replace with your actual page number
  const pageSize = 10; // Replace with your actual page size
  const currency = "inr"; // Replace with your actual currency
  const filters = {}
  const sortBy = "price_asc"; // Replace with your actual sort option

  useEffect(() => {
    const fetchCollection = async () => {
      debugger
      const collectionData = await getCollectionBySlug(slug, page, pageSize, currency, filters);
      console.log("Collection Data:", collectionData);
    };

    fetchCollection();
  }, []); // Empty dependency array to run once on mount
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Test Page</h1>
      <p className="text-lg">This is a test page.</p>
    </div>
  );
}
