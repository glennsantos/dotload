"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { X, ChevronRight } from "lucide-react"

import ProductCustomization from "./ProductCustomization"
import ProductVariations from "./ProductVariations"
import PaymentOptions from "./PaymentOptions"
import PublishProduct from "./PublishProduct"

export default function NewProduct() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [productData, setProductData] = useState({
    name: "",
    type: "",
    price: "",
    description: "",
    files: [] as File[],
    coverImage: null as File | null,
    variations: [] as { name: string; options: string[] }[],
    paymentOptions: {
      allowPayWhatYouWant: false,
      offerCoupons: false,
      subscriptionBilling: false,
    },
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProductData({ ...productData, [name]: value })
  }

  const handleTypeSelect = (type: string) => {
    setProductData({ ...productData, type })
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductData({ ...productData, price: e.target.value })
  }

  const handleSubmit = async () => {
    try {
      console.log('Submitting product data:', productData);
      
      // Prepare form data
      const formData = new FormData();
      
      // Add basic product details
      formData.append('name', productData.name);
      formData.append('type', productData.type);
      formData.append('price', productData.price);
      formData.append('description', productData.description || '');
      
      // Add variations if exist - convert to string first to avoid parsing issues
      const variationsString = JSON.stringify(productData.variations || []);
      console.log('Variations string:', variationsString);
      formData.append('variations', variationsString);
      
      // Add payment options - convert to string first
      const paymentOptionsString = JSON.stringify(productData.paymentOptions || {});
      console.log('Payment options string:', paymentOptionsString);
      formData.append('paymentOptions', paymentOptionsString);
      
      // Add cover image
      if (productData.coverImage) {
        formData.append('coverImage', productData.coverImage);
      }
      
      // Add files
      productData.files.forEach((file, index) => {
        formData.append('files', file);
      });

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
      router.push('/products');
    } catch (error: unknown) {
      console.error('Product submission error:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('An unknown error occurred');
      }
    }
  };

  const handleNext = () => {
    if (step === 1 && (!productData.name || !productData.type)) {
      alert("Please fill in all required fields")
      return
    }

    if (step < 5) {
      setStep(step + 1)
    } else {
      // Submit the form
      handleSubmit()
    }
  }

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel? Your changes will be lost.")) {
      router.push("/products")
    }
  }

  return (
    <div className="min-h-screen">
      {step === 1 && (
        <div>
          <div className="bg-gray-50 py-2 px-6 border-b">
            <div className="flex items-center text-sm">
              <Link href="/products" className="text-gray-600 hover:text-black">
                Products
              </Link>
              <ChevronRight size={16} className="mx-2 text-gray-400" />
              <span className="font-medium">New Product</span>
            </div>
          </div>

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
                <label className="block mb-2 font-medium">Name</label>
                <input
                  type="text"
                  name="name"
                  value={productData.name}
                  onChange={handleInputChange}
                  placeholder="Name of product"
                  className="w-full p-3 border rounded-md"
                />
              </div>

              <div className="mb-8">
                <label className="block mb-2 font-medium">Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ProductTypeCard
                    icon="🎁"
                    title="Digital product"
                    description="Any set of files to download or stream."
                    selected={productData.type === "digital"}
                    onClick={() => handleTypeSelect("digital")}
                  />
                  <ProductTypeCard
                    icon="🎓"
                    title="Course or tutorial"
                    description="Sell a single lesson or teach a whole cohort of students."
                    selected={productData.type === "course"}
                    onClick={() => handleTypeSelect("course")}
                  />
                  <ProductTypeCard
                    icon="📚"
                    title="E-book"
                    description="Offer a book or comic in PDF, ePub, and Mobi formats."
                    selected={productData.type === "ebook"}
                    onClick={() => handleTypeSelect("ebook")}
                  />
                  <ProductTypeCard
                    icon="📰"
                    title="Newsletter"
                    description="Deliver recurring content through email."
                    selected={productData.type === "newsletter"}
                    onClick={() => handleTypeSelect("newsletter")}
                  />
                  <ProductTypeCard
                    icon="👥"
                    title="Membership"
                    description="Start a membership business around your fans."
                    selected={productData.type === "membership"}
                    onClick={() => handleTypeSelect("membership")}
                  />
                  <ProductTypeCard
                    icon="🎙️"
                    title="Podcast"
                    description="Make episodes available for streaming and direct downloads."
                    selected={productData.type === "podcast"}
                    onClick={() => handleTypeSelect("podcast")}
                  />
                  <ProductTypeCard
                    icon="🔊"
                    title="Audiobook"
                    description="Let customers listen to your audio content."
                    selected={productData.type === "audiobook"}
                    onClick={() => handleTypeSelect("audiobook")}
                  />
                  <ProductTypeCard
                    icon="📦"
                    title="Physical good"
                    description="Sell anything that requires shipping something."
                    selected={productData.type === "physical"}
                    onClick={() => handleTypeSelect("physical")}
                  />
                </div>
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
                    value={productData.price}
                    onChange={handlePriceChange}
                    placeholder="Price your product"
                    className="flex-1 h-12 p-3 border-l-0 border rounded-r-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <ProductCustomization
          productData={productData}
          setProductData={setProductData}
          onNext={handleNext}
          onCancel={handleCancel}
        />
      )}
      {step === 3 && (
        <ProductVariations
          productData={productData}
          setProductData={setProductData}
          onNext={handleNext}
          onCancel={handleCancel}
        />
      )}
      {step === 4 && (
        <PaymentOptions
          productData={productData}
          setProductData={setProductData}
          onNext={handleNext}
          onCancel={handleCancel}
        />
      )}
      {step === 5 && (
        <PublishProduct
          productData={productData}
          setProductData={setProductData}
          onNext={handleNext}
          onCancel={handleCancel}
        />
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
