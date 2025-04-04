import LoadingSpinner from "@/components/loading-spinner"

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-4">
        <div className="h-10 w-10 border-4 border-[#563635]/20 border-t-[#b7384e] rounded-full animate-spin"></div>
        <p className="text-lg font-medium text-[#563635]">Loading products...</p>
      </div>
    </div>
  )
}