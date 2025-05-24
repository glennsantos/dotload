"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface ProductSharePageProps {
  params: any
  searchParams?: any
}

export default function ProductSharePage({ params, searchParams }: ProductSharePageProps) {
  // Unwrap params and searchParams using React.use()
  const unwrappedParams = use(params) as { id: string }
  const unwrappedSearchParams = searchParams ? use(searchParams) as { [key: string]: string | string[] | undefined } : {}
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [productUrl, setProductUrl] = useState('')

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        const response = await fetch(`/api/products`)
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        
        const products = await response.json()
        const foundProduct = Array.isArray(products) ? 
          products.find(p => p.id === unwrappedParams.id) : null
        
        if (!foundProduct) {
          throw new Error('Product not found')
        }
        
        setProduct(foundProduct)
        setProductUrl(`${window.location.origin}/p/${foundProduct.slug || foundProduct.id}`)
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [unwrappedParams.id])

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
          <Link href="/products" className="px-4 py-2 bg-black text-white rounded-md inline-flex items-center gap-2">
            <ChevronRight size={18} /> Back to Products
          </Link>
        </div>
      </div>
    )
  }

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
          <span className="font-medium">Share</span>
        </div>
      </div>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-normal mb-6">Product Share</h1>
        <div className="border rounded-md p-6 bg-white">
          <div className="mb-6">
            <div className="font-medium mb-2">Product URL</div>
            <div className="flex mb-4">
              <input
                type="text"
                value={`${window.location.origin}/p/${product.slug || unwrappedParams.id}`}
                readOnly
                className="flex-1 p-1 border rounded-l-md bg-gray-100"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(productUrl);
                  alert('URL copied to clipboard!');
                }}
                className="px-4 py-2 bg-black text-white rounded-r-md"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="font-medium mb-2">Social Media</div>
            <p className="text-sm text-gray-600 mb-4">Share your product on social media</p>
            <div className="flex gap-2">
              <button 
                onClick={() => window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(`Check out ${product.name}`)}`, '_blank')} 
                className="px-4 py-2 bg-black text-white rounded-md"
              >
                X (Twitter)
              </button>
              <button 
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`, '_blank')} 
                className="px-4 py-2 bg-blue-800 text-white rounded-md"
              >
                Facebook
              </button>
              <button 
                onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`, '_blank')} 
                className="px-4 py-2 bg-[#0077b5] text-white rounded-md"
              >
                LinkedIn
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="font-medium mb-2">Embed on Website</div>
            <p className="text-sm text-gray-600 mb-4">Add this product to your website</p>
            <div className="bg-gray-100 p-3 rounded-md">
              <code className="text-sm">
                &lt;iframe src="{productUrl}/embed" frameborder="0"
                width="100%" height="auto" style="min-height: 400px;"&gt;&lt;/iframe&gt;
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 