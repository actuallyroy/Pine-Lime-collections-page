import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const products = [
  {
    id: 1,
    name: "Memory Maps",
    description: "Custom maps highlighting special locations and memories",
    price: 49.99,
    originalPrice: 59.99,
    image: "/placeholder.svg?height=300&width=300",
    purchaseCount: 1245,
    discount: 15,
  },
  {
    id: 2,
    name: "Journey Maps",
    description: "Visualize your travels and adventures in a beautiful custom map",
    price: 59.99,
    originalPrice: 69.99,
    image: "/placeholder.svg?height=300&width=300",
    purchaseCount: 987,
    discount: 10,
  },
  {
    id: 3,
    name: "Pet Portraits",
    description: "Custom artwork featuring your beloved pets",
    price: 39.99,
    originalPrice: 49.99,
    image: "/placeholder.svg?height=300&width=300",
    purchaseCount: 2156,
    discount: 20,
  },
  {
    id: 4,
    name: "Rewind",
    description: "Custom photo sets that capture your special moments",
    price: 29.99,
    originalPrice: 34.99,
    image: "/placeholder.svg?height=300&width=300",
    purchaseCount: 1876,
    discount: 15,
  },
  {
    id: 5,
    name: "Whack-a-me",
    description: "Personalized games featuring you and your loved ones",
    price: 34.99,
    originalPrice: 39.99,
    image: "/placeholder.svg?height=300&width=300",
    purchaseCount: 654,
    discount: 10,
  },
  {
    id: 6,
    name: "Reflection",
    description: "Beautifully framed pictures with custom designs",
    price: 44.99,
    originalPrice: 54.99,
    image: "/placeholder.svg?height=300&width=300",
    purchaseCount: 1432,
    discount: 20,
  },
  {
    id: 7,
    name: "Personalized Magnets",
    description: "Custom magnets featuring your photos and designs",
    price: 19.99,
    originalPrice: 24.99,
    image: "/placeholder.svg?height=300&width=300",
    purchaseCount: 3245,
    discount: 20,
  },
  {
    id: 8,
    name: "Coffee Mugs",
    description: "Custom mugs with your photos and messages",
    price: 24.99,
    originalPrice: 29.99,
    image: "/placeholder.svg?height=300&width=300",
    purchaseCount: 4532,
    discount: 15,
  },
  {
    id: 9,
    name: "Milestone Maps",
    description: "Celebrate important life events with custom milestone maps",
    price: 54.99,
    originalPrice: 64.99,
    image: "/placeholder.svg?height=300&width=300",
    purchaseCount: 876,
    discount: 15,
  },
  {
    id: 10,
    name: "Custom Artworks",
    description: "Unique artworks created from your photos and memories",
    price: 69.99,
    originalPrice: 79.99,
    image: "/placeholder.svg?height=300&width=300",
    purchaseCount: 1098,
    discount: 10,
  },
  {
    id: 11,
    name: "Gift Hampers",
    description: "Curated gift sets including a tote bag and chocolates",
    price: 89.99,
    originalPrice: 109.99,
    image: "/placeholder.svg?height=300&width=300",
    purchaseCount: 765,
    discount: 20,
  },
]

export default function ProductGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden border-[#563635]/10 hover:shadow-md transition-shadow">
          <div className="aspect-square relative bg-white">
            <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover p-4" />
            <div className="absolute top-2 left-2 flex flex-col gap-2">
              <Badge className="bg-[#b7384e] hover:bg-[#b7384e] text-white">{product.discount}% OFF</Badge>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-lg font-semibold text-[#563635]">{product.name}</h3>
              <Badge variant="outline" className="border-[#563635]/30 text-[#563635] text-xs">
                {product.purchaseCount.toLocaleString()}+ bought
              </Badge>
            </div>
            <p className="text-[#563635]/70 text-sm mb-2">{product.description}</p>
            <div className="flex items-center gap-2">
              <p className="text-[#b7384e] font-bold">${product.price.toFixed(2)}</p>
              <p className="text-[#563635]/60 text-sm line-through">${product.originalPrice.toFixed(2)}</p>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex gap-2">
            <Button className="w-full bg-[#b7384e] hover:bg-[#b7384e]/90 text-white">Add to Cart</Button>
            <Button variant="outline" className="border-[#563635]/20 text-[#563635] hover:bg-[#563635]/5">
              Details
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

