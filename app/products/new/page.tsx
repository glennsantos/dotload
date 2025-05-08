"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { X, ChevronRight, ChevronLeft } from "lucide-react"
import ProductCustomization from "./ProductCustomization"
import PaymentOptions from "./PaymentOptions"
import PublishProduct from "./PublishProduct"
import ContentUpload from "./ContentUpload"

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
    paymentOptions: {
      allowPayWhatYouWant: false,
      offerCoupons: false,
      subscriptionBilling: false,
    },
  })

  // Calculate total steps based on product type
  let totalSteps = 4; // Default number of steps
  
  // Add content upload step for digital products
  const digitalProductTypes = ['digital_product', 'course', 'ebook', 'audiobook'];
  if (digitalProductTypes.includes(productData.type)) {
    totalSteps = 5;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProductData({ ...productData, [name]: value })
  }

  const handleTypeSelect = (type: string) => {
    setProductData({ ...productData, type })
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductData({ ...productData, price: parseFloat(e.target.value) || 0 })
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      console.log('Submitting product data:', productData);
      
      // Prepare form data
      const formData = new FormData();
      
      // Add basic product details
      formData.append('name', productData.name);
      formData.append('type', productData.type);
      formData.append('price', typeof productData.price === 'number' ? productData.price.toString() : productData.price);
      formData.append('description', productData.description || '');
      formData.append('slug', productData.slug || '');
      
      // Add payment options - convert to string first
      const paymentOptionsString = JSON.stringify(productData.paymentOptions || {});
      console.log('Payment options string:', paymentOptionsString);
      formData.append('paymentOptions', paymentOptionsString);
      
      // Add files if any
      if (productData.coverImage) {
        formData.append('coverImage', productData.coverImage);
      }
      
      // Add content files if any
      if (productData.contentFiles && productData.contentFiles.length > 0) {
        productData.contentFiles.forEach((file: File, index: number) => {
          formData.append(`contentFile-${index}`, file);
        });
      }
      
      // Add content links if any
      if (productData.contentLinks && productData.contentLinks.length > 0) {
        formData.append('contentLinks', JSON.stringify(productData.contentLinks));
      }

      // Log form data for debugging
      console.log('Form data entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      // Submit to backend using Next.js API route
      const response = await fetch('/api/products', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create product');
      }

      const result = await response.json();
      console.log('Product created:', result);
      
      // Set the created product in state for the share page
      if (result.product) {
        setCreatedProduct(result.product);
        setStep(totalSteps + 1); // Move to share page
      }
      setIsSubmitting(false);
    } catch (error: unknown) {
      console.error('Product submission error:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('An unknown error occurred');
      }
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && (!productData.name || !productData.type || !productData.price)) {
      alert("Please fill in all required fields: name, type, and price")
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

          <header className="p-6 border-b flex justify-between items-center">
            <h1 className="text-3xl font-normal">Publish your first product</h1>
            <div className="flex gap-2">
              <button onClick={handleCancel} className="px-4 py-2 border rounded-md flex items-center gap-2">
                <X size={18} /> Cancel
              </button>
              <button onClick={handleNext} className="px-4 py-2 bg-purple-400 hover:bg-purple-500 rounded-md">
                Next: Customize
              </button>
            </div>
          </header>

          <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <p className="mb-4">Make some selections, fill in some boxes, and go live in minutes.</p>
              <p className="mb-4">
                Our{" "}
                <Link href="/help" className="underline font-medium">
                  Help Center
                </Link>{" "}
                has everything you need to know.
              </p>
            </div>

            <div className="md:col-span-2">
              <div className="mb-8">
                <label className="block mb-2 font-medium">Product Title</label>
                <input
                  type="text"
                  name="name"
                  value={productData.name}
                  onChange={handleInputChange}
                  placeholder="Name of your product"
                  className="w-full p-3 border rounded-md"
                />
              </div>

              <div className="mb-8">
                <label className="block mb-2 font-medium">Price</label>
                <div className="flex items-center">
                  <div className="relative">
                    <select className="h-12 appearance-none bg-white border rounded-l-md px-3 pr-8 focus:outline-none">
                      <option>$</option>
                      <option>€</option>
                      <option>£</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                  <input
                    type="text"
                    name="price"
                    value={productData.price === 0 ? '' : productData.price}
                    onChange={handlePriceChange}
                    placeholder="Price your product"
                    className="flex-1 h-12 p-3 border-l-0 border rounded-r-md"
                  />
                </div>
              </div>

              <h2 className="text-xl font-medium mb-4">Product Type</h2>
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
                  title="E-Book"
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
                <ProductTypeCard
                  icon="📦"
                  title="Physical Product"
                  description="Tangible items that require shipping"
                  selected={productData.type === "physical_product"}
                  onClick={() => handleTypeSelect("physical_product")}
                />
                <ProductTypeCard
                  icon="🔄"
                  title="Subscription"
                  description="Recurring access to content or services"
                  selected={productData.type === "subscription"}
                  onClick={() => handleTypeSelect("subscription")}
                />
                <ProductTypeCard
                  icon="🎟️"
                  title="Membership"
                  description="Ongoing access to exclusive content"
                  selected={productData.type === "membership"}
                  onClick={() => handleTypeSelect("membership")}
                />
                <ProductTypeCard
                  icon="🎨"
                  title="Other"
                  description="Any other type of product"
                  selected={productData.type === "other"}
                  onClick={() => handleTypeSelect("other")}
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!productData.type}
                  className={`px-6 py-3 rounded-md flex items-center gap-2 ${
                    productData.type ? "bg-black text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <ProductCustomization
          productData={productData}
          setProductData={setProductData}
          onNext={() => setStep(digitalProductTypes.includes(productData.type) ? 3 : 4)}
          onBack={handleBack}
          onCancel={handleCancel}
        />
      )}
      {step === 3 && digitalProductTypes.includes(productData.type) && (
        <ContentUpload
          productData={productData}
          setProductData={setProductData}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
          onCancel={handleCancel}
        />
      )}
      {step === 3 && !digitalProductTypes.includes(productData.type) && (
        <PaymentOptions
          productData={productData}
          setProductData={setProductData}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
          onCancel={handleCancel}
        />
      )}
      {step === 4 && (
        <PaymentOptions
          productData={productData}
          setProductData={setProductData}
          onNext={() => setStep(5)}
          onBack={() => setStep(3)}
          onCancel={handleCancel}
        />
      )}
      {step === 5 && (
        <PublishProduct
          productData={productData}
          onPublish={handleSubmit}
          onBack={() => setStep(4)}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      )}
      {step === totalSteps + 1 && createdProduct && (
        <div>
          
          <header className="p-6 border-b flex justify-between items-center">
            <h1 className="text-3xl font-normal truncate">
              {createdProduct.name}
            </h1>
            <div className="flex gap-2">
              <Link href="/products" className="px-4 py-2 bg-black text-white rounded-md">
                Go to Products
              </Link>
            </div>
          </header>
          
          <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-medium mb-4">Share Your Product</h2>

              <div className="p-4 border rounded-md mb-4">
                <h3 className="font-medium mb-2">Product URL</h3>
                <div className="flex mb-4">
                  <input
                    type="text"
                    value={`https://alacarte.com/${createdProduct.slug || createdProduct.id}`}
                    readOnly
                    className="flex-1 p-3 border rounded-l-md bg-gray-100"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`https://alacarte.com/${createdProduct.slug || createdProduct.id}`);
                      alert('URL copied to clipboard!');
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
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md">Twitter</button>
                  <button className="px-4 py-2 bg-blue-800 text-white rounded-md">Facebook</button>
                  <button className="px-4 py-2 bg-pink-600 text-white rounded-md">Instagram</button>
                </div>
              </div>

              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">Embed on Website</h3>
                <p className="text-sm text-gray-600 mb-4">Add this product to your website</p>
                <div className="bg-gray-100 p-3 rounded-md">
                  <code className="text-sm">
                    &lt;iframe src="https://alacarte.com/${createdProduct.slug || createdProduct.id}/embed" frameborder="0"
                    width="100%" height="auto" style="min-height: 400px;"&gt;&lt;/iframe&gt;
                  </code>
                </div>
              </div>
            </div>
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
