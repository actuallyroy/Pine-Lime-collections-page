import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const relatedProducts = [
  {
    id: 1,
    name: "Journey Maps",
    description: "Visualize your travels and adventures",
    price: 59.99,
    originalPrice: 69.99,
    image: "/placeholder.svg?height=300&width=300",
    purchaseCount: 987,
    discount: 10,
  },
  {
    id: 2,
    name: "Milestone Maps",
    description: "Celebrate important life events",
    price: 54.99,
    originalPrice: 64.99,
    image: "/placeholder.svg?height=300&width=300",
    purchaseCount: 876,
    discount: 15,
  },
  {
    id: 3,
    name: "Custom Artworks",
    description: "Unique artworks from your photos",
    price: 69.99,
    originalPrice: 79.99,
    image: "/placeholder.svg?height=300&width=300",
    purchaseCount: 1098,
    discount: 10,
  },
  {
    id: 4,
    name: "Pet Portraits",
    description: "Custom artwork of your beloved pets",
    price: 39.99,
    originalPrice: 49.99,
    image: "/placeholder.svg?height=300&width=300",
    purchaseCount: 2156,
    discount: 20,
  },
]

export default function RelatedProducts() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {relatedProducts.map((product) => (
        <Link href="#" key={product.id}>
          <Card className="overflow-hidden border-[#563635]/10 hover:shadow-md transition-shadow h-full">
            <div className="aspect-square relative bg-white">
              <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-contain p-4" />
              <div className="absolute top-2 left-2">
                <Badge className="bg-[#b7384e] hover:bg-[#b7384e] text-white">{product.discount}% OFF</Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-[#563635]">{product.name}</h3>
                <Badge variant="outline" className="border-[#563635]/30 text-[#563635] text-xs">
                  {product.purchaseCount.toLocaleString()}+
                </Badge>
              </div>
              <p className="text-[#563635]/70 text-sm mb-2">{product.description}</p>
              <div className="flex items-center gap-2">
                <p className="text-[#b7384e] font-bold">${product.price.toFixed(2)}</p>
                <p className="text-[#563635]/60 text-sm line-through">${product.originalPrice.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

