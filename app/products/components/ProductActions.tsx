"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  Ellipsis, 
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
import ClientProductPage from "@/app/p/[slug]/client-page"

interface ProductActionsProps {
  product: Product
  onProductUpdate: (updatedProduct: Product) => void
  onProductDelete: (productId: string) => void
  variant?: 'default' | 'icon'
}

export default function ProductActions({ product, onProductUpdate, onProductDelete, variant = 'default' }: ProductActionsProps) {
  const router = useRouter()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Calculate menu position when opening
  const calculateMenuPosition = () => {
    if (!buttonRef.current) return { top: 0, left: 0 }
    
    const buttonRect = buttonRef.current.getBoundingClientRect()
    const menuWidth = 192 // w-48 = 12rem = 192px
    const menuHeight = 200 // Approximate height of menu
    
    let top = buttonRect.bottom + 4 // 4px gap below button
    let left = buttonRect.right - menuWidth // Align right edge with button
    
    // Adjust if menu would go off-screen
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Adjust horizontal position if menu goes off right edge
    if (left < 8) {
      left = 8 // 8px margin from left edge
    }
    
    // Adjust vertical position if menu goes off bottom edge
    if (top + menuHeight > viewportHeight - 8) {
      top = buttonRect.top - menuHeight - 4 // Position above button instead
    }
    
    return { top, left }
  }
  
  // Handle clicks outside of menu and modals
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close menu if clicked outside
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
      
      // Close preview modal if clicked outside
      if (isPreviewOpen && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsPreviewOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen, isPreviewOpen])

  // Close menu
  const closeMenu = () => setIsMenuOpen(false)

  // Handle menu toggle with position calculation
  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isMenuOpen) {
      const position = calculateMenuPosition()
      setMenuPosition(position)
    }
    setIsMenuOpen(!isMenuOpen)
  }

  // Preview product
  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    closeMenu()
    setIsPreviewOpen(true)
  }
  
  // Edit product
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    closeMenu()
    router.push(`/edit-product/${product.id}`)
  }

  // Toggle publish status
  const handlePublishToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    closeMenu()
    setIsLoading(true)
    setError(null)
    
    try {
      // Use the dedicated publish endpoint
      const formData = new FormData()
      formData.append('isPublic', (!product.isPublic).toString())
      
      const response = await fetch(`/api/products/${product.id}/publish`, {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.statusText}`)
      }
      
      const data = await response.json()
      onProductUpdate({
        ...product,
        isPublic: !product.isPublic,
        status: !product.isPublic ? 'active' : 'draft'
      })
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
      // Use the dedicated status endpoint
      const formData = new FormData()
      const newStatus = product.status === 'archived' ? 'active' : 'archived'
      formData.append('status', newStatus)
      
      const response = await fetch(`/api/products/${product.id}/status`, {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.statusText}`)
      }
      
      const data = await response.json()
      onProductUpdate({
        ...product,
        isArchived: newStatus === 'archived',
        status: newStatus
      })
    } catch (err) {
      console.error('Error updating product:', err)
      setError(err instanceof Error ? err.message : 'Failed to update product')
    } finally {
      setIsLoading(false)
    }
  }

  // Delete product
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    closeMenu()
    setShowDeleteModal(true)
  }
  
  // Handle actual deletion
  const handleDeleteProduct = async () => {
    setIsDeleting(true)
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
      setShowDeleteModal(false)
    } catch (err) {
      console.error('Error deleting product:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete product')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="relative">
      {/* Actions button */}
      <button
        ref={buttonRef}
        onClick={handleMenuToggle}
        className={`${variant === 'icon' ? 'p-2.5' : 'p-2'} rounded-xl hover:bg-stone-100 border border-stone-200`}
        aria-label="Product actions"
      >
        <Ellipsis size={variant === 'icon' ? 20 : 18} />
      </button>
      
      {/* Actions menu - now using fixed positioning */}
      {isMenuOpen && (
        <div 
          ref={menuRef} 
          className="fixed w-48 bg-white border border-stone-200 rounded-lg shadow-lg z-50"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`
          }}
        >
          <div className="p-1">
            <button
              onClick={handlePreview}
              className="flex items-center w-full px-3 py-2 text-sm hover:bg-stone-100 rounded-md"
            >
              <Eye size={16} className="mr-2" />
              Preview
            </button>
            
            <button
              onClick={handleEdit}
              className="flex items-center w-full px-3 py-2 text-sm hover:bg-stone-100 rounded-md"
            >
              <Edit size={16} className="mr-2" />
              Edit
            </button>
            
            <button
              onClick={handlePublishToggle}
              className="flex items-center w-full px-3 py-2 text-sm hover:bg-stone-100 rounded-md"
              disabled={isLoading}
            >
              {product.isPublic ? (
                <>
                  <FileText size={16} className="mr-2" />
                  Set as Draft
                </>
              ) : (
                <>
                  <Globe size={16} className="mr-2" />
                  Publish
                </>
              )}
            </button>
            
            <button
              onClick={handleArchiveToggle}
              className="flex items-center w-full px-3 py-2 text-sm hover:bg-stone-100 rounded-md"
              disabled={isLoading}
            >
              {product.isArchived ? (
                <>
                  <RotateCcw size={16} className="mr-2" />
                  Restore
                </>
              ) : (
                <>
                  <Archive size={16} className="mr-2" />
                  Archive
                </>
              )}
            </button>
            
            <button
              onClick={handleDeleteClick}
              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              disabled={isLoading}
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </button>
          </div>
        </div>
      )}
      
      {/* Preview modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={modalRef} className="py-10 bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Product Preview</h3>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 rounded-full hover:bg-stone-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              {/* Use the client-page component for preview */}
              <ClientProductPage 
                product={{
                  ...product,
                  user: { storeName: 'Your Store' },
                  bestSeller: false,
                  newRelease: false,
                  popular: false,
                  secureCheckout: true,
                  instantDownload: true,
                  refundPolicy: false,
                  customBadges: '[]',
                  customTrustIndicators: '[]',
                  whatsIncluded: '[]'
                }}
                slug={product.slug || product.id}
                isPreview={true}
              />
              
              <div className="mt-6 flex justify-end">
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
      )}
      
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-medium mb-4">Delete Product</h3>
            <p className="mb-6">Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone.</p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border rounded-md"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteProduct}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete Product'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Error message - also using fixed positioning */}
      {error && (
        <div 
          className="fixed w-64 bg-white border border-red-200 rounded-lg shadow-lg z-50 p-3"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`
          }}
        >
          <p className="text-sm text-red-600">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="absolute top-2 right-2 text-stone-400 hover:text-stone-600"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
