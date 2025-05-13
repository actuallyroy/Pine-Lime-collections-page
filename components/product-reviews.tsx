import { Star, ThumbsUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const reviews = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: "SJ",
    rating: 5,
    date: "August 15, 2023",
    title: "Perfect anniversary gift!",
    content:
      "I ordered a Memory Map of where my husband and I first met for our anniversary. The quality is amazing and the customization options were exactly what I wanted. My husband absolutely loved it and it's now hanging in our living room. Shipping was fast too!",
    helpful: 24,
    verified: true,
  },
  {
    id: 2,
    name: "Michael Chen",
    avatar: "MC",
    rating: 4,
    date: "July 3, 2023",
    title: "Beautiful map, minor sizing issue",
    content:
      "The map itself is gorgeous and the quality is excellent. I chose the vintage style and it looks even better in person. The only reason I'm giving 4 stars instead of 5 is because the size was slightly smaller than I expected. Still, it's a beautiful piece and I'm happy with my purchase.",
    helpful: 12,
    verified: true,
  },
  {
    id: 3,
    name: "Emma Wilson",
    avatar: "EW",
    rating: 5,
    date: "June 21, 2023",
    title: "Exceeded my expectations",
    content:
      "I bought this as a gift for my boyfriend to commemorate our first date location. The customer service was incredible - they helped me find the exact spot when I wasn't sure of the address. The map arrived quickly and was packaged securely. The quality is outstanding and my boyfriend was genuinely moved when he opened it. Will definitely order from Pine & Lime again!",
    helpful: 31,
    verified: true,
  },
]

export default function ProductReviews() {
  return (
    <div className="bg-white p-6 rounded-lg border border-[#563635]/10">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h3 className="text-xl font-semibold text-[#563635] mb-4">Customer Reviews</h3>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-5 w-5 ${i < 4 ? "fill-[#b7384e] text-[#b7384e]" : "text-[#563635]/30"}`} />
              ))}
            </div>
            <span className="text-lg font-medium text-[#563635]">4.0</span>
            <span className="text-sm text-[#563635]/70">out of 5</span>
          </div>
          <p className="text-sm text-[#563635]/70 mb-6">Based on 128 reviews</p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <span className="text-sm text-[#563635]/70 w-6">5</span>
                <Star className="h-4 w-4 fill-[#b7384e] text-[#b7384e]" />
              </div>
              <Progress value={65} className="h-2 flex-1" />
              <span className="text-sm text-[#563635]/70 w-8">65%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <span className="text-sm text-[#563635]/70 w-6">4</span>
                <Star className="h-4 w-4 fill-[#b7384e] text-[#b7384e]" />
              </div>
              <Progress value={25} className="h-2 flex-1" />
              <span className="text-sm text-[#563635]/70 w-8">25%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <span className="text-sm text-[#563635]/70 w-6">3</span>
                <Star className="h-4 w-4 fill-[#b7384e] text-[#b7384e]" />
              </div>
              <Progress value={7} className="h-2 flex-1" />
              <span className="text-sm text-[#563635]/70 w-8">7%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <span className="text-sm text-[#563635]/70 w-6">2</span>
                <Star className="h-4 w-4 fill-[#b7384e] text-[#b7384e]" />
              </div>
              <Progress value={2} className="h-2 flex-1" />
              <span className="text-sm text-[#563635]/70 w-8">2%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <span className="text-sm text-[#563635]/70 w-6">1</span>
                <Star className="h-4 w-4 fill-[#b7384e] text-[#b7384e]" />
              </div>
              <Progress value={1} className="h-2 flex-1" />
              <span className="text-sm text-[#563635]/70 w-8">1%</span>
            </div>
          </div>

          <Button className="w-full mt-6 bg-[#b7384e] hover:bg-[#b7384e]/90 text-white">Write a Review</Button>
        </div>

        <div className="md:col-span-2">
          <div className="space-y-6">
            {reviews.map((review, index) => (
              <div key={review.id}>
                {index > 0 && <Separator className="my-6 bg-[#563635]/10" />}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarFallback className="bg-[#563635]/10 text-[#563635]">{review.avatar}</AvatarFallback>
                        <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${review.avatar}`} />
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#563635]">{review.name}</span>
                          {review.verified && (
                            <span className="text-xs bg-[#563635]/10 text-[#563635] px-2 py-0.5 rounded-full">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#563635]/70">{review.date}</div>
                      </div>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? "fill-[#b7384e] text-[#b7384e]" : "text-[#563635]/30"}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-[#563635]">{review.title}</h4>
                    <p className="mt-1 text-[#563635]/80">{review.content}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 border-[#563635]/20 text-[#563635] hover:bg-[#563635]/5"
                    >
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      Helpful ({review.helpful})
                    </Button>
                    <Button variant="link" size="sm" className="text-xs h-8 text-[#563635]/70 hover:text-[#b7384e]">
                      Report
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button variant="outline" className="border-[#563635]/20 text-[#563635] hover:bg-[#563635]/5">
              Load More Reviews
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

