"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Info } from "lucide-react"

interface ProductFile {
  id: string
  filename: string
  path: string
  mimetype: string
  size: number
  productId: string
}

interface ProductVariation {
  id: string
  name: string
  options: string
  productId: string
}

interface Product {
  id: string
  name: string
  type: string
  price: number
  currency: string
  description: string
  coverImagePath: string | null
  userId: string
  createdAt: string
  updatedAt: string
  files: ProductFile[]
  variations: ProductVariation[]
}

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        const response = await fetch('/api/products')
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        
        const data = await response.json()
        setProducts(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Failed to load products. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-2 text-gray-600">Loading your products...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border rounded-md p-8 text-center">
        <h2 className="text-xl font-medium mb-2 text-red-600">Error</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-black text-white rounded-md inline-flex items-center gap-2"
        >
          Try Again
        </button>
      </div>
    )
  }

  const hasProducts = products.length > 0

  if (!hasProducts) {
    return (
      <div className="border rounded-md p-8 text-center">
        <h2 className="text-xl font-medium mb-2">You don't have any products yet</h2>
        <p className="text-gray-600 mb-6">Create your first product to start selling</p>
        <Link href="/products/new" className="px-4 py-2 bg-black text-white rounded-md inline-flex items-center gap-2">
          <Plus size={18} /> Create Product
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Link 
          href={`/products/${product.id}`} 
          key={product.id} 
          className="border rounded-md overflow-hidden hover:shadow-md transition-shadow duration-200"
        >
          <div className="relative h-48 w-full bg-gray-100">
            {product.coverImagePath ? (
              <Image 
                src={`/${product.coverImagePath}`} 
                alt={product.name} 
                fill 
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-gray-200">
                <span className="text-gray-400">No image</span>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-medium text-lg mb-1">{product.name}</h3>
            <div className="flex justify-between items-center">
              <span className="font-medium">${product.price.toFixed(2)}</span>
              <span className="text-sm text-gray-500 capitalize">{product.type}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
