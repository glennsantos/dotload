'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus, AlertCircle } from 'lucide-react'
import { validateProductForm } from '@/lib/form-validation'
import ProductTypeSelection from './ProductTypeSelection'
import ProductInformation from './ProductInformation'
import ProductFiles from './ProductFiles'
import ProductPreview from './ProductPreview'
import ProductAdvancedOptions from './ProductAdvancedOptions'
import ProductStockPricing from './ProductStockPricing'

// Define the Product type
export type Product = {
  id?: string
  name: string
  slug?: string
  type: string
  price: number
  description?: string
  coverImagePath?: string
  coverImage?: File | null
  contentFiles: File[]
  existingFiles?: Array<{
    id: string
    name: string
    path: string
    size: number
    type: string
    isExisting: boolean
  }>
  contentLinks: string[]
  currency: string
  // Physical product fields
  stockQuantity?: number | null
  variants?: {
    name: string
    displayType: string
    options: string[]
  }[]
  inventorySettings?: {
    allowPreOrders: boolean
  }
  // Digital product fields
  downloadSettings: {
    downloadLimit: number
    linkExpiration: number
  }
  paymentOptions: {
    allowPayWhatYouWant: boolean
    offerCoupons: boolean
  }
  whatsIncluded: string[]
  curriculum: { title: string; items: string[] }[]
  badges: {
    bestSeller: boolean
    newRelease: boolean
    popular: boolean
    custom: string[]
  }
  trustIndicators: {
    secureCheckout: boolean
    instantDownload: boolean
    refundPolicy: boolean
    custom: string[]
  }
}

interface ProductCreationFormProps {
  isEditing?: boolean;
  productId?: string;
}

