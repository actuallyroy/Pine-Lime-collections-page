import { Search } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ProductHeader() {
  return (
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
  )
}

