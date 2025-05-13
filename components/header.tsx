import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import SearchInput from "@/components/search-input"

export default function Header () {
  return (      <header className="border-b border-[#563635]/10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="https://www.pinenlime.com" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Pine & Lime" width={32} height={40} className="h-10 w-auto" />
              <span className="text-2xl font-bold text-[#563635]">Pine & Lime</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="https://www.pinenlime.com" className="text-[#563635] hover:text-[#b7384e] transition-colors">
                Home
              </Link>
              <Link href="/collections/all-gifts" className="text-[#b7384e] font-medium">
                Products
              </Link>
              <Link href="https://www.pinenlime.com/FAQs" className="text-[#563635] hover:text-[#b7384e] transition-colors">
                FAQs
              </Link>
              <Link href="https://www.pinenlime.com/contact-us" className="text-[#563635] hover:text-[#b7384e] transition-colors">
                Contact
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block w-80">
                <SearchInput />
              </div>
              <Link href="https://www.pinenlime.com/shoppingcart" className="hidden md:flex items-center gap-2">
                <Button className="bg-[#b7384e] hover:bg-[#b7384e]/90 text-white">Cart</Button>
              </Link>
            </div>
          </div>
        </header>)
}