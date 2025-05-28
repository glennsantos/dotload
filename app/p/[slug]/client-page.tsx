"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShoppingCart, Star } from "lucide-react"
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

  // Get ratings data from the product if available
  const ratings = {
    average: 0,
    count: 0,
    displayStars: 5
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">  {/* Added padding bottom for mobile fixed button */}
      {/* Hero Image Section */}
      <div className="w-full bg-black">
        {product.coverImagePath ? (
          <div className="relative h-[300px] md:h-[500px] w-full">
            <Image
              src={product.coverImagePath}
              alt={product.name}
              fill
              className="object-cover opacity-90"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
        ) : (
          <div className="bg-gray-800 h-[300px] md:h-[500px] w-full flex items-center justify-center">
            <span className="text-gray-400 text-lg">No image available</span>
          </div>
        )}
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left panel - Title and Description */}
          <div>
            {/* Product type badge */}
            <div className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700 mb-4">
              {product.type}
            </div>
            
            {/* Product name */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
            
            {/* Product description */}
            <div className="prose prose-gray max-w-none mb-8">
              {product.description && (
                <RichTextRenderer content={product.description} />
              )}
            </div>
            
            {/* Ratings - Desktop only - Only shown if there are ratings */}
            {ratings.count > 0 && (
              <div className="hidden md:block mb-8">
                <h3 className="text-lg font-medium mb-3">Ratings</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={18} 
                        className={i < Math.floor(ratings.average) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
                      />
                    ))}
                  </div>
                  <span className="font-medium">{ratings.average}</span>
                  <span className="text-gray-500">({ratings.count} ratings)</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Right panel - Price and Purchase */}
          <div>
            <div className="bg-gray-50 rounded-xl p-6 sticky top-4">
              {/* Price */}
              <div className="flex items-baseline mb-6">
                <span className="text-3xl font-bold">{product.currency} {product.price.toFixed(2)}</span>
                {product.comparePrice && (
                  <span className="ml-2 text-lg text-gray-500 line-through">{product.currency} {product.comparePrice.toFixed(2)}</span>
                )}
              </div>
              
              {/* Add to cart button - Desktop */}
              <div className="hidden md:block space-y-4 mb-6">
                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="w-full bg-black text-white px-6 py-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={20} />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
              {/* Ratings - Mobile only - Only shown if there are ratings */}
              {ratings.count > 0 && (
                <div className="md:hidden mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium mb-3">Ratings</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={18} 
                          className={i < Math.floor(ratings.average) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
                        />
                      ))}
                    </div>
                    <span className="font-medium">{ratings.average}</span>
                    <span className="text-gray-500">({ratings.count} ratings)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Mobile fixed Add to Cart button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 flex items-center justify-between">
        <div>
          <p className="font-bold text-xl">{product.currency} {product.price.toFixed(2)}</p>
        </div>
        <button
          onClick={handlePurchase}
          disabled={loading}
          className="bg-black text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <ShoppingCart size={18} />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>

      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">alaCart</h3>
              <p className="text-gray-600">The easiest way to sell your digital products online.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Links</h3>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/" className="hover:text-gray-900">Home</Link></li>
                <li><Link href="/products" className="hover:text-gray-900">Products</Link></li>
                <li><Link href="#" className="hover:text-gray-900">Pricing</Link></li>
                <li><Link href="#" className="hover:text-gray-900">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="#" className="hover:text-gray-900">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-gray-900">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-gray-900">Refund Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500">
            <p>© {new Date().getFullYear()} alaCart. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
