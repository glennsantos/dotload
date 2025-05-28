"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Info, ShoppingCart, DollarSign, Users, UserCheck } from "lucide-react"
import { StatsCard } from "@/components/ui/stats-card"
import { Button } from "@/components/ui/button"

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

export interface Product {
  id: string
  name: string
  slug: string
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

interface ProductsListProps {
  products: Product[]
  onProductsChange: (products: Product[]) => void
}

export default function ProductsList({ products, onProductsChange }: ProductsListProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        const response = await fetch('/api/products')
        
        if (response.status === 401 || response.status === 403) {
          // Redirect to login if unauthorized
          window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
          return
        }
        
        if (response.ok) {
          const data = await response.json()
          onProductsChange(data)
        } else {
          setError('Failed to fetch products')
        }
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Failed to load products. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [onProductsChange])

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
      <div className="border border-stone-200 rounded-lg shadow-sm p-8 text-center">
        <h2 className="text-xl font-medium mb-2 text-stone-800">You don't have any products yet</h2>
        <p className="text-stone-600 mb-6">Create your first product to start selling</p>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md inline-flex items-center gap-2">
          <Link href="/products/new">
            <Plus size={18} /> Create Product
          </Link>
        </Button>
      </div>
    )
  }

  // Stats data for the cards
  const statsData = [
    { 
      title: "Total Revenue", 
      value: "$0", 
      subtitle: "All time earnings",
      icon: <DollarSign className="h-5 w-5 text-green-600" />,
      iconClassName: "bg-green-100"
    },
    { 
      title: "Total Sales", 
      value: "0", 
      subtitle: "Completed orders",
      icon: <ShoppingCart className="h-5 w-5 text-blue-600" />,
      iconClassName: "bg-blue-100"
    },
    { 
      title: "Customers", 
      value: "0", 
      subtitle: "Unique buyers",
      icon: <Users className="h-5 w-5 text-purple-600" />,
      iconClassName: "bg-purple-100"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Products Table */}
      <div className="border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-white">
                <th className="text-left py-3 px-4 font-medium text-sm text-stone-700" style={{ minWidth: '250px' }}>Name</th>
                <th className="text-right py-3 px-4 font-medium text-sm text-stone-700" style={{ minWidth: '80px' }}>Price</th>
                <th className="text-right py-3 px-4 font-medium text-sm text-stone-700" style={{ minWidth: '100px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b hover:bg-stone-50">
                <td className="py-3 px-4">
                  <Link href={`/products/${product.id}`} className="flex items-center gap-3">
                    <div className="w-12 h-12 relative overflow-hidden rounded">
                      {product.coverImagePath ? (
                        <Image 
                          src={
                            // Handle URLs that start with http:// or https://
                            product.coverImagePath.startsWith('http') ? product.coverImagePath :
                            // Handle protocol-relative URLs that start with //
                            product.coverImagePath.startsWith('//') ? `https:${product.coverImagePath}` :
                            // Handle absolute paths that start with /
                            product.coverImagePath.startsWith('/') ? product.coverImagePath :
                            // Handle relative paths by adding a leading /
                            `/${product.coverImagePath}`
                          } 
                          alt={product.name} 
                          fill 
                          className="object-cover"
                          unoptimized={!product.coverImagePath.startsWith('http')}
                        />
                      ) : (
                        <div className="w-full h-full bg-stone-200 flex items-center justify-center">
                          <span className="text-stone-400 text-xs">No image</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-stone-800">{product.name}</div>
                      <div className="text-sm text-stone-500">
                        {window.location.host}/p/{product.slug || product.id}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="py-3 px-4 text-right">${product.price.toFixed(2)}+</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                    <span className="text-stone-700">Published</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
