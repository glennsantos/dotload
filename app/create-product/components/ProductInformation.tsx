'use client'

import { useState } from 'react'
import { Product } from './ProductCreationForm'
import { Upload, X } from 'lucide-react'
import RichTextEditor from '@/components/rich-text-editor'

type ProductInformationProps = {
  productData: Product
  setProductData: (data: Product) => void
}

export default function ProductInformation({ 
  productData, 
  setProductData 
}: ProductInformationProps) {
  const [isPriceFocused, setIsPriceFocused] = useState(false)
  const [priceInput, setPriceInput] = useState<string | number>('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProductData({ ...productData, [name]: value })
  }

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

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'PHP':
        return '₱'
      case 'USD':
        return '$'
      case 'EUR':
        return '€'
      default:
        return '₱' // Default to PHP
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="tracking-tight text-xl font-light text-stone-900">Product Information</h3>
        <p className="text-sm text-gray-500 mb-4">Essential details about your product</p>
      </div>
      
      <div className="space-y-6">
        {/* Product Name */}
        <div>
          <label className="block mb-2 text-sm">Product Name</label>
          <input
            type="text"
            name="name"
            value={productData.name}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md"
            placeholder="Enter product name"
          />
        </div>
        
        {/* Description */}
        <div>
          <label className="block mb-2 text-sm">Description</label>
          <RichTextEditor
            value={productData.description || ''}
            onChange={(value) => setProductData({ ...productData, description: value })}
            placeholder="Describe your product..."
          />
        </div>
        
        {/* Custom URL */}
        <div>
          <label className="block mb-2 text-sm">Custom URL (Optional)</label>
          <div className="flex">
            <input
              type="text"
              name="slug"
              value={productData.slug}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              placeholder="your-product-name"
            />
            <div className="ml-2">
              <button 
                className="px-2 py-1 border rounded text-xs text-gray-500"
                onClick={() => {
                  if (productData.name) {
                    const slug = productData.name
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '')
                    setProductData({ ...productData, slug })
                  }
                }}
              >
                Generate from name
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {productData.slug 
              ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${productData.slug}` 
              : 'Product URL will be generated automatically'}
          </p>
        </div>
        
        {/* Price */}
        <div>
          <label className="block mb-2 text-sm">Price</label>
          <div className="flex">
            <div className="flex-grow flex">
              <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-gray-50 text-gray-500">
                {getCurrencySymbol(productData.currency)}
              </span>
              <input
                type="number"
                value={isPriceFocused ? priceInput : productData.price}
                onChange={handlePriceChange}
                onFocus={handlePriceFocus}
                onBlur={handlePriceBlur}
                className="flex-grow p-2 border rounded-r-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div className="ml-2 w-24">
              <select 
                className="w-full p-2 border rounded-md bg-white"
                value={productData.currency}
                onChange={(e) => setProductData({ ...productData, currency: e.target.value })}
              >
                <option value="PHP">PHP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Thumbnail Upload */}
      <div className="mt-8 mb-6">
        <h3 className="text-base font-medium mb-2">Product Photo</h3>
        <p className="text-sm text-gray-500 mb-4">Upload high-quality photos of your physical product</p>
        
        <div className="border border-dashed rounded-md p-4 flex flex-col items-center justify-center mb-4">
          {productData.coverImage ? (
            <div className="relative w-full">
              <img 
                src={URL.createObjectURL(productData.coverImage)} 
                alt="Thumbnail preview" 
                className="w-32 h-32 object-cover rounded-md mx-auto mb-2"
              />
              <button 
                onClick={() => setProductData({...productData, coverImage: null})}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/2 -translate-y-1/2"
              >
                <X size={14} />
              </button>
              <p className="text-sm text-center text-gray-500">{productData.coverImage.name}</p>
            </div>
          ) : (
            <>
              <input
                type="file"
                id="cover-image"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setProductData({...productData, coverImage: e.target.files[0]});
                  }
                }}
              />
              <label htmlFor="cover-image" className="cursor-pointer flex flex-col items-center justify-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                  <Upload size={20} className="text-gray-500" />
                </div>
                <p className="text-sm font-medium">Add Image</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
