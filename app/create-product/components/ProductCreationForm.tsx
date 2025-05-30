'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus, AlertCircle } from 'lucide-react'
import ErrorModal from '@/app/components/ErrorModal'
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

const ProductCreationForm = ({ isEditing = false, productId = '' }: ProductCreationFormProps) => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('setup') // 'setup' or 'advanced'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [errorModalMessage, setErrorModalMessage] = useState('')
  
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

  // Validate form data - memoized to prevent infinite loops
  const validateForm = useCallback(() => {
    const { isValid, errors } = validateProductForm(productData)
    setValidationErrors(errors)
    setShowValidationErrors(!isValid)
    
    // If not valid, show error modal with first error
    if (!isValid) {
      const firstError = Object.values(errors)[0]
      setErrorModalMessage(firstError)
      setErrorModalOpen(true)
    }
    
    return isValid
  }, [productData])
  
  // Effect to fetch product data when in editing mode
  useEffect(() => {
    // Only fetch data if we're in editing mode and have a productId
    if (!isEditing || !productId) return;
    
    let isMounted = true;
    
    const fetchProductData = async () => {
      try {
        // Add a small delay to prevent rapid consecutive calls
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const response = await fetch(`/api/products/${productId}`);
        
        if (!isMounted) return;
        
        if (response.status === 401 || response.status === 403) {
          // Redirect to login if unauthorized
          router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch product: ${response.status}`);
        }
        
        const product = await response.json();
        
        if (!isMounted) return;
        
        // Process existing files information if available
        let existingFiles = [];
        if (product.files && Array.isArray(product.files) && product.files.length > 0) {
          existingFiles = product.files.map((file: any) => ({
            id: file.id,
            name: file.filename,
            path: file.path,
            size: file.size || 0,
            type: file.mimetype,
            isExisting: true // Flag to identify existing files
          }));
        }
        
        // Only update state if component is still mounted
        if (!isMounted) return;
        
        // The API now returns a processed product with all fields properly formatted
        setProductData({
          id: product.id,
          name: product.name || '',
          type: product.type || '',
          price: product.price || 0,
          description: product.description || '',
          slug: product.slug || '',
          coverImagePath: product.coverImagePath || '',
          contentFiles: [], // We can't fetch actual File objects, just display existing files
          existingFiles: existingFiles, // Store existing files separately
          contentLinks: Array.isArray(product.contentLinks) ? [...product.contentLinks] : [],
          currency: product.currency || 'PHP',
          stockQuantity: product.stockQuantity || null,
          variants: Array.isArray(product.variations) ? product.variations.map((v: any) => ({
            name: v.name,
            displayType: 'dropdown',
            options: v.options ? v.options.split(',') : []
          })) : [],
          inventorySettings: {
            allowPreOrders: product.inventorySettings?.allowPreOrders || product.allowPreOrders || false
          },
          downloadSettings: {
            downloadLimit: product.downloadSettings?.downloadLimit || product.downloadLimit || 5,
            linkExpiration: product.downloadSettings?.linkExpiration || product.linkExpiration || 30
          },
          paymentOptions: {
            allowPayWhatYouWant: product.paymentOptions?.allowPayWhatYouWant || product.allowPayWhatYouWant || false,
            offerCoupons: product.paymentOptions?.offerCoupons || product.offerCoupons || false,
          },
          whatsIncluded: Array.isArray(product.whatsIncluded) ? [...product.whatsIncluded] : [],
          curriculum: Array.isArray(product.curriculum) ? [...product.curriculum] : [],
          badges: {
            bestSeller: product.badges?.bestSeller || product.bestSeller || false,
            newRelease: product.badges?.newRelease || product.newRelease || false,
            popular: product.badges?.popular || product.popular || false,
            custom: Array.isArray(product.badges?.custom) ? [...product.badges.custom] : []
          },
          trustIndicators: {
            secureCheckout: product.trustIndicators?.secureCheckout !== undefined 
              ? product.trustIndicators.secureCheckout 
              : product.secureCheckout !== undefined
                ? product.secureCheckout
                : true,
            instantDownload: product.trustIndicators?.instantDownload !== undefined 
              ? product.trustIndicators.instantDownload 
              : product.instantDownload !== undefined
                ? product.instantDownload
                : true,
            refundPolicy: product.trustIndicators?.refundPolicy !== undefined 
              ? product.trustIndicators.refundPolicy 
              : product.refundPolicy !== undefined
                ? product.refundPolicy
                : false,
            custom: Array.isArray(product.trustIndicators?.custom) 
              ? [...product.trustIndicators.custom] 
              : []
          }
        });
      } catch (error) {
        console.error('Error fetching product data:', error);
        if (isMounted) {
          router.push('/products');
        }
      }
    };
    
    fetchProductData();
    
    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted = false;
    };
  }, [isEditing, productId, router]);
  
  // Effect to validate form when validation status changes
  useEffect(() => {
    if (showValidationErrors) {
      validateForm()
    }
  }, [showValidationErrors, validateForm])
  
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
      
      // Only append description if it's not empty
      if (productData.description && productData.description.trim() !== '') {
        formData.append('description', productData.description)
      }
      
      // Always include slug for edit mode
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
      if (productData.contentFiles.length > 0) {
        try {
          // Get the product ID from the response
          const newProductId = responseData.product?.id || responseData.id
          
          // Create a new FormData for the files
          const filesFormData = new FormData()
          
          // Add basic product info to ensure the request is valid
          filesFormData.append('name', productData.name)
          filesFormData.append('price', productData.price.toString())
          
          // Add all content files to the form data with unique keys
          for (let i = 0; i < productData.contentFiles.length; i++) {
            filesFormData.append(`contentFile${i}`, productData.contentFiles[i])
          }
          
          console.log(`Uploading ${productData.contentFiles.length} files for product ${newProductId}`)
          
          // Send files to the product endpoint (same approach for both create and edit modes)
          const filesResponse = await fetch(`/api/products/${newProductId}`, {
            method: 'PUT',
            body: filesFormData,
            credentials: 'include'
          })
          
          if (!filesResponse.ok) {
            const errorData = await filesResponse.json()
            console.error('Failed to upload content files:', errorData)
            // Continue anyway, the product was created/updated successfully
          } else {
            console.log('Successfully uploaded content files')
          }
        } catch (fileError) {
          console.error('Error during file upload:', fileError)
          // Continue anyway, the product was created/updated successfully
        }
      }
      
      // Success - update UI
      setIsSubmitting(false)
      
      if (isEditing) {
        router.push(`/edit-product/${productId}`)
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
      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="Validation Error"
        message={errorModalMessage}
      />
      {!createdProduct ? (
        <div>
          <header className="p-6">

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
              <div className="w-full flex bg-white border rounded-full overflow-hidden mx-auto rounded-full">
                <button
                  onClick={() => handleTabChange('setup')}
                  className={`w-1/2 m-1 py-3 px-6 text-sm font-light rounded-full transition-colors ${
                    activeTab === 'setup'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  Product Setup
                </button>
                <button
                  onClick={() => handleTabChange('advanced')}
                  className={`w-1/2 m-1 py-3 text-sm font-light rounded-full transition-colors ${
                    activeTab === 'advanced'
                      ? 'bg-emerald-100 text-emerald-700'
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
          <header className="mt-10 p-6 flex justify-center items-center">
            <h1 className="text-3xl font-light truncate">
              {createdProduct.name}
            </h1>
          </header>
          
          <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-light mb-4">Product {isEditing ? 'Updated' : 'Created'} Successfully!</h2>
              <p className="font-light text-gray-600 mb-4">Your product has been published and is now available for purchase.</p>
              
              <div className="p-4 border rounded-3xl mb-4">
                <h3 className="font-light mb-2">Product URL</h3>
                <div className="flex mb-4">
                  <input
                    type="text"
                    value={`${window.location.origin}/p/${createdProduct.slug || createdProduct.id}`}
                    readOnly
                    className="flex-1 p-2 border rounded-l-2xl bg-gray-100"
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
                    className="px-4 py-2 bg-emerald-600 text-white rounded-r-2xl"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div className="flex gap-4 mt-8 font-light">
                <Link href={`/p/${createdProduct.slug}`} className="px-4 py-2 bg-emerald-600 text-white rounded-2xl">
                  View Product
                </Link>
                {isEditing && (
                  <button onClick={() => window.location.reload()} className="px-4 py-2 border rounded-2xl">
                    Continue Editing
                  </button>
                )}
                <Link href="/products" className="px-4 py-2 border rounded-2xl">
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

export default ProductCreationForm;
