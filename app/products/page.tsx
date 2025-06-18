"use client"

import Link from "next/link"
import Image from "next/image"
import { Plus, Search, Settings, LogOut } from "lucide-react"
import ProductsList, { Product } from "./components/ProductsList"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardTabs } from "@/components/ui/dashboard-tabs"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [userName, setUserName] = useState("User")
  const [userEmail, setUserEmail] = useState("")
  const [userLogo, setUserLogo] = useState("")
  
  // Check authentication on page load and fetch products
  useEffect(() => {
    // Check if user is authenticated by making a request to the auth endpoint
    async function checkAuthAndFetchProducts() {
      try {
        const [authResponse, productsResponse] = await Promise.all([
          fetch('/api/auth/me', { credentials: 'include' }),
          fetch('/api/products', { credentials: 'include' })
        ])
        
        if (authResponse.status === 401 || authResponse.status === 403) {
          // Let middleware handle the redirect
          return
        }
        
        // Get user data for welcome message
        if (authResponse.ok) {
          const userData = await authResponse.json()
          const user = userData.user || userData;
          setUserName(user.name || 'User')
          setUserEmail(user.email || '')
          setUserLogo(user.storeLogoPath || '')
        }
        
        if (productsResponse.ok) {
          const data = await productsResponse.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error('Authentication or fetch failed:', error)
      }
    }
    
    checkAuthAndFetchProducts()
  }, [router])
  return (
    <div className="max-w-7xl mx-auto p-6">
      <DashboardHeader />
      
      {/* Horizontal Tab Menu */}
      <DashboardTabs activeTab="products" />
      
      <ProductsList products={products} onProductsChange={setProducts} />
    </div>
  )
}
