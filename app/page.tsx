import { Filter, Search } from "lucide-react"
import Link from "next/link"
import ProductGrid from "@/components/product-grid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import ProductFilters from "@/components/product-filters"
import Image from "next/image"

export default function ProductsPage() {
  return (
    <div className="bg-[#fcf8ed] min-h-screen">
      <header className="border-b border-[#563635]/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Pine & Lime" width={32} height={40} className="h-10 w-auto" />
            <span className="text-2xl font-bold text-[#563635]">Pine & Lime</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-[#563635] hover:text-[#b7384e] transition-colors">
              Home
            </Link>
            <Link href="/products" className="text-[#b7384e] font-medium">
              Products
            </Link>
            <Link href="/about" className="text-[#563635] hover:text-[#b7384e] transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-[#563635] hover:text-[#b7384e] transition-colors">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#563635]/50" />
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full bg-white pl-8 border-[#563635]/20 focus-visible:ring-[#b7384e]"
              />
            </div>
            <Button variant="outline" className="border-[#b7384e] text-[#b7384e] hover:bg-[#b7384e] hover:text-white">
              Sign In
            </Button>
            <Button className="bg-[#b7384e] hover:bg-[#b7384e]/90 text-white">Cart (0)</Button>
          </div>
        </div>
      </header>

      <div className="bg-[#563635] text-white py-10 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Birthday Gifts for Boyfriend</h1>
            <p className="text-white/90 text-lg mb-6">
              Find the perfect birthday gift that will make his day unforgettable and strengthen your bond.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white/10 p-6 rounded-lg">
                <h3 className="font-semibold text-xl mb-2">Memory Maps</h3>
                <p className="text-white/80 mb-4">
                  "I got my boyfriend a map of where we first met. He actually teared up and immediately hung it in his
                  apartment!"
                  <span className="block mt-2 text-sm italic">— Sarah, 27</span>
                </p>
              </div>

              <div className="bg-white/10 p-6 rounded-lg">
                <h3 className="font-semibold text-xl mb-2">Journey Maps</h3>
                <p className="text-white/80 mb-4">
                  "I created a map of all our road trips together. Two years later, it's still his favorite possession."
                  <span className="block mt-2 text-sm italic">— Michael, 31</span>
                </p>
              </div>

              <div className="bg-white/10 p-6 rounded-lg">
                <h3 className="font-semibold text-xl mb-2">Custom Artwork</h3>
                <p className="text-white/80 mb-4">
                  "The portrait of him with his dog was perfect. He said it was the most thoughtful gift he's ever
                  received."
                  <span className="block mt-2 text-sm italic">— Emma, 24</span>
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Button className="bg-[#b7384e] hover:bg-[#b7384e]/90 text-white px-8 py-6 text-lg">
                Find His Perfect Gift
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-64 lg:w-72">
            <div className="hidden md:block">
              <h2 className="text-xl font-semibold text-[#563635] mb-4">Filters</h2>
              <ProductFilters />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden w-full mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#fcf8ed]">
                <h2 className="text-xl font-semibold text-[#563635] mb-4">Filters</h2>
                <ProductFilters />
              </SheetContent>
            </Sheet>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-[#563635]">Our Products</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#563635]/70">Sort by:</span>
                <select className="text-sm border rounded-md border-[#563635]/20 px-2 py-1 bg-white">
                  <option>Popularity</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest</option>
                </select>
              </div>
            </div>
            <p className="text-[#563635]/80 mb-8">
              Discover our unique, personalized gifts that help relive happy memories with friends and family. All
              products are manufactured internally and shipped worldwide within 7 days.
            </p>
            <ProductGrid />
          </div>
        </div>
      </div>

      <footer className="bg-[#563635] text-white mt-16 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center mb-8">
            <Image src="/logo.png" alt="Pine & Lime" width={48} height={60} className="h-16 w-auto mb-4 invert" />
            <h2 className="text-2xl font-bold">Pine & Lime</h2>
            <p className="text-white/80 text-center max-w-xl mt-2">
              Bringing cherished memories to life through unique, personalized gifts that spread joy and deepen
              connections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/20 pt-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#b7384e]"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                Contact Us
              </h3>
              <div className="space-y-2 text-white/80">
                <p className="flex items-start gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-1 shrink-0"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>Delhi: Street Number 1, Jaitpur, New Delhi, Delhi 110044</span>
                </p>
                <p className="flex items-start gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-1 shrink-0"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>New York: 228 Park Ave S, PMB 92217, New York, NY 10003-1502</span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#b7384e]"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                Policies
              </h3>
              <ul className="space-y-2 text-white/80">
                <li>• Auto-delete of uploaded images within 30 days</li>
                <li>• No social media posts without consent</li>
                <li>• Dispatch within 24 hours using express delivery</li>
                <li>• Easy online customization in simple steps</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#b7384e]"
                >
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                  <line x1="4" x2="4" y1="22" y2="15"></line>
                </svg>
                Customer Highlights
              </h3>
              <div className="space-y-2 text-white/80">
                <p>• Over 50,000 memories shared worldwide</p>
                <p>• Average rating of 4.7 to 4.9 out of 5</p>
                <p>• Recognized for speed, quality, and satisfaction</p>
                <p>• Worldwide shipping within 7 days</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60">
            <div className="flex justify-center gap-6 mb-4">
              <a href="#" className="hover:text-white transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
            </div>
            <p>© {new Date().getFullYear()} Pine & Lime. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

