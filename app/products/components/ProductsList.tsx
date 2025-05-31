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
  return <span className="text-xs bg-stone-100 text-stone-800 px-2 py-1 rounded-full">Draft</span>
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
          // Redirect to login if unauthorized
          window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
          return
        }
        
        if (response.ok) {
          const data = await response.json()
          onProductsChange(data)
          setLocalProducts(data)
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
        <Button asChild className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-light">
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
      {/* Products Header */}
      <div className="flex flex-col md:flex-row md:items-center mb-4 md:gap-4">
        <h2 className="text-2xl font-light text-stone-800 mb-4 md:mb-0">Your Products</h2>
        
        {/* Mobile view tabs - visible only on mobile */}
        <div className="flex md:hidden w-full rounded-xl overflow-hidden border border-stone-200 mb-2">
          <button 
            className={`m-1 flex-1 py-3 text-sm font-light rounded-xl ${activeFilter === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-white text-stone-600'}`}
            onClick={() => setActiveFilter('active')}
          >
            Active ({products.filter(p => p.status !== 'archived').length})
          </button>
          <button 
            className={`m-1 flex-1 py-3 text-sm font-light rounded-xl ${activeFilter === 'archived' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-white text-stone-600'}`}
            onClick={() => setActiveFilter('archived')}
          >
            <span className="flex items-center justify-center"><Archive className="mr-2 h-4 w-4" /> Archived ({products.filter(p => p.status === 'archived').length})</span>
          </button>
        </div>
        
        {/* Desktop view tabs - hidden on mobile */}
        <div className="hidden md:flex rounded-xl overflow-hidden border border-stone-200 shadow-none">
          <button 
            className={`m-1 rounded-lg px-4 py-2 text-sm font-light ${activeFilter === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'}`}
            onClick={() => setActiveFilter('active')}
          >
            Active ({products.filter(p => p.status !== 'archived').length})
          </button>
          <button 
            className={`m-1 rounded-lg px-4 py-2 text-sm font-light ${activeFilter === 'archived' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'}`}
            onClick={() => setActiveFilter('archived')}
          >
            <span className="flex items-center"><Archive className="mr-2 h-4 w-4" /> Archived ({products.filter(p => p.status === 'archived').length})</span>
          </button>
        </div>
      </div>
      
      {/* Desktop Table */}
      <div className="hidden md:block border border-stone-100 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-white">
                <th className="text-left py-3 px-4 font-light text-sm text-stone-700" style={{ minWidth: '250px' }}>Product</th>
                <th className="text-left py-3 px-4 font-light text-sm text-stone-700" style={{ minWidth: '80px' }}>Price</th>
                <th className="text-left py-3 px-4 font-light text-sm text-stone-700" style={{ minWidth: '100px' }}>Status</th>
                <th className="text-left py-3 px-4 font-light text-sm text-stone-700" style={{ minWidth: '60px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={`desktop-${product.id}`} className="border-b hover:bg-stone-50">
                  <td className="py-3 px-4">
                    <div 
                      onClick={() => router.push(`/edit-product/${product.id}`)} 
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                      <div className="w-12 h-12 relative overflow-hidden rounded bg-white shrink-0">
                        {renderProductImage(product)}
                      </div>
                      <div>
                        <div className="font-light text-stone-800">{product.name}</div>
                        <div className="text-sm text-stone-500 line-clamp-1">
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
            className="bg-stone-50 border border-stone-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative"
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
                <h3 className="font-light text-stone-900 line-clamp-2 pr-6">{product.name}</h3>
                <p className="text-sm text-stone-500 mt-1 line-clamp-2">
                  {stripHTML(product.description)}
                </p>
              </div>
            </div>
            
            {/* Bottom row with price and status */}
            <div className="flex justify-between items-center mt-3 pt-3">
              <span className="font-medium text-stone-900">₱{product.price.toFixed(2)}</span>
              {renderStatusBadge(product)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
