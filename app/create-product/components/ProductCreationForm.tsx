'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import ProductTypeSelection from './ProductTypeSelection'
import ProductInformation from './ProductInformation'
import ProductFiles from './ProductFiles'
import ProductPreview from './ProductPreview'
import StepNavigation from './StepNavigation'

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
  contentLinks: string[]
  currency: string
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

export default function ProductCreationForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null)
  
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

  // Calculate total steps
  const totalSteps = 3

  // Handle next step
  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else if (step === totalSteps) {
      handleSubmit()
    }
  }

  // Handle back step
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel? Your changes will be lost.")) {
      router.push("/products")
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      // Prepare form data for product creation
      const formData = new FormData()
      
      // Add basic product details
      formData.append('name', productData.name)
      formData.append('type', productData.type)
      formData.append('price', productData.price.toString())
      formData.append('description', productData.description || '')
      formData.append('slug', productData.slug || '')
      formData.append('currency', productData.currency)
      
      // Add payment options
      formData.append('paymentOptions', JSON.stringify(productData.paymentOptions))
      
      // Add download settings for digital products
      if (productData.type === 'digital_product') {
        formData.append('downloadSettings', JSON.stringify(productData.downloadSettings))
      }
      
      // Add cover image if any
      if (productData.coverImage) {
        formData.append('coverImage', productData.coverImage)
      }
      
      // Add content links if any
      if (productData.contentLinks.length > 0) {
        formData.append('contentLinks', JSON.stringify(productData.contentLinks))
      }
      
      // Add what's included, curriculum, badges, and trust indicators
      formData.append('whatsIncluded', JSON.stringify(productData.whatsIncluded))
      formData.append('curriculum', JSON.stringify(productData.curriculum))
      formData.append('badges', JSON.stringify(productData.badges))
      formData.append('trustIndicators', JSON.stringify(productData.trustIndicators))
      
      // Submit product to backend using Next.js API route
      const productResponse = await fetch('/api/products', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!productResponse.ok) {
        const errorData = await productResponse.json()
        throw new Error(errorData.details || 'Failed to create product')
      }

      const productResult = await productResponse.json()
      
      // Upload content files if any
      if (productData.contentFiles.length > 0 && productResult.product?.id) {
        const filesFormData = new FormData()
        
        // Add all content files to the files form data
        productData.contentFiles.forEach((file: File) => {
          filesFormData.append('files', file)
        })
        
        // Upload files to the dedicated endpoint
        try {
          const filesResponse = await fetch(`/api/products/${productResult.product.id}/files`, {
            method: 'POST',
            body: filesFormData,
            credentials: 'include'
          })
          
          if (filesResponse.ok) {
            const filesResult = await filesResponse.json()
            
            // Update the product in state with the uploaded files
            if (filesResult.files && filesResult.files.length > 0) {
              productResult.product.files = [
                ...productResult.product.files || [],
                ...filesResult.files
              ]
            }
          }
        } catch (filesError) {
          console.error('Error uploading files:', filesError)
          // Don't throw here, we already have the product created
        }
      }
      
      // Set the created product in state and move to success step
      if (productResult.product) {
        setCreatedProduct(productResult.product)
        setStep(totalSteps + 1)
      }
      
      setIsSubmitting(false)
    } catch (error: unknown) {
      console.error('Product submission error:', error)
      if (error instanceof Error) {
        alert(error.message)
      } else {
        alert('An unknown error occurred')
      }
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Step indicator */}
      <div className="bg-gray-50 py-3 px-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm">
            <Link href="/products" className="text-gray-600 hover:text-black">
              Products
            </Link>
            <ChevronRight size={16} className="mx-2 text-gray-400" />
            <span className="font-medium">New Product</span>
          </div>
          {step <= totalSteps && (
            <div className="text-sm text-gray-600">
              Step {step} of {totalSteps}
            </div>
          )}
        </div>
      </div>

      {/* Step 1: Product Type and Basic Information */}
      {step === 1 && (
        <div>
          <header className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-normal">Publish your first product</h1>
              <div className="hidden sm:flex gap-2">
                <button 
                  onClick={handleNext} 
                  className="px-4 py-2 bg-black text-white rounded-md"
                >
                  Next
                </button>
              </div>
            </div>
          </header>

          <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left side - Product Setup */}
            <div className="md:col-span-7">
              <div className="mb-8">
                <ProductInformation 
                  productData={productData} 
                  setProductData={setProductData} 
                />
                
                <ProductTypeSelection 
                  productData={productData} 
                  setProductData={setProductData} 
                />
              </div>
            </div>
            
            {/* Right side - Product Preview */}
            <div className="md:col-span-5">
              <ProductPreview productData={productData} />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Product Customization */}
      {step === 2 && (
        <div className="p-6">
          <h2 className="text-xl font-medium mb-4">Product Customization</h2>
          <p className="text-gray-600 mb-6">Customize your product settings and options.</p>
          
          <div className="max-w-3xl mx-auto">
            {/* This will be implemented in a separate component */}
            <div className="border rounded-md p-4 mb-6">
              <h3 className="font-medium mb-3">Download Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Download Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={productData.downloadSettings.downloadLimit}
                    onChange={(e) => setProductData({
                      ...productData,
                      downloadSettings: {
                        ...productData.downloadSettings,
                        downloadLimit: parseInt(e.target.value) || 1
                      }
                    })}
                    className="w-full p-2 border rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of times customers can download the files</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link Expiration (days)</label>
                  <input
                    type="number"
                    min="1"
                    value={productData.downloadSettings.linkExpiration}
                    onChange={(e) => setProductData({
                      ...productData,
                      downloadSettings: {
                        ...productData.downloadSettings,
                        linkExpiration: parseInt(e.target.value) || 30
                      }
                    })}
                    className="w-full p-2 border rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of days before the download link expires</p>
                </div>
              </div>
            </div>
          </div>
          
          <StepNavigation 
            onBack={handleBack} 
            onNext={handleNext} 
            currentStep={step} 
            totalSteps={totalSteps} 
          />
        </div>
      )}

      {/* Step 3: Content Upload */}
      {step === 3 && (
        <div className="p-6">
          <h2 className="text-xl font-medium mb-4">Content Upload</h2>
          <p className="text-gray-600 mb-6">Upload your product content and files.</p>
          
          <div className="max-w-3xl mx-auto">
            <ProductFiles 
              productData={productData} 
              setProductData={setProductData} 
            />
          </div>
          
          <StepNavigation 
            onBack={handleBack} 
            onNext={handleSubmit} 
            currentStep={step} 
            totalSteps={totalSteps} 
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Success step */}
      {step > totalSteps && createdProduct && (
        <div>
          <header className="p-6 border-b flex justify-between items-center">
            <h1 className="text-3xl font-normal truncate">
              {createdProduct.name}
            </h1>
          </header>
          
          <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-medium mb-4">Product Created Successfully!</h2>
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

      {/* Mobile buttons - only visible on small screens */}
      {!createdProduct && step < totalSteps && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="grid grid-cols-2 gap-2">
            {step > 1 && (
              <button 
                onClick={handleBack} 
                className="w-full px-4 py-3 border rounded-md flex items-center justify-center gap-2"
              >
                Back
              </button>
            )}
            <button 
              onClick={handleNext} 
              className={`px-4 py-3 rounded-md ${step === 1 ? 'w-full col-span-2' : 'w-full'} bg-black text-white`}
            >
              {step === totalSteps ? 'Publish' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
