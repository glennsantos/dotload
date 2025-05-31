"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  MoreVertical, 
  Eye, 
  Edit, 
  Globe, 
  FileText, 
  Archive, 
  RotateCcw,
  Trash2,
  X
} from "lucide-react"
import { Product } from "./ProductsList"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface ProductActionsProps {
  product: Product
  onProductUpdate: (updatedProduct: Product) => void
  onProductDelete: (productId: string) => void
}

export default function ProductActions({ 
  product, 
  onProductUpdate, 
  onProductDelete 
}: ProductActionsProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Toggle menu
  const toggleMenu = () => setMenuOpen(!menuOpen)
  
  // Close menu
  const closeMenu = () => setMenuOpen(false)

  // Preview product
  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPreviewOpen(true)
    closeMenu()
  }

  // Edit product
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/edit-product/${product.id}`)
    closeMenu()
  }

  // Toggle publish status
  const handlePublishToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    closeMenu()
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublic: !product.isPublic
        }),
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.statusText}`)
      }
      
      const data = await response.json()
      onProductUpdate(data.product)
    } catch (err) {
      console.error('Error updating product:', err)
      setError(err instanceof Error ? err.message : 'Failed to update product')
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle archive status
  const handleArchiveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    closeMenu()
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isArchived: !product.isArchived
        }),
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.statusText}`)
      }
      
      const data = await response.json()
      onProductUpdate(data.product)
    } catch (err) {
      console.error('Error updating product:', err)
      setError(err instanceof Error ? err.message : 'Failed to update product')
    } finally {
      setIsLoading(false)
    }
  }

  // Delete product
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!isDeleting) {
      setIsDeleting(true)
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.statusText}`)
      }
      
      onProductDelete(product.id)
    } catch (err) {
      console.error('Error deleting product:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete product')
    } finally {
      setIsLoading(false)
      setIsDeleting(false)
    }
  }

  // Cancel delete
  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeleting(false)
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      {/* Actions button */}
      <button 
        onClick={toggleMenu}
        className="p-2 rounded-full hover:bg-stone-100"
        disabled={isLoading}
      >
        <MoreVertical size={16} className="text-stone-500" />
      </button>
      
      {/* Actions menu */}
      {menuOpen && (
        <div className="absolute right-0 top-8 w-48 bg-white border border-stone-200 rounded-lg shadow-md z-10">
          <div className="py-1">
            <button
              onClick={handlePreview}
              className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 flex items-center"
            >
              <Eye size={16} className="mr-2" /> Preview
            </button>
            
            <button
              onClick={handleEdit}
              className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 flex items-center"
            >
              <Edit size={16} className="mr-2" /> Edit
            </button>
            
            <button
              onClick={handlePublishToggle}
              className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 flex items-center"
              disabled={isLoading}
            >
              {product.isPublic ? (
                <>
                  <FileText size={16} className="mr-2" /> Set as Draft
                </>
              ) : (
                <>
                  <Globe size={16} className="mr-2" /> Publish
                </>
              )}
            </button>
            
            <button
              onClick={handleArchiveToggle}
              className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 flex items-center"
              disabled={isLoading}
            >
              {product.isArchived ? (
                <>
                  <RotateCcw size={16} className="mr-2" /> Restore
                </>
              ) : (
                <>
                  <Archive size={16} className="mr-2" /> Archive
                </>
              )}
            </button>
            
            <button
              onClick={handleDelete}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
              disabled={isLoading}
            >
              <Trash2 size={16} className="mr-2" /> Delete
            </button>
          </div>
        </div>
      )}
      
      {/* Delete confirmation */}
      {isDeleting && (
        <div className="absolute right-0 top-8 w-64 bg-white border border-red-200 rounded-lg shadow-md z-10 p-3">
          <p className="text-sm text-stone-700 mb-3">Are you sure you want to delete this product?</p>
          <div className="flex justify-between">
            <button
              onClick={cancelDelete}
              className="px-3 py-1 text-xs bg-stone-100 text-stone-700 rounded-md hover:bg-stone-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="absolute right-0 top-8 w-64 bg-white border border-red-200 rounded-lg shadow-md z-10 p-3">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button
            onClick={() => setError(null)}
            className="px-3 py-1 text-xs bg-stone-100 text-stone-700 rounded-md hover:bg-stone-200 w-full"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Preview modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Product Preview</h3>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 rounded-full hover:bg-stone-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Product image */}
                <div className="w-full md:w-1/2">
                  <div className="aspect-square relative rounded-lg overflow-hidden border border-stone-200">
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
                        <span className="text-stone-400">No image</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Product details */}
                <div className="w-full md:w-1/2">
                  <h1 className="text-2xl font-medium mb-2">{product.name}</h1>
                  <div className="flex items-center mb-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      product.isPublic 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {product.isPublic ? 'Published' : 'Draft'}
                    </span>
                    {product.isArchived && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full bg-stone-100 text-stone-800 text-xs">
                        Archived
                      </span>
                    )}
                  </div>
                  
                  <div className="text-2xl font-medium mb-6">
                    {product.currency === 'PHP' ? '₱' : '$'}{product.price.toFixed(2)}
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-1">Description</h3>
                    <p className="text-stone-700 whitespace-pre-wrap">
                      {product.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-1">Product URL</h3>
                    <div className="text-stone-700 break-all">
                      {window.location.origin}/p/{product.slug || product.id}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => setIsPreviewOpen(false)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Close Preview
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
