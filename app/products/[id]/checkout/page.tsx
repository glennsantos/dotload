"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { use } from "react"

interface ProductCheckoutPageProps {
  params: any
  searchParams?: any
}

export default function ProductCheckoutPage({ params, searchParams }: ProductCheckoutPageProps) {
  // Unwrap params and searchParams using React.use()
  const unwrappedParams = use(params) as { id: string }
  const unwrappedSearchParams = searchParams ? use(searchParams) as { [key: string]: string | string[] | undefined } : {}
  return (
    <div>
      <div className="bg-gray-50 py-2 px-6 border-b">
        <div className="flex items-center text-sm">
          <Link href="/products" className="text-gray-600 hover:text-black">
            Products
          </Link>
          <ChevronRight size={16} className="mx-2 text-gray-400" />
          <Link href={`/products/${unwrappedParams.id}`} className="text-gray-600 hover:text-black">
            Product
          </Link>
          <ChevronRight size={16} className="mx-2 text-gray-400" />
          <span className="font-medium">Checkout</span>
        </div>
      </div>
      {/* Checkout management UI goes here, matching the attached screens */}
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-normal mb-6">Product Checkout</h1>
        {/* Add discount code, payment form, and preview UI as per the attached screens */}
        <div className="border rounded-md p-6 bg-white">
          <div className="mb-4 font-medium">Discount codes</div>
          <div className="border rounded p-4 mb-4">Add a discount code, toggle, etc.</div>
          <div className="mb-4 font-medium">Payment form</div>
          <div className="border rounded p-4 mb-4">Shipping info, additional details, etc.</div>
          <div className="mb-4 font-medium">Preview</div>
          <div className="border rounded p-4">Checkout preview UI</div>
        </div>
      </div>
    </div>
  )
} 