import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  baseUrl 
}: PaginationProps) {
  // Generate array of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Always show first page
    pageNumbers.push(1);
    
    // Current page and surrounding pages
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pageNumbers.push(i);
    }
    
    // Always show last page if there are more than 1 pages
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    // Add ellipsis indicators
    return pageNumbers.reduce((result: (number | string)[], pageNumber, index, array) => {
      result.push(pageNumber);
      
      // Add ellipsis if there's a gap
      if (index < array.length - 1 && array[index + 1] - pageNumber > 1) {
        result.push('...');
      }
      
      return result;
    }, []);
  };
  
  const pageNumbers = getPageNumbers();
  
// Helper function to generate URL preserving existing query parameters
const getPageUrl = (page: number) => {
  // Split baseUrl into path and search parts
  const [path, search = ''] = baseUrl.split('?');
  
  // Create a URLSearchParams object from existing search string
  const searchParams = new URLSearchParams(search);
  
  // Set the page parameter
  searchParams.set('page', page.toString());
  
  // Reconstruct the URL
  return `${path}?${searchParams.toString()}`;
};

  return (
    <div className="flex justify-center items-center gap-2">
      {/* Previous page button */}
      <Link href={currentPage > 1 ? getPageUrl(currentPage - 1) : '#'} 
            aria-disabled={currentPage <= 1}>
        <Button 
          variant="outline" 
          size="icon" 
          disabled={currentPage <= 1}
          className="border-[#563635]/20 text-[#563635] hover:bg-[#563635]/10"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </Link>
      
      {/* Page numbers */}
      {pageNumbers.map((pageNumber, index) => (
        pageNumber === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-[#563635]/70">...</span>
        ) : (
          <Link key={`page-${pageNumber}`} href={getPageUrl(pageNumber as number)}>
            <Button
              variant={currentPage === pageNumber ? "default" : "outline"}
              size="sm"
              className={currentPage === pageNumber 
                ? "bg-[#b7384e] hover:bg-[#b7384e]/90 text-white" 
                : "border-[#563635]/20 text-[#563635] hover:bg-[#563635]/10"}
            >
              {pageNumber}
            </Button>
          </Link>
        )
      ))}
      
      {/* Next page button */}
      <Link href={currentPage < totalPages ? getPageUrl(currentPage + 1) : '#'} 
            aria-disabled={currentPage >= totalPages}>
        <Button 
          variant="outline" 
          size="icon" 
          disabled={currentPage >= totalPages}
          className="border-[#563635]/20 text-[#563635] hover:bg-[#563635]/10"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}