export default function ProductCreationForm({ isEditing = false, productId = '' }: ProductCreationFormProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('setup') // 'setup' or 'advanced'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  
  // Initialize product data with default values
  const [productData, setProductData] = useState<Product>({
    name: '',
    type: '',
    price: 0,
    description: '',
    slug: '',
    coverImage: null,
    contentFiles: [],
    contentLinks: [],
    currency: 'PHP', // Default currency set to PHP
    stockQuantity: null, // For physical products, null means unlimited
    variants: [], // For physical products, product variants like size, color, etc.
    inventorySettings: {
      allowPreOrders: false // For physical products, whether to allow pre-orders
    },
    downloadSettings: {
      downloadLimit: 5,
      linkExpiration: 30
    },
    paymentOptions: {
      allowPayWhatYouWant: false,
      offerCoupons: false,
    },
    whatsIncluded: [],
    curriculum: [],
    badges: {
      bestSeller: false,
      newRelease: false,
      popular: false,
      custom: []
    },
    trustIndicators: {
      secureCheckout: true,
      instantDownload: true,
      refundPolicy: false,
      custom: []
    }
  })

  // Handle tab switching
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  // Handle cancel
  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel? Your changes will be lost.")) {
      router.push("/products")
    }
  }

  // Validate form data
  const validateForm = () => {
    const { isValid, errors } = validateProductForm(productData)
    setValidationErrors(errors)
    setShowValidationErrors(!isValid)
    return isValid
  }
  
  // Effect to fetch product data when in editing mode
  useEffect(() => {
    if (isEditing && productId) {
      const fetchProductData = async () => {
        try {
          const response = await fetch(`/api/products/${productId}`);
          
          if (response.status === 401 || response.status === 403) {
            // Redirect to login if unauthorized
            router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
            return;
          }
          
          if (response.ok) {
            const product = await response.json();
            
            // Fetch existing files information if available
            let existingFiles = [];
            if (product.files && Array.isArray(product.files) && product.files.length > 0) {
              existingFiles = product.files.map((file: any) => ({
                id: file.id,
                name: file.filename,
                path: file.path,
                size: file.size,
                type: file.mimetype,
                isExisting: true // Flag to identify existing files
              }));
            }
            
            // Transform API data to match our form structure
            setProductData({
              ...productData,
              id: product.id,
              name: product.name || '',
              type: product.type || '',
              price: product.price || 0,
              description: product.description || '',
              slug: product.slug || '',
              coverImagePath: product.coverImagePath || '',
              contentFiles: [], // We can't fetch actual File objects, just display existing files
              existingFiles: existingFiles, // Store existing files separately
              contentLinks: Array.isArray(product.contentLinks) ? product.contentLinks : [],
              currency: product.currency || 'PHP',
              stockQuantity: product.stockQuantity || null,
              variants: Array.isArray(product.variants) ? product.variants : [],
              inventorySettings: product.inventorySettings || {
                allowPreOrders: false
              },
              downloadSettings: product.downloadSettings || {
                downloadLimit: 5,
                linkExpiration: 30
              },
              paymentOptions: product.paymentOptions || {
                allowPayWhatYouWant: false,
                offerCoupons: false,
              },
              whatsIncluded: Array.isArray(product.whatsIncluded) ? product.whatsIncluded : [],
              curriculum: Array.isArray(product.curriculum) ? product.curriculum : [],
              badges: {
                bestSeller: product.badges?.bestSeller || false,
                newRelease: product.badges?.newRelease || false,
                popular: product.badges?.popular || false,
                custom: Array.isArray(product.badges?.custom) ? product.badges.custom : []
              },
              trustIndicators: {
                secureCheckout: product.trustIndicators?.secureCheckout || true,
                instantDownload: product.trustIndicators?.instantDownload || true,
                refundPolicy: product.trustIndicators?.refundPolicy || false,
                custom: Array.isArray(product.trustIndicators?.custom) ? product.trustIndicators.custom : []
              }
            });
          } else {
            console.error('Failed to fetch product data');
            // Redirect to products page if product not found
            router.push('/products');
          }
        } catch (error) {
          console.error('Error fetching product data:', error);
          router.push('/products');
        }
      };
      
      fetchProductData();
    }
  }, [isEditing, productId, router, productData]);
  
  // Effect to validate form when product data changes
  useEffect(() => {
    if (showValidationErrors) {
      validateForm()
    }
  }, [productData, showValidationErrors])
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate form before submission
      if (!validateForm()) {
        // Scroll to the top to show validation errors
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      
      setIsSubmitting(true)
      
      // Prepare form data for product creation or update
      const formData = new FormData()
      
      // Add basic product details
      formData.append('name', productData.name)
      formData.append('type', productData.type)
      formData.append('price', productData.price.toString())
      formData.append('description', productData.description || '')
      formData.append('slug', productData.slug || '')
      formData.append('currency', productData.currency)
      
      // Add cover image if exists and is a File object (not just a path)
      if (productData.coverImage instanceof File) {
        formData.append('coverImage', productData.coverImage)
      }
      
      // Add physical product details if applicable
      if (productData.type === 'physical_product') {
        formData.append('stockQuantity', productData.stockQuantity?.toString() || '')
        
        // Add variants if any
        if (productData.variants && productData.variants.length > 0) {
          formData.append('variants', JSON.stringify(productData.variants))
        }
        
        // Add inventory settings
        if (productData.inventorySettings) {
          formData.append('inventorySettings', JSON.stringify(productData.inventorySettings))
        }
      }
      
      // Add digital product details if applicable
      if (productData.type === 'digital_product') {
        // Add content links if any
        if (productData.contentLinks.length > 0) {
          formData.append('contentLinks', JSON.stringify(productData.contentLinks))
        }
        
        // Add download settings
        formData.append('downloadSettings', JSON.stringify(productData.downloadSettings))
      }
      
      // Add payment options
      formData.append('paymentOptions', JSON.stringify(productData.paymentOptions))
      
      // Add what's included items if any
      if (productData.whatsIncluded.length > 0) {
        formData.append('whatsIncluded', JSON.stringify(productData.whatsIncluded))
      }
      
      // Add curriculum items if any
      if (productData.curriculum.length > 0) {
        formData.append('curriculum', JSON.stringify(productData.curriculum))
      }
      
      // Add badges and trust indicators
      formData.append('badges', JSON.stringify(productData.badges))
      formData.append('trustIndicators', JSON.stringify(productData.trustIndicators))
      
      // Submit product to backend
      const url = isEditing ? `/api/products/${productId}` : '/api/products'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        body: formData,
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || `Failed to ${isEditing ? 'update' : 'create'} product`)
      }
      
      // Get the created/updated product data
      const responseData = await response.json()
      setCreatedProduct(responseData.product || responseData)
      
      // Upload content files if any
      if (productData.contentFiles.length > 0 && (responseData.product?.id || responseData.id)) {
        const filesFormData = new FormData()
        
        // Add all content files to the form data
        for (let i = 0; i < productData.contentFiles.length; i++) {
          filesFormData.append('files', productData.contentFiles[i])
        }
        
        // Add product ID to the form data
        const productId = responseData.product?.id || responseData.id
        filesFormData.append('productId', productId)
        
        // Upload files
        const filesResponse = await fetch('/api/files/upload', {
          method: 'POST',
          body: filesFormData,
          credentials: 'include'
        })
        
        if (!filesResponse.ok) {
          console.error('Failed to upload content files')
          // Continue anyway, the product was created/updated successfully
        }
      }
      
      // Success - update UI
      setIsSubmitting(false)
      
      // If editing, redirect back to products page after successful update
      if (isEditing) {
        router.push('/products')
      }
    } catch (error: unknown) {
      console.error('Product submission error:', error)
      if (error instanceof Error) {
        alert(`Error: ${error.message}`)
      } else {
        alert('An unknown error occurred')
      }
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-white">
      {!createdProduct ? (
        <div>
          <header className="p-6 border-b">

             {/* Back to Dashboard button */}
             <Link href="/products" className="text-sm text-stone-500 hover:text-stone-700">
              <span className="flex items-center">
                <ChevronLeft size={16} className="mr-1" />
                Back to Dashboard
              </span>
            </Link>
            
            <h1 className="text-3xl font-light truncate mt-4">
              {isEditing ? 'Edit Product' : 'Create New Product'}
            </h1>
            
           
          </header>
          
          {/* Validation errors alert */}
          {showValidationErrors && Object.keys(validationErrors).length > 0 && (
            <div className="mx-auto max-w-7xl p-4 mt-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Please fix the following errors:
                  </h3>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {Object.entries(validationErrors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6">
            {/* Left side - Form */}
            <div className="md:col-span-7">

              {/* Tab Navigation */}
              <div className="flex bg-white border rounded-full overflow-hidden w-full max-w-md mx-auto">
                <button
                  onClick={() => handleTabChange('setup')}
                  className={`w-1/2 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'setup'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  Product Setup
                </button>
                <button
                  onClick={() => handleTabChange('advanced')}
                  className={`w-1/2 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'advanced'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  Advanced Options
                </button>
              </div>


              {activeTab === 'setup' && (
                <div className="space-y-8">
                  <ProductTypeSelection 
                    productData={productData} 
                    setProductData={setProductData} 
                  />
                  
                  <ProductInformation 
                    productData={productData} 
                    setProductData={setProductData} 
                  />
                  <ProductStockPricing
                    productData={productData}
                    setProductData={setProductData}
                  />
                  
                  {/* Physical product components moved to ProductAdvancedOptions */}
                  
                  {productData.type === 'digital_product' && (
                    <ProductFiles 
                      productData={productData} 
                      setProductData={setProductData} 
                    />
                  )}
                </div>
              )}
              
              {activeTab === 'advanced' && (
                <ProductAdvancedOptions 
                  productData={productData} 
                  setProductData={setProductData} 
                />
              )}
              
              {/* Form Actions */}
              <div className="flex justify-between mt-8">
                <button 
                  onClick={() => router.push('/products')} 
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit} 
                  className="px-4 py-2 bg-emerald-500 text-white rounded-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? isEditing ? 'Updating Product...' : 'Creating Product...' 
                    : isEditing ? 'Update Product' : 'Create Product'
                  }
                </button>
              </div>
            </div>
            
            {/* Right side - Product Preview */}
            <div className="md:col-span-5">
              <ProductPreview productData={productData} />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <header className="p-6 border-b flex justify-between items-center">
            <h1 className="text-3xl font-normal truncate">
              {createdProduct.name}
            </h1>
          </header>
          
          <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-medium mb-4">Product {isEditing ? 'Updated' : 'Created'} Successfully!</h2>
              <p className="text-gray-600 mb-4">Your product has been published and is now available for purchase.</p>
              
              <div className="p-4 border rounded-md mb-4">
                <h3 className="font-medium mb-2">Product URL</h3>
                <div className="flex mb-4">
                  <input
                    type="text"
                    value={`${window.location.origin}/p/${createdProduct.slug || createdProduct.id}`}
                    readOnly
                    className="flex-1 p-2 border rounded-l-md bg-gray-100"
                  />
                  <button 
                    onClick={() => {
                      const url = `${window.location.origin}/p/${createdProduct.slug || createdProduct.id}`;
                      if (navigator?.clipboard) {
                        navigator.clipboard.writeText(url)
                          .then(() => alert('URL copied to clipboard'))
                          .catch(() => alert('Failed to copy URL'));
                      }
                    }}
                    className="px-4 py-2 bg-black text-white rounded-r-md"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <Link href={`/products/${createdProduct.id}`} className="px-4 py-2 bg-emerald-500 text-white rounded-md">
                  View Product
                </Link>
                <Link href="/products" className="px-4 py-2 border rounded-md">
                  Back to Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile submit button - only visible on small screens */}
      {!createdProduct && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <button 
            onClick={handleSubmit} 
            className="w-full px-4 py-3 rounded-md bg-emerald-500 text-white flex items-center justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? isEditing ? 'Updating Product...' : 'Creating Product...' 
              : isEditing ? 'Update Product' : 'Create Product'
            }
          </button>
        </div>
      )}
    </div>
  )
}
