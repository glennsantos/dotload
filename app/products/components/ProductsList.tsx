"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Plus, Info, ShoppingCart, DollarSign, Users, UserCheck, Archive } from "lucide-react"
import { StatsCard } from "@/components/ui/stats-card"
import { Button } from "@/components/ui/button"
import ProductActions from "./ProductActions"

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
  isArchived?: boolean
  isPublic?: boolean
  status?: string
}

interface ProductsListProps {
  products: Product[]
  onProductsChange: (products: Product[]) => void
}

function stripHTML(html: string) {  
  if (typeof document === 'undefined') return html; // Handle server-side rendering
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

// Helper component to render product image
const renderProductImage = (product: Product) => {
  if (product.coverImagePath) {
    return (
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
    )
  }
  return (
    <div className="w-full h-full bg-stone-100 flex items-center justify-center">
      <span className="text-stone-400 text-xs">No image</span>
    </div>
  )
}

// Helper component to render status badge
const renderStatusBadge = (product: Product) => {
  if (product.isArchived) {
    return <span className="text-xs bg-stone-100 text-stone-800 px-2 py-1 rounded-full">Archived</span>
  }
  if (product.isPublic) {
    return <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">Published</span>
  }
  return <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">Draft</span>
}

export default function ProductsList({ products, onProductsChange }: ProductsListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [localProducts, setLocalProducts] = useState<Product[]>([])
  const [activeFilter, setActiveFilter] = useState<'active' | 'archived'>('active')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        const response = await fetch('/api/products', {
          credentials: 'include'
        })
        
        if (response.status === 401 || response.status === 403) {
          // Let middleware handle the redirect
          return
        }
        
        if (response.ok) {
          const data = await response.json()
          const productsArray = data.products || []
          onProductsChange(productsArray)
          setLocalProducts(productsArray)
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
  
  // Update local products when props change
  useEffect(() => {
    if (products) {
      // Make sure we correctly identify archived products based on status field
      const productsWithArchiveFlag = products.map(product => ({
        ...product,
        isArchived: product.status === 'archived'
      }))
      setLocalProducts(productsWithArchiveFlag)
      setLoading(false)
    }
  }, [products])
  
  // Filter products whenever localProducts or activeFilter changes
  useEffect(() => {
    const filtered = localProducts.filter(product => 
      activeFilter === 'archived' ? product.isArchived : !product.isArchived
    )
    setFilteredProducts(filtered)
  }, [localProducts, activeFilter])

  // Handle product update
  const handleProductUpdate = (updatedProduct: Product) => {
    const updated = localProducts.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    )
    setLocalProducts(updated)
    onProductsChange(updated)
  }
  
  // Handle product delete
  const handleProductDelete = (productId: string) => {
    const updated = localProducts.filter(p => p.id !== productId)
    setLocalProducts(updated)
    onProductsChange(updated)
  }

  if (loading) {
    return (
      <div className="claude-card rounded-lg p-4 sm:p-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-stone-200 rounded-full mb-4"></div>
            <div className="h-4 w-40 bg-stone-200 rounded mb-3"></div>
            <div className="h-3 w-32 bg-stone-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="claude-card rounded-lg p-4 sm:p-6 text-center">
        <h2 className="text-xl font-medium mb-2 text-destructive">Error</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    )
  }

  const hasProducts = Array.isArray(products) && products.length > 0

  if (!hasProducts) {
    return (
      <div className="text-center py-8 claude-card rounded-lg p-4 sm:p-6">
        <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2 text-foreground">You don't have any products yet</p>
        <p className="text-sm text-muted-foreground mb-6">Create your first product to start selling</p>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-light">
          <Link href="/create-product">
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
              icon: <DollarSign className="h-5 w-5 text-primary" />,
      iconClassName: "bg-primary/10"
    },
    { 
      title: "Total Sales", 
      value: "0", 
      subtitle: "Completed orders",
      icon: <ShoppingCart className="h-5 w-5 text-primary" />,
      iconClassName: "bg-primary/10"
    },
    { 
      title: "Customers", 
      value: "0", 
      subtitle: "Unique buyers",
      icon: <Users className="h-5 w-5 text-secondary-foreground" />,
      iconClassName: "bg-secondary/10"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Products Header */}
      <div className="flex flex-col md:flex-row md:items-center mb-4 md:gap-4">
        <h2 className="text-2xl font-light text-foreground mb-4 md:mb-0">Your Products</h2>
        
        {/* Mobile view tabs - visible only on mobile */}
        <div className="flex md:hidden w-full rounded-xl overflow-hidden border border-border mb-2">
          <button 
            className={`m-1 flex-1 py-3 text-sm font-light rounded-xl ${activeFilter === 'active' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-background text-muted-foreground'}`}
            onClick={() => setActiveFilter('active')}
          >
            Active ({Array.isArray(products) ? products.filter(p => p.status !== 'archived').length : 0})
          </button>
          <button 
            className={`m-1 flex-1 py-3 text-sm font-light rounded-xl ${activeFilter === 'archived' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-background text-muted-foreground'}`}
            onClick={() => setActiveFilter('archived')}
          >
            <span className="flex items-center justify-center"><Archive className="mr-2 h-4 w-4" /> Archived ({Array.isArray(products) ? products.filter(p => p.status === 'archived').length : 0})</span>
          </button>
        </div>
        
        {/* Desktop view tabs - hidden on mobile */}
        <div className="hidden md:flex rounded-xl overflow-hidden border border-border shadow-none">
          <button 
            className={`m-1 rounded-lg px-4 py-2 text-sm font-light ${activeFilter === 'active' ? 'bg-primary/10 text-primary' : 'bg-background text-muted-foreground hover:bg-muted'}`}
            onClick={() => setActiveFilter('active')}
          >
            Active ({Array.isArray(products) ? products.filter(p => p.status !== 'archived').length : 0})
          </button>
          <button 
            className={`m-1 rounded-lg px-4 py-2 text-sm font-light ${activeFilter === 'archived' ? 'bg-primary/10 text-primary' : 'bg-background text-muted-foreground hover:bg-muted'}`}
            onClick={() => setActiveFilter('archived')}
          >
            <span className="flex items-center"><Archive className="mr-2 h-4 w-4" /> Archived ({Array.isArray(products) ? products.filter(p => p.status === 'archived').length : 0})</span>
          </button>
        </div>
      </div>
      
      {/* Desktop Table */}
      <div className="hidden md:block claude-card rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground" style={{ minWidth: '250px' }}>Product</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground" style={{ minWidth: '80px' }}>Price</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground" style={{ minWidth: '100px' }}>Status</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground" style={{ minWidth: '60px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={`desktop-${product.id}`} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div 
                      onClick={() => router.push(`/edit-product/${product.id}`)} 
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                      <div className="w-12 h-12 relative overflow-hidden rounded bg-white shrink-0">
                        {renderProductImage(product)}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{product.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {stripHTML(product.description)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">₱{product.price.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    {renderStatusBadge(product)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <ProductActions 
                      product={product} 
                      onProductUpdate={handleProductUpdate}
                      onProductDelete={handleProductDelete}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredProducts.map((product) => (
          <div 
            key={`mobile-${product.id}`} 
            className="claude-card rounded-lg p-4 hover:shadow-md transition-shadow relative"
          >
            {/* Menu button at top right */}
            <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
              <ProductActions 
                product={product} 
                onProductUpdate={handleProductUpdate}
                onProductDelete={handleProductDelete}
                variant="icon"
              />
            </div>
            
            <div className="flex gap-4 mr-6" onClick={() => router.push(`/edit-product/${product.id}`)}>
              {/* Product Image */}
              <div className="w-24 h-24 relative overflow-hidden rounded-lg bg-white shrink-0">
                {renderProductImage(product)}
              </div>
              
              {/* Product Details */}
              <div className="flex-1">
                <h3 className="font-medium text-foreground line-clamp-2 pr-6">{product.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {stripHTML(product.description)}
                </p>
              </div>
            </div>
            
            {/* Bottom row with price and status */}
            <div className="flex justify-between items-center mt-3 pt-3">
              <span className="font-medium text-foreground">₱{product.price.toFixed(2)}</span>
              {renderStatusBadge(product)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
