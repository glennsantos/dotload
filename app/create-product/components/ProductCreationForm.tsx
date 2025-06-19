'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus, AlertCircle, X } from 'lucide-react'
import ErrorModal from '@/app/components/ErrorModal'
import SuccessModal from '@/app/components/SuccessModal'
import { validateProductForm } from '@/lib/form-validation'
import ProductTypeSelection from './ProductTypeSelection'
import ProductInformation from './ProductInformation'
import ProductFiles from './ProductFiles'
import ProductPreview from './ProductPreview'
import ProductAdvancedOptions from './ProductAdvancedOptions'
import ProductStockPricing from './ProductStockPricing'
import { Button } from '@/components/ui/button'

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
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [successModalMessage, setSuccessModalMessage] = useState('')
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false)
  const prevCreatedProduct = useRef<Product | null>(null);
  
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

  const showError = (message: string) => {
    setErrorModalMessage(message)
    setErrorModalOpen(true)
  }

  const showSuccess = (message: string) => {
    setSuccessModalMessage(message)
    setSuccessModalOpen(true)
  }

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
      showError(firstError)
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
        
        const response = await fetch(`/api/products/${productId}`, {
          credentials: 'include'
        });
        
        if (!isMounted) return;
        
        if (response.status === 401 || response.status === 403) {
          // Let middleware handle the redirect
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
    console.log('[FORM] === FORM SUBMISSION START ===');
    console.log('[FORM] 🚀 Starting form submission...');
    
    // Validate form before submission
    if (!validateForm()) {
      console.log('[FORM] ❌ Form validation failed');
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Proactive authentication check before form submission
      console.log('[FORM] 🔍 Starting proactive authentication check before form submission...');
      
      // Check if cookies are available
      const allCookies = document.cookie;
      console.log('[FORM] All cookies available:', allCookies ? 'Yes' : 'No');
      console.log('[FORM] Cookie string length:', allCookies.length);
      
      // Check for token cookie specifically
      const tokenCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='));
      console.log('[FORM] Token cookie found:', tokenCookie ? 'Yes' : 'No');
      if (tokenCookie) {
        console.log('[FORM] Token cookie preview:', tokenCookie.substring(0, 50) + '...');
      }
      
      const authResponse = await fetch('/api/auth/me', { 
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[FORM] Auth check response status:', authResponse.status);
      console.log('[FORM] Auth check response ok:', authResponse.ok);
      
      if (!authResponse.ok) {
        console.log('[FORM] ❌ Authentication check failed');
        console.log('[FORM] Response status:', authResponse.status);
        console.log('[FORM] Response statusText:', authResponse.statusText);
        
        try {
          const errorData = await authResponse.json();
          console.log('[FORM] Error response data:', errorData);
        } catch (e) {
          console.log('[FORM] Could not parse error response as JSON');
        }
        
        // User is not authenticated, redirect to login with current page as callback
        const currentPath = window.location.pathname;
        console.log('[FORM] Redirecting to login with callback:', currentPath);
        console.log('[FORM] === FORM SUBMISSION END (AUTH FAILED) ===');
        router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
        return;
      }
      
      // Parse the auth response
      const authData = await authResponse.json();
      console.log('[FORM] ✅ Authentication check passed');
      console.log('[FORM] Authenticated user:', authData.user?.email);
      console.log('[FORM] User ID:', authData.user?.id);
      console.log('[FORM] Proceeding with form submission...');
      
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
      
      // Log advanced options data before submission
      console.log('ProductCreationForm - Advanced Options Data:', {
        whatsIncluded: productData.whatsIncluded,
        curriculum: productData.curriculum,
        badges: productData.badges,
        trustIndicators: productData.trustIndicators
      })
      
      // Always include whatsIncluded and curriculum, even if empty
      formData.append('whatsIncluded', JSON.stringify(productData.whatsIncluded || []))
      console.log('ProductCreationForm - Appending whatsIncluded:', JSON.stringify(productData.whatsIncluded || []))
      
      // Always include curriculum, even if empty
      formData.append('curriculum', JSON.stringify(productData.curriculum || []))
      console.log('ProductCreationForm - Appending curriculum:', JSON.stringify(productData.curriculum || []))
      
      // Add badges and trust indicators
      formData.append('badges', JSON.stringify(productData.badges))
      formData.append('trustIndicators', JSON.stringify(productData.trustIndicators))
      
      // Submit product to backend
      const url = isEditing ? `/api/products/${productId}` : '/api/products'
      const method = isEditing ? 'PUT' : 'POST'
      
      console.log('[FORM] 🔍 Submitting product to backend...');
      console.log('[FORM] URL:', url);
      console.log('[FORM] Method:', method);
      
      const response = await fetch(url, {
        method,
        body: formData,
        credentials: 'include'
      })
      
      console.log('[FORM] Product submission response status:', response.status);
      console.log('[FORM] Product submission response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json()
        console.log('[FORM] ❌ Product submission failed:', errorData);
        console.log('[FORM] === FORM SUBMISSION END (SUBMISSION FAILED) ===');
        throw new Error(errorData.details || `Failed to ${isEditing ? 'update' : 'create'} product`)
      }
      
      // Get the created/updated product data
      const responseData = await response.json()
      console.log('[FORM] ✅ Product submission successful');
      setCreatedProduct(responseData.product || responseData)
      
      // Upload content files if any
      if (productData.contentFiles.length > 0) {
        try {
          console.log('[FORM] 🔍 Starting file upload...');
          // Check file sizes before uploading
          const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit
          const largeFiles = productData.contentFiles.filter(file => file.size > MAX_FILE_SIZE);
          
          if (largeFiles.length > 0) {
            const fileNames = largeFiles.map(file => `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`).join(', ');
            throw new Error(`The following files exceed the 50MB size limit: ${fileNames}`);
          }
          
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
          
          console.log(`[FORM] Uploading ${productData.contentFiles.length} files for product ${newProductId}`)
          
          // Send files to the product endpoint (same approach for both create and edit modes)
          const filesResponse = await fetch(`/api/products/${newProductId}`, {
            method: 'PUT',
            body: filesFormData,
            credentials: 'include'
          })
          
          if (!filesResponse.ok) {
            const errorData = await filesResponse.json()
            console.error('[FORM] Failed to upload content files:', errorData)
            // Continue anyway, the product was created/updated successfully
          } else {
            console.log('[FORM] ✅ Successfully uploaded content files')
          }
        } catch (fileError) {
          console.error('[FORM] Error during file upload:', fileError)
          // Continue anyway, the product was created/updated successfully
        }
      }
      
      // Success - update UI
      setIsSubmitting(false)
      console.log('[FORM] ✅ Form submission completed successfully');
      console.log('[FORM] === FORM SUBMISSION END (SUCCESS) ===');
      
      if (isEditing) {
        router.push(`/edit-product/${productId}`)
      }
    } catch (error: unknown) {
      console.error('[FORM] ❌ Product submission error:', error)
      console.log('[FORM] === FORM SUBMISSION END (ERROR) ===');
      if (error instanceof Error) {
        showError(`Error: ${error.message}`)
      } else {
        showError('An unknown error occurred')
      }
      setIsSubmitting(false)
    }
  }
  
  useEffect(() => {
    if (createdProduct && !prevCreatedProduct.current) {
      // Use setTimeout to ensure the DOM has updated before scrolling
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Also try scrolling to the document element for better browser compatibility
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 100);
    }
    prevCreatedProduct.current = createdProduct;
  }, [createdProduct]);
  
  return (
    <div className="min-h-screen bg-background mt-20">
      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="Error"
        message={errorModalMessage}
      />
      
      {/* Success Modal */}
      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Success"
        message={successModalMessage}
      />
      {!createdProduct ? (
        <div>
          {/* Validation errors alert */}
          {showValidationErrors && Object.keys(validationErrors).length > 0 && (
            <div className="mx-auto max-w-7xl p-4 mt-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-destructive mr-2 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-destructive">
                    Please fix the following errors:
                  </h3>
                  <ul className="mt-2 text-sm text-destructive list-disc list-inside">
                    {Object.entries(validationErrors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="p-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left side - Form */}
            <div className="md:col-span-7">
                <div className="claude-card p-6">
              {/* Tab Navigation */}
                  <div className="w-full flex bg-background border border-border rounded-2xl overflow-hidden mb-8">
                <button
                  onClick={() => handleTabChange('setup')}
                      className={`w-1/2 m-1 py-3 px-6 text-sm font-light rounded-2xl transition-colors ${
                    activeTab === 'setup'
                      ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-primary hover:bg-muted/50'
                  }`}
                >
                  Product Setup
                </button>
                <button
                  onClick={() => handleTabChange('advanced')}
                      className={`w-1/2 m-1 py-3 px-6 text-sm font-light rounded-2xl transition-colors ${
                    activeTab === 'advanced'
                      ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-primary hover:bg-muted/50'
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
                  <div className="flex justify-between mt-8 pt-6 border-t border-border">
                    <Button 
                  onClick={() => router.push('/products')} 
                      variant="outline"
                      className="hidden sm:flex rounded-2xl font-light"
                >
                  Cancel
                    </Button>
                    <Button 
                  onClick={handleSubmit} 
                      className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-light"
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? isEditing ? 'Updating Product...' : 'Creating Product...' 
                    : isEditing ? 'Update Product' : 'Create Product'
                  }
                    </Button>
                  </div>
              </div>
            </div>
            
            {/* Right side - Product Preview */}
            <div className="md:col-span-5">
              <ProductPreview productData={productData} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>          
          <div className="p-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left side - Success message and actions */}
              <div className="lg:col-span-5">
                <div className="claude-card p-6">
                  <h2 className="text-xl font-light mb-4 text-foreground">Product {isEditing ? 'Updated' : 'Created'} Successfully!</h2>
                  <p className="font-light text-muted-foreground mb-6">Your product is now available for purchase.</p>
                  
                  <div className="p-4 border border-border rounded-2xl mb-6">
                    <h3 className="font-light mb-2 text-foreground">Product URL</h3>
                    <div className="flex mb-4">
                      <input
                        type="text"
                        value={`${window.location.origin}/p/${createdProduct.slug || createdProduct.id}`}
                        readOnly
                        className="flex-1 p-2 border border-border rounded-l-2xl bg-muted text-foreground"
                      />
                      <button 
                        onClick={() => {
                          const url = `${window.location.origin}/p/${createdProduct.slug || createdProduct.id}`;
                          if (navigator?.clipboard) {
                            navigator.clipboard.writeText(url)
                              .then(() => showSuccess('URL copied to clipboard'))
                              .catch(() => showError('Failed to copy URL'));
                          }
                        }}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-r-2xl font-light transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mt-8 font-light flex-wrap mb-4">
                    {isEditing && (
                      <Button onClick={() => window.location.reload()} variant="outline" className="rounded-2xl font-light">
                        Continue Editing
                      </Button>
                    )}
                    <Button onClick={() => setIsPreviewFullscreen(true)} variant="outline" className="rounded-2xl font-light">
                      Preview Product
                    </Button>
                    <Button onClick={() => router.push('/products')} variant="default" className="rounded-2xl font-light">
                      <span className="flex items-center gap-2">
                        <ChevronLeft /> Back to Products
                      </span>
                    </Button>
                  </div>

                  {/* Share Buttons */}
                  <div className="p-4 border border-border rounded-2xl mb-6">
                    <h3 className="font-light mb-3 text-foreground">Share Your Product</h3>
                    <p className="text-sm text-muted-foreground mb-4">Share your product on social media</p>
                    <div className="flex gap-2 sm:gap-3 flex-wrap">
                      <button 
                        onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/p/${createdProduct.slug || createdProduct.id}`)}&text=${encodeURIComponent(`Check out ${createdProduct.name}`)}`, '_blank')} 
                        className="px-2 py-2 sm:px-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-2xl transition-colors text-xs sm:text-sm flex-1 sm:flex-none font-light"
                      >
                        X (Twitter)
                      </button>
                      <button 
                        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/p/${createdProduct.slug || createdProduct.id}`)}`, '_blank')} 
                        className="px-2 py-2 sm:px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl transition-colors text-xs sm:text-sm flex-1 sm:flex-none font-light"
                      >
                        Facebook
                      </button>
                      <button 
                        onClick={() => {
                          // Instagram doesn't have a direct share URL, so we copy the link and suggest manual sharing
                          const url = `${window.location.origin}/p/${createdProduct.slug || createdProduct.id}`;
                          if (navigator?.clipboard) {
                            navigator.clipboard.writeText(url)
                              .then(() => showSuccess('Link copied! You can now paste it in your Instagram story or bio.'))
                              .catch(() => showError('Failed to copy URL'));
                          }
                        }}
                        className="px-2 py-2 sm:px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl transition-colors text-xs sm:text-sm flex-1 sm:flex-none font-light"
                      >
                        Instagram
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Product Preview */}
              <div className={`lg:col-span-7 ${isPreviewFullscreen ? 'flex' : 'hidden'}`}>
                <ProductPreview 
                  productData={createdProduct} 
                  variant="success" 
                  externalFullscreen={isPreviewFullscreen}
                  onToggleFullscreen={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile submit button - only visible on small screens */}
      {!createdProduct && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <Button 
            onClick={handleSubmit} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-light"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? isEditing ? 'Updating Product...' : 'Creating Product...' 
              : isEditing ? 'Update Product' : 'Create Product'
            }
          </Button>
        </div>
      )}
    </div>
  )
}

export default ProductCreationForm;
