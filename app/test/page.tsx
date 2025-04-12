'use client'
import { getCollectionBySlug } from "@/lib/supabase/collections";
import { useEffect } from "react";

export default function Test() {
  useEffect(() => {
    (async () => {
      const products = await getCollectionBySlug("all-gifts")
      console.log(products)
    })()

  }, [])
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Test Page</h1>
      <p className="text-lg">This is a test page.</p>
    </div>
  );
}
