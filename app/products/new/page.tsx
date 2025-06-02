"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { X, ChevronRight, ChevronLeft } from "lucide-react"
import ProductCustomization from "./ProductCustomization"
import PaymentOptions from "./PaymentOptions"
import PublishProduct from "./PublishProduct"
import ContentUpload from "./ContentUpload"
import RichTextEditor from "@/components/rich-text-editor"
import ErrorModal from '@/app/components/ErrorModal'
import SuccessModal from '@/app/components/SuccessModal'

// Define the Product type
type Product = {
  id: string;
  name: string;
  slug?: string;
  type: string;
  price: number;
  description?: string;
  coverImagePath?: string;
  files: any[];
};

export default function NewProduct() {
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState('');
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [productData, setProductData] = useState({
    name: '',
    type: '',
    price: 0,
    description: '',
    slug: '',
    files: [] as File[],
    coverImage: null as File | null,
    contentFiles: [] as File[],
    contentLinks: [] as string[],
    discountCodes: [] as Array<{code: string, amount: string, type: string, startDate: string, endDate: string}>,
    paymentOptions: {
      allowPayWhatYouWant: false,
      offerCoupons: false,
    },
  })

  // Calculate total steps based on product type
  let totalSteps = 3; // Default number of steps (reduced from 4)
  
  // Add content upload step for digital products
  const digitalProductTypes = ['digital_product', 'course', 'ebook', 'audiobook'];

  // Scroll to top when product is created successfully
  useEffect(() => {
    if (createdProduct) {
      // Use setTimeout to ensure the DOM has updated before scrolling
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Also try scrolling to the document element for better browser compatibility
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 100);
    }
  }, [createdProduct]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProductData({ ...productData, [name]: value })
  }

  const handleTypeSelect = (type: string) => {
    setProductData({ ...productData, type })
  }

  const [isPriceFocused, setIsPriceFocused] = useState(false)
  const [priceInput, setPriceInput] = useState<string | number>('')

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Update the input value for display
    setPriceInput(value)
    
    // Only update the form data if it's a valid number
    if (value === '') {
      setProductData({ ...productData, price: 0 })
    } else {
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue >= 0) {
        setProductData({ ...productData, price: numValue })
      }
    }
  }

  const handlePriceFocus = () => {
    setIsPriceFocused(true)
    // Clear the input when focused if the value is 0
    if (productData.price === 0) {
      setPriceInput('')
    } else {
      setPriceInput(productData.price.toString())
    }
  }

  const handlePriceBlur = () => {
    setIsPriceFocused(false)
    // If input is empty after blur, set it back to 0
    if (priceInput === '') {
      setProductData({ ...productData, price: 0 })
      setPriceInput('0')
    } else {
      // Ensure we have a valid number
      const numValue = parseFloat(priceInput.toString())
      if (!isNaN(numValue) && numValue >= 0) {
        setProductData({ ...productData, price: numValue })
        setPriceInput(numValue.toString())
      } else {
        // Fallback to 0 if invalid
        setProductData({ ...productData, price: 0 })
        setPriceInput('0')
      }
    }
  }

  const showError = (message: string) => {
    setErrorModalMessage(message)
    setErrorModalOpen(true)
  }

  const showSuccess = (message: string) => {
    setSuccessModalMessage(message)
    setSuccessModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      console.log('Submitting product data:', productData);
      
      // Step 1: Create the product with basic information
      // Prepare form data for product creation
      const productFormData = new FormData();
      
      // Add basic product details
      productFormData.append('name', productData.name);
      productFormData.append('type', productData.type);
      productFormData.append('price', typeof productData.price === 'number' ? productData.price.toString() : productData.price);
      productFormData.append('description', productData.description || '');
      productFormData.append('slug', productData.slug || '');
      
      // Add payment options - convert to string first
      const paymentOptionsString = JSON.stringify(productData.paymentOptions || {});
      console.log('Payment options string:', paymentOptionsString);
      productFormData.append('paymentOptions', paymentOptionsString);
      
      // Add discount codes if enabled
      if (productData.paymentOptions.offerCoupons) {
        productFormData.append('discountCodes', JSON.stringify(productData.discountCodes));
      }
      
      // Add cover image if any
      if (productData.coverImage) {
        productFormData.append('coverImage', productData.coverImage);
      }
      
      // Add content links if any
      if (productData.contentLinks && productData.contentLinks.length > 0) {
        productFormData.append('contentLinks', JSON.stringify(productData.contentLinks));
      }

      // Log form data for debugging
      console.log('Product form data entries:');
      for (let pair of productFormData.entries()) {
        console.log(pair[0], pair[1]);
      }

      // Submit product to backend using Next.js API route
      console.log('Creating product...');
      const productResponse = await fetch('/api/products', {
        method: 'POST',
        body: productFormData,
        credentials: 'include' // Add this to ensure cookies are sent
      });

      if (!productResponse.ok) {
        const errorData = await productResponse.json();
        throw new Error(errorData.details || 'Failed to create product');
      }

      const productResult = await productResponse.json();
      console.log('Product created:', productResult);
      
      // Step 2: Upload content files using the dedicated files endpoint
      if (productData.contentFiles && productData.contentFiles.length > 0 && productResult.product?.id) {
        console.log(`Uploading ${productData.contentFiles.length} content files to /api/products/${productResult.product.id}/files`);
        
        // Prepare form data for file upload
        const filesFormData = new FormData();
        
        // Add all content files to the files form data
        productData.contentFiles.forEach((file: File) => {
          filesFormData.append('files', file);
          console.log(`Added file for upload: ${file.name} (${file.size} bytes)`);
        });
        
        // Upload files to the dedicated endpoint
        try {
          const filesResponse = await fetch(`/api/products/${productResult.product.id}/files`, {
            method: 'POST',
            body: filesFormData,
            credentials: 'include'
          });
          
          if (!filesResponse.ok) {
            const filesErrorData = await filesResponse.json();
            console.error('Error uploading files:', filesErrorData);
            // Don't throw here, we already have the product created
          } else {
            const filesResult = await filesResponse.json();
            console.log('Files uploaded successfully:', filesResult);
            
            // Update the product in state with the uploaded files
            if (filesResult.files && filesResult.files.length > 0) {
              productResult.product.files = [
                ...productResult.product.files || [],
                ...filesResult.files
              ];
            }
          }
        } catch (filesError) {
          console.error('Error uploading files:', filesError);
          // Don't throw here, we already have the product created
        }
      }
      
      // Set the created product in state for the share page
      if (productResult.product) {
        setCreatedProduct(productResult.product);
        setStep(totalSteps + 1); // Move to share page
      }
      setIsSubmitting(false);
    } catch (error: unknown) {
      console.error('Product submission error:', error);
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError('An unknown error occurred');
      }
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && (!productData.name || !productData.type || !productData.price)) {
      showError("Please fill in all required fields: name, type, and price")
      return
    }

    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      // Submit the form
      handleSubmit()
    }
  }
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel? Your changes will be lost.")) {
      router.push("/products")
    }
  }

  return (
    <div className="min-h-screen">
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
                  Continue
                </button>
              </div>
            </div>
          </header>

          <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <p className="mb-4">Make some selections, fill in some boxes, and go live in minutes!</p>
            </div>

            <div className="md:col-span-2">
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium">Product Name</label>
                  <input
                    type="text"
                    value={productData.name}
                    onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                    className="w-full p-3 border rounded-md"
                    placeholder="Enter product name"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 font-medium">Description</label>
                  <RichTextEditor 
                    value={productData.description || ''}
                    onChange={(value) => setProductData({ ...productData, description: value})}
                    placeholder="Describe your product"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 font-medium">Price</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-gray-100">
                      ₱
                    </span>
                    <input
                      type="number"
                      value={priceInput}
                      onChange={handlePriceChange}
                      onFocus={handlePriceFocus}
                      onBlur={handlePriceBlur}
                      className="w-full p-3 border rounded-r-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block mb-2 font-medium">Product Type</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <ProductTypeCard
                    icon="📱"
                    title="Digital Product"
                    description="Software, templates, or other digital downloads"
                    selected={productData.type === "digital_product"}
                    onClick={() => handleTypeSelect("digital_product")}
                  />
                  <ProductTypeCard
                    icon="📚"
                    title="eBook"
                    description="Digital books, guides, or PDFs"
                    selected={productData.type === "ebook"}
                    onClick={() => handleTypeSelect("ebook")}
                  />
                  <ProductTypeCard
                    icon="🎧"
                    title="Audiobook"
                    description="Audio content or podcasts"
                    selected={productData.type === "audiobook"}
                    onClick={() => handleTypeSelect("audiobook")}
                  />
                  <ProductTypeCard
                    icon="🎓"
                    title="Course"
                    description="Educational content or tutorials"
                    selected={productData.type === "course"}
                    onClick={() => handleTypeSelect("course")}
                  />
                </div>
              </div>              
              <div className="flex justify-end">
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <ProductCustomization
          productData={productData}
          setProductData={setProductData}
          onNext={() => setStep(3)}
          onBack={handleBack}
          onCancel={handleCancel}
        />
      )}
      {step === 3 && (
        <ContentUpload
          productData={productData}
          setProductData={setProductData}
          onNext={handleSubmit}
          onBack={() => setStep(2)}
          onCancel={handleCancel}
          isPublished={!!createdProduct}
        />
      )}
      {/* Step 5 removed as requested */}
      {step === totalSteps + 1 && createdProduct && (
        <div>
          
          <header className="p-6 border-b flex justify-between items-center">
            <h1 className="text-3xl font-normal truncate">
              {createdProduct.name}
            </h1>
          </header>
          
          <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-medium mb-4">Share Your Product</h2>

              <div className="p-4 border rounded-md mb-4">
                <h3 className="font-medium mb-2">Product URL</h3>
                <div className="flex mb-4">
                  <input
                    type="text"
                    value={`${window.location.origin}/p/${createdProduct.slug || createdProduct.id}`}
                    readOnly
                    className="flex-1 p-1 border rounded-l-md bg-gray-100"
                  />
                  <button 
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        const url = `${window.location.origin}/p/${createdProduct.slug || createdProduct.id}`;
                        if (navigator?.clipboard) {
                          navigator.clipboard.writeText(url)
                            .then(() => showSuccess('URL copied to clipboard'))
                            .catch(() => showError('Failed to copy URL'));
                        } else {
                          // Fallback for browsers that don't support clipboard API
                          const textarea = document.createElement('textarea');
                          textarea.value = url;
                          document.body.appendChild(textarea);
                          textarea.select();
                          try {
                            document.execCommand('copy');
                            showSuccess('URL copied to clipboard');
                          } catch (err) {
                            showError('Failed to copy URL');
                          }
                          document.body.removeChild(textarea);
                        }
                      }
                    }}
                    className="px-4 py-2 bg-black text-white rounded-r-md"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="p-4 border rounded-md mb-4">
                <h3 className="font-medium mb-2">Social Media</h3>
                <p className="text-sm text-gray-600 mb-4">Share your product on social media</p>
                <div className="flex gap-2">
                  <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/p/${createdProduct.slug || createdProduct.id}`)}&text=${encodeURIComponent(`Check out ${createdProduct.name}`)}`, '_blank')} className="px-4 py-2 bg-blue-600 text-white rounded-md">Twitter</button>
                  <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/p/${createdProduct.slug || createdProduct.id}`)}`, '_blank')} className="px-4 py-2 bg-blue-800 text-white rounded-md">Facebook</button>
                  <button onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/p/${createdProduct.slug || createdProduct.id}`)}`, '_blank')} className="px-4 py-2 bg-[#0077b5] text-white rounded-md">LinkedIn</button>
                </div>
              </div>

              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">Embed on Website</h3>
                <p className="text-sm text-gray-600 mb-4">Add this product to your website</p>
                <div className="bg-gray-100 p-3 rounded-md">
                  <code className="text-sm">
                    &lt;iframe src="${window.location.origin}/p/${createdProduct.slug || createdProduct.id}/embed" frameborder="0"
                    width="100%" height="auto" style="min-height: 400px;"&gt;&lt;/iframe&gt;
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile buttons - only visible on small screens */}
      {!createdProduct && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="grid grid-cols-2 gap-2">
            {step > 1 && (
              <button 
                onClick={handleBack} 
                className="w-full px-4 py-3 border rounded-md flex items-center justify-center gap-2"
              >
                <ChevronLeft size={18} /> Back
              </button>
            )}
            <button 
              onClick={handleNext} 
              className={`px-4 py-3 rounded-md ${step === 1 ? 'w-full col-span-2' : 'w-full'} bg-black text-white`}
            >
              {step === 3 ? 'Publish' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductTypeCard({
  icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: string
  title: string
  description: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <div
      className={`border rounded-md p-4 cursor-pointer hover:border-gray-400 ${selected ? "border-2 border-black" : ""}`}
      onClick={onClick}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}
