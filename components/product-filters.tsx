import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"

export default function ProductFilters() {
  const categories = [
    "Memory Maps",
    "Journey Maps",
    "Pet Portraits",
    "Photo Sets",
    "Personalized Games",
    "Framed Pictures",
    "Magnets",
    "Mugs",
    "Milestone Maps",
    "Artworks",
    "Gift Hampers",
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-[#563635] mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center">
              <Checkbox
                id={category}
                className="border-[#563635]/30 data-[state=checked]:bg-[#b7384e] data-[state=checked]:border-[#b7384e]"
              />
              <label htmlFor={category} className="ml-2 text-sm text-[#563635]">
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#563635]/10 pt-6">
        <h3 className="text-sm font-medium text-[#563635] mb-3">Price Range</h3>
        <Slider defaultValue={[0, 100]} max={100} step={1} className="py-4" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#563635]">$0</span>
          <span className="text-sm text-[#563635]">$100</span>
        </div>
      </div>

      <div className="border-t border-[#563635]/10 pt-6">
        <h3 className="text-sm font-medium text-[#563635] mb-3">Shipping</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <Checkbox
              id="express"
              className="border-[#563635]/30 data-[state=checked]:bg-[#b7384e] data-[state=checked]:border-[#b7384e]"
            />
            <label htmlFor="express" className="ml-2 text-sm text-[#563635]">
              Express Delivery
            </label>
          </div>
          <div className="flex items-center">
            <Checkbox
              id="standard"
              className="border-[#563635]/30 data-[state=checked]:bg-[#b7384e] data-[state=checked]:border-[#b7384e]"
            />
            <label htmlFor="standard" className="ml-2 text-sm text-[#563635]">
              Standard Delivery
            </label>
          </div>
        </div>
      </div>

      <div className="border-t border-[#563635]/10 pt-6">
        <h3 className="text-sm font-medium text-[#563635] mb-3">Customization</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <Checkbox
              id="photo"
              className="border-[#563635]/30 data-[state=checked]:bg-[#b7384e] data-[state=checked]:border-[#b7384e]"
            />
            <label htmlFor="photo" className="ml-2 text-sm text-[#563635]">
              Photo Upload
            </label>
          </div>
          <div className="flex items-center">
            <Checkbox
              id="text"
              className="border-[#563635]/30 data-[state=checked]:bg-[#b7384e] data-[state=checked]:border-[#b7384e]"
            />
            <label htmlFor="text" className="ml-2 text-sm text-[#563635]">
              Text Customization
            </label>
          </div>
          <div className="flex items-center">
            <Checkbox
              id="color"
              className="border-[#563635]/30 data-[state=checked]:bg-[#b7384e] data-[state=checked]:border-[#b7384e]"
            />
            <label htmlFor="color" className="ml-2 text-sm text-[#563635]">
              Color Options
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

