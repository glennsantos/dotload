"use client"

import Link from "next/link"
import Image from "next/image"
import { Plus, Search } from "lucide-react"
import ProductsList, { Product } from "./components/ProductsList"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  
  // Check authentication on page load and fetch products
  useEffect(() => {
    // Check if user is authenticated by making a request to the auth endpoint
    async function checkAuthAndFetchProducts() {
      try {
        const [authResponse, productsResponse] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/products')
        ])
        
        if (authResponse.status === 401 || authResponse.status === 403) {
          // Redirect to login if unauthorized
          router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
          return
        }
        
        if (productsResponse.ok) {
          const data = await productsResponse.json()
          setProducts(data)
        }
      } catch (error) {
        console.error('Authentication or fetch failed:', error)
      }
    }
    
    checkAuthAndFetchProducts()
  }, [router])
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-normal">Products</h1>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search"
              className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          {products.length > 0 && (
            <Link 
              href="/products/new" 
              className="w-full sm:w-auto whitespace-nowrap px-4 py-2 bg-black hover:bg-black text-white rounded-md flex items-center justify-center gap-2"
            >
              <Plus size={18} /> New product
            </Link>
          )}
        </div>
      </div>
      <ProductsList products={products} onProductsChange={setProducts} />
    </div>
  )
}
