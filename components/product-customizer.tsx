"use client"

import { useState } from "react"
import { Check, MapPin } from "lucide-react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function ProductCustomizer() {
  const [size, setSize] = useState("medium")
  const [frame, setFrame] = useState("none")
  const [style, setStyle] = useState("classic")

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-[#563635] mb-3">Size</h3>
        <RadioGroup value={size} onValueChange={setSize} className="flex flex-wrap gap-3">
          {[
            { value: "small", label: "8×10″", price: "$49.99" },
            { value: "medium", label: "11×14″", price: "$59.99" },
            { value: "large", label: "16×20″", price: "$79.99" },
            { value: "xlarge", label: "24×36″", price: "$99.99" },
          ].map((option) => (
            <Label
              key={option.value}
              htmlFor={`size-${option.value}`}
              className={`flex items-center justify-between px-4 py-3 border rounded-md cursor-pointer ${
                size === option.value
                  ? "border-[#b7384e] bg-[#b7384e]/5"
                  : "border-[#563635]/20 hover:border-[#563635]/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem id={`size-${option.value}`} value={option.value} className="sr-only" />
                {size === option.value && <Check className="h-4 w-4 text-[#b7384e]" />}
                <span className={size === option.value ? "text-[#b7384e]" : "text-[#563635]"}>{option.label}</span>
              </div>
              <span className={`text-sm ${size === option.value ? "text-[#b7384e]" : "text-[#563635]/70"}`}>
                {option.price}
              </span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <div>
        <h3 className="text-lg font-medium text-[#563635] mb-3">Frame</h3>
        <RadioGroup value={frame} onValueChange={setFrame} className="flex flex-wrap gap-3">
          {[
            { value: "none", label: "Unframed", price: "+$0" },
            { value: "black", label: "Black Frame", price: "+$29.99" },
            { value: "white", label: "White Frame", price: "+$29.99" },
            { value: "walnut", label: "Walnut Frame", price: "+$39.99" },
          ].map((option) => (
            <Label
              key={option.value}
              htmlFor={`frame-${option.value}`}
              className={`flex items-center justify-between px-4 py-3 border rounded-md cursor-pointer ${
                frame === option.value
                  ? "border-[#b7384e] bg-[#b7384e]/5"
                  : "border-[#563635]/20 hover:border-[#563635]/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem id={`frame-${option.value}`} value={option.value} className="sr-only" />
                {frame === option.value && <Check className="h-4 w-4 text-[#b7384e]" />}
                <span className={frame === option.value ? "text-[#b7384e]" : "text-[#563635]"}>{option.label}</span>
              </div>
              <span className={`text-sm ${frame === option.value ? "text-[#b7384e]" : "text-[#563635]/70"}`}>
                {option.price}
              </span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <div>
        <h3 className="text-lg font-medium text-[#563635] mb-3">Map Style</h3>
        <RadioGroup value={style} onValueChange={setStyle} className="flex flex-wrap gap-3">
          {[
            { value: "classic", label: "Classic" },
            { value: "minimal", label: "Minimal" },
            { value: "vintage", label: "Vintage" },
            { value: "satellite", label: "Satellite" },
          ].map((option) => (
            <Label
              key={option.value}
              htmlFor={`style-${option.value}`}
              className={`flex items-center justify-between px-4 py-3 border rounded-md cursor-pointer ${
                style === option.value
                  ? "border-[#b7384e] bg-[#b7384e]/5"
                  : "border-[#563635]/20 hover:border-[#563635]/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem id={`style-${option.value}`} value={option.value} className="sr-only" />
                {style === option.value && <Check className="h-4 w-4 text-[#b7384e]" />}
                <span className={style === option.value ? "text-[#b7384e]" : "text-[#563635]"}>{option.label}</span>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <div>
        <h3 className="text-lg font-medium text-[#563635] mb-3">Personalization</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-sm text-[#563635]">
              Title
            </Label>
            <Input
              id="title"
              placeholder="e.g., Our Love Story"
              className="mt-1 border-[#563635]/20 focus-visible:ring-[#b7384e]"
            />
          </div>

          <div>
            <Label htmlFor="subtitle" className="text-sm text-[#563635]">
              Subtitle (Optional)
            </Label>
            <Input
              id="subtitle"
              placeholder="e.g., Est. June 12, 2020"
              className="mt-1 border-[#563635]/20 focus-visible:ring-[#b7384e]"
            />
          </div>

          <div>
            <Label htmlFor="location" className="text-sm text-[#563635]">
              Location
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="location"
                placeholder="Enter address or coordinates"
                className="flex-1 border-[#563635]/20 focus-visible:ring-[#b7384e]"
              />
              <button className="p-2 bg-[#563635]/5 rounded-md hover:bg-[#563635]/10 transition-colors">
                <MapPin className="h-5 w-5 text-[#b7384e]" />
              </button>
            </div>
            <p className="text-xs text-[#563635]/60 mt-1">
              Enter a specific address, city, or coordinates for your map
            </p>
          </div>

          <div>
            <Label htmlFor="message" className="text-sm text-[#563635]">
              Special Message (Optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to appear on your map"
              className="mt-1 min-h-[80px] border-[#563635]/20 focus-visible:ring-[#b7384e]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

