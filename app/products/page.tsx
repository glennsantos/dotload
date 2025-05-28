"use client"

import Link from "next/link"
import Image from "next/image"
import { Plus, Search, Settings, LogOut } from "lucide-react"
import ProductsList, { Product } from "./components/ProductsList"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardTabs } from "@/components/ui/dashboard-tabs"
import { Button } from "@/components/ui/button"

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [userName, setUserName] = useState("User")
  
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
        
        // Get user data for welcome message
        if (authResponse.ok) {
          const userData = await authResponse.json()
          if (userData.user && userData.user.name) {
            setUserName(userData.user.name)
          }
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
      {/* Dashboard Header with Welcome Message and Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Dashboard</h1>
          <p className="text-stone-600 font-light">Welcome back, {userName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            asChild
            variant="outline"
            className="border-stone-200 text-stone-700 hover:bg-stone-50 rounded-md"
          >
            <Link href="/settings">
              <Settings size={16} />
              <span className="sr-only md:not-sr-only md:ml-2">Settings</span>
            </Link>
          </Button>
          <Button 
            asChild
            variant="outline"
            className="border-stone-200 text-stone-700 hover:bg-stone-50 rounded-md"
          >
            <Link href="/api/auth/logout">
              <LogOut size={16} />
              <span className="sr-only md:not-sr-only md:ml-2">Logout</span>
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Horizontal Tab Menu */}
      <div className="mb-8">
        <DashboardTabs activeTab="products" />
      </div>
      {/* Mobile Search - Only visible on small screens */}
      <div className="md:hidden mb-6">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-stone-400" />
          </div>
          <input
            type="text"
            placeholder="Search products"
            className="pl-10 pr-4 py-2 border border-stone-300 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>
      
      <ProductsList products={products} onProductsChange={setProducts} />
    </div>
  )
}
