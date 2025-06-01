"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShoppingCart, Star, Check, Download, Clock } from "lucide-react"
import RichTextRenderer from "@/components/rich-text-renderer"

interface ClientProductPageProps {
  product: any | null
  slug: string
}

export default function ClientProductPage({ product, slug }: ClientProductPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = () => {
    // Set loading state
    setLoading(true)
    
    // Use the product's slug if available, otherwise fall back to the URL parameter
    const slugToUse = product?.slug || slug
    router.push(`/p/${slugToUse}/checkout`)
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="border rounded-md p-8 text-center max-w-md mx-auto">
          <h2 className="text-xl font-medium mb-2 text-red-600">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Product not found'}</p>
          <Link href="/" className="px-4 py-2 bg-black text-white rounded-md inline-flex items-center gap-2">
            <ArrowLeft size={18} /> Back to Home
          </Link>
        </div>
      </div>
    )
  }
  
  // Parse whatsIncluded from JSON if it exists
  const whatsIncluded = product.whatsIncluded ? JSON.parse(product.whatsIncluded) : []
  
  // Parse customTrustIndicators from JSON if it exists
  const trustIndicators = product.customTrustIndicators ? JSON.parse(product.customTrustIndicators) : []
  
  // Parse customBadges from JSON if it exists
  const customBadges = product.customBadges ? JSON.parse(product.customBadges) : []

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Product Preview Header */}
      <div className="bg-white border-b flex justify-between items-center py-4 px-6">
        <div className="flex items-center gap-2">
          {product.user?.storeLogoPath ? (
            <Image 
              src={product.user.storeLogoPath} 
              alt={product.user?.storeName || "Store"} 
              width={24} 
              height={24} 
              className="rounded-full w-6 h-6 object-cover"
            />
          ) : (
            <div className="bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-light">
              {product.user?.storeName ? product.user.storeName.charAt(0).toUpperCase() : "S"}
            </div>
          )}
          <span className="font-light">{product.user?.storeName || "Store"}</span>
        </div>
      </div>

      {/* Product Image */}
      <div className="w-full px-4">
        <div className="relative w-full max-h-[400px] overflow-hidden rounded-lg mx-auto max-w-3xl my-4">
          <Image
            src={product.coverImagePath}
            alt={product.name}
            width={600}
            height={300}
            className="w-full h-auto rounded-lg object-cover"
            priority
          />
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-4">
        <div className="text-center mb-6">
          {/* Product Badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-2">
            {product.bestSeller && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">Best Seller</span>
            )}
            {product.newRelease && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">New Release</span>
            )}
            {product.popular && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Popular</span>
            )}
            
            {/* Custom Badges */}
            {product.customBadges && JSON.parse(product.customBadges || '[]').map((badge: string, index: number) => (
              <span key={`badge-${index}`} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">{badge}</span>
            ))}
          </div>

          {/* Product Title */}
          <h1 className="text-3xl md:text-4xl font-normal text-gray-900 mb-2">{product.name}</h1>
          
          {/* Product Description */}
          <div className="text-gray-600 text-sm md:text-base mb-6 text-left">
            {product.description && (
              <RichTextRenderer content={product.description} />
            )}
          </div>
        </div>

        {/* Price and Buy Button */}
        <div className="hidden sm:block mb-8 text-center">
          <p className="text-2xl font-light mb-4">₱{product.price.toFixed(2)}</p>
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full bg-emerald-500 text-white px-6 py-3 rounded-md font-normal text-xl hover:bg-emerald-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent inline-block mr-2"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>Buy Now</>
            )}
          </button>
        </div>

        {/* What's Included Section */}
        <div className="border rounded-xl font-light p-4 mb-8">
          <h3 className="text-lg mb-2 text-center">What's included:</h3>
          <ul className="space-y-2">
            {whatsIncluded && whatsIncluded.length > 0 ? (
              whatsIncluded.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-2 text-sm">
                <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>{product.name}</span>
              </li>
            )}
          </ul>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-gray-500 mb-4">
          {product.secureCheckout && (
            <div className="flex items-center gap-1">
              <Check size={14} className="text-emerald-500" />
              <span>Secure Checkout</span>
            </div>
          )}
          {product.instantDownload && (
            <div className="flex items-center gap-1">
              <Download size={14} className="text-emerald-500" />
              <span>Instant Download</span>
            </div>
          )}
          {product.refundPolicy && (
            <div className="flex items-center gap-1">
              <Clock size={14} className="text-emerald-500" />
              <span>Money-back Guarantee</span>
            </div>
          )}
          
          {/* Custom Trust Indicators */}
          {trustIndicators && trustIndicators.length > 0 && 
            trustIndicators.map((indicator: string, index: number) => (
              <div key={`trust-${index}`} className="flex items-center gap-1">
                <Check size={14} className="text-emerald-500" />
                <span>{indicator}</span>
              </div>
            ))
          }
        </div>

        {/* Powered by alacart footer */}
        <div className="w-full">
          <div className="border-t border-gray-200 w-full px-4 py-4 flex flex-col items-center justify-center gap-2 text-gray-500 text-sm">
            <div>Powered by</div>
            <Image 
              src="/logo.png" 
              alt="Alacart Logo" 
              width={100}
              height={28}
              className="h-10 w-auto sm:h-7"
              priority
            />
          </div>
        </div>
      
      </main>
      
      
      
      {/* Mobile fixed Buy Now button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <button
          onClick={handlePurchase}
          disabled={loading}
          className="w-full bg-emerald-500 text-white px-6 py-3 rounded-md font-medium hover:bg-emerald-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent inline-block mr-2"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>Buy Now - ₱{product.price.toFixed(2)}</>
          )}
        </button>
      </div>
    </div>
  )
}
