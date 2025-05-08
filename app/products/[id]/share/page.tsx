"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

export default function ProductSharePage({ params }: { params: { id: string } }) {
  return (
    <div>
      <div className="bg-gray-50 py-2 px-6 border-b">
        <div className="flex items-center text-sm">
          <Link href="/products" className="text-gray-600 hover:text-black">
            Products
          </Link>
          <ChevronRight size={16} className="mx-2 text-gray-400" />
          <Link href={`/products/${params.id}`} className="text-gray-600 hover:text-black">
            Product
          </Link>
          <ChevronRight size={16} className="mx-2 text-gray-400" />
          <span className="font-medium">Share</span>
        </div>
      </div>
      {/* Share management UI goes here, matching the attached screens */}
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-normal mb-6">Product Share</h1>
        {/* Add sharing options, integrations, and preview UI as per the attached screens */}
        <div className="border rounded-md p-6 bg-white">
          <div className="mb-4 font-medium">Share options</div>
          <div className="border rounded p-4 mb-4">Social, link, integrations, etc.</div>
          <div className="mb-4 font-medium">Preview</div>
          <div className="border rounded p-4">Share preview UI</div>
        </div>
      </div>
    </div>
  )
} 