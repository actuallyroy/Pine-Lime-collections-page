"use client"

import { useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Share2, X } from "lucide-react"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  title: string
}

export default function ShareModal({ isOpen, onClose, url, title }: ShareModalProps) {
  const shareButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen && shareButtonRef.current) {
      shareButtonRef.current.focus()
    }
  }, [isOpen])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(url)
      // You might want to show a toast notification here
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Journey Map
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 px-3 py-2 border rounded-md bg-gray-50"
            />
            <Button
              ref={shareButtonRef}
              onClick={handleShare}
              className="bg-[#b7384e] hover:bg-[#b7384e]/90 text-white"
            >
              Share
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Share this journey map with friends and family
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
} 