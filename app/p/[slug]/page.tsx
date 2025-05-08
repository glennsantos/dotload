"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShoppingCart } from "lucide-react"

interface ProductPageProps {
  params: {
    slug: string
  }
}

export default function PublicProductPage({ params }: ProductPageProps) {
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        const response = await fetch(`/api/public/products/${params.slug}`)
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        
        const productData = await response.json()
        setProduct(productData)
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.slug])

  const handlePurchase = () => {
    router.push(`/p/${params.slug}/checkout`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-gray-600">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">alaCarte</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="md:flex">
            <div className="md:flex-shrink-0 md:w-1/2">
              {product.coverImagePath ? (
                <div className="relative h-96 w-full">
                  <Image
                    src={product.coverImagePath}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="bg-gray-200 h-96 flex items-center justify-center">
                  <span className="text-gray-400 text-lg">No image available</span>
                </div>
              )}
            </div>
            <div className="p-8 md:w-1/2">
              <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
                {product.type}
              </div>
              <h2 className="mt-2 text-3xl font-bold text-gray-900">{product.name}</h2>
              <p className="mt-4 text-2xl font-bold text-gray-900">
                {product.currency} {product.price.toFixed(2)}
              </p>
              <div className="mt-4 text-gray-600">
                {product.description || 'No description available'}
              </div>
              
              {product.variations && product.variations.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">Options</h3>
                  <div className="mt-2 space-y-4">
                    {product.variations.map((variation: any) => (
                      <div key={variation.id}>
                        <h4 className="text-sm font-medium text-gray-900">{variation.name}</h4>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          {JSON.parse(variation.options).map((option: string, index: number) => (
                            <div 
                              key={index}
                              className="border rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-8">
                <button
                  onClick={handlePurchase}
                  className="w-full bg-black text-white px-6 py-3 rounded-md font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                >
                  <ShoppingCart size={20} />
                  Purchase Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
