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

  // Dashboard cards
  const dashboardCards = [
    { title: "Total Revenue", value: "$0", info: true },
    { title: "Customers", value: "1", info: true },
    { title: "Active Members", value: "0", info: true },
    { title: "MRR", value: "$0", info: true },
  ]

  return (
    <div className="space-y-8">
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardCards.map((card, index) => (
          <div key={index} className="border rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{card.title}</span>
              {card.info && <Info size={16} className="text-gray-400" />}
            </div>
            <div className="text-3xl font-normal">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Products Header */}
      <div>
        <h2 className="text-xl font-normal mb-4">Products</h2>
      </div>

      {/* Products Table */}
      <div className="border rounded-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-white">
              <th className="text-left py-3 px-4 font-normal text-sm">Name</th>
              <th className="text-right py-3 px-4 font-normal text-sm">Sales</th>
              <th className="text-right py-3 px-4 font-normal text-sm">Revenue</th>
              <th className="text-right py-3 px-4 font-normal text-sm">Price</th>
              <th className="text-right py-3 px-4 font-normal text-sm">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <Link href={`/products/${product.id}`} className="flex items-center gap-3">
                    <div className="w-12 h-12 relative overflow-hidden rounded">
                      {product.coverImagePath ? (
                        <Image 
                          src={product.coverImagePath.startsWith('http') ? product.coverImagePath : `/${product.coverImagePath}`} 
                          alt={product.name} 
                          fill 
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        jensmithgoastravel.alacarte.com/l/{product.id}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="py-3 px-4 text-right">0</td>
                <td className="py-3 px-4 text-right">$0</td>
                <td className="py-3 px-4 text-right">${product.price.toFixed(2)}+</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    <span>Published</span>
                  </div>
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td colSpan={2} className="py-3 px-4 font-medium">Totals</td>
              <td className="py-3 px-4 text-right">$0</td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
