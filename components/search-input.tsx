"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { getSearchSuggestions } from "@/lib/supabase/collections";
import { useDebounce } from "@/lib/hooks/use-debounce"; // Now using correct path with extension

export default function SearchInput() {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch suggestions when search term changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await getSearchSuggestions(debouncedSearchTerm);
        setSuggestions(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchTerm]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (term: string) => {
    if (!term.trim()) return;
    router.push(`/collections/${term.toLocaleLowerCase().replace(/\s+/g, "-")}`);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(searchTerm);
    }
  };

  return (
    <div className="relative w-full" ref={suggestionsRef}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#563635]/50" />
      <Input
        type="search"
        placeholder="Search products..."
        className="w-full bg-white pl-8 border-[#563635]/20 focus-visible:ring-[#b7384e]"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
      />
      
      {showSuggestions && (searchTerm.length >= 2) && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-2 text-sm text-gray-500">Loading...</div>
          ) : suggestions.length > 0 ? (
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li 
                  key={index}
                  className="mx-4 my-2 text-sm text-[#563635] hover:bg-[#fcf8ed] cursor-pointer"
                  onClick={() => {
                    setSearchTerm(suggestion);
                    handleSearch(suggestion);
                  }}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-2 text-sm text-gray-500">No suggestions found</div>
          )}
        </div>
      )}
    </div>
  );
}