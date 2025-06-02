'use client'

import React, { useState } from 'react'
import { Product } from './ProductCreationForm'
import { RefreshCw, Upload, X } from 'lucide-react'
import RichTextEditor from '@/components/rich-text-editor'
import ErrorModal from '@/app/components/ErrorModal'

type ProductInformationProps = {
  productData: Product
  setProductData: (data: Product) => void
}

export default function ProductInformation({ 
  productData, 
  setProductData 
}: ProductInformationProps) {
  const [isPriceFocused, setIsPriceFocused] = useState(false)
  const [priceInput, setPriceInput] = useState(productData.price.toString())
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [errorModalMessage, setErrorModalMessage] = useState('')

  const showError = (message: string) => {
    setErrorModalMessage(message)
    setErrorModalOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProductData({ ...productData, [name]: value })
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPriceInput(value)
    
    // Only update productData if it's a valid number or empty
    if (value === '' || value === '0') {
      setProductData({ ...productData, price: 0 })
    } else {
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue >= 1 && numValue <= 500000) {
        setProductData({ ...productData, price: numValue })
      }
    }
  }

  const handlePriceFocus = () => {
    setIsPriceFocused(true)
    // Show the raw input value when focused
    setPriceInput(productData.price.toString())
  }

  const handlePriceBlur = () => {
    setIsPriceFocused(false)
    // Validate and format the price when focus is lost
    if (priceInput === '' || priceInput === '0') {
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

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Check file size (10MB limit)
      const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        showError(`File size exceeds 10MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Please choose a smaller image.`)
        // Clear the file input
        e.target.value = ''
        return
      }
      
      setProductData({...productData, coverImage: file})
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
      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="Upload Error"
        message={errorModalMessage}
      />

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
            onChange={(value: string) => setProductData({ ...productData, description: value })}
            placeholder="Describe your product..."
          />
        </div>
        
        {/* Custom URL */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm">Custom URL (Optional)</label>
            <button 
              className="px-2 py-1 border rounded text-xs text-gray-500 hover:bg-gray-50 transition-colors"
              onClick={() => {
                if (productData.name) {
                  const slug = productData.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '')
                  setProductData({ ...productData, slug })
                }
              }}
              type="button"
            >
              <span className="flex items-center"><RefreshCw className="mr-2 h-4 w-4"/> Generate from name</span>
            </button>
          </div>
          <div className="flex">
            <input
              type="text"
              name="slug"
              value={productData.slug}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              placeholder="your-product-name"
            />
            
          </div>
          <p className="text-xs text-gray-500 mt-1">
          <span className="flex items-center bg-stone-50 p-2 rounded-lg p-2">
            <span className="font-semibold">Product URL:</span>&nbsp;
            <a target="_blank" className="text-emerald-600 hover:text-emerald-700" href={`${typeof window !== 'undefined' ? window.location.origin : ''}/p/${productData.slug}`}>{typeof window !== 'undefined' ? window.location.origin : ''}/p/{productData.slug ? productData.slug : 'your-product-url'}</a></span>
          </p>
        </div>
        
        {/* Price */}
        <div>
          <label className="block mb-2 text-sm">Price</label>
          <div className="relative flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-gray-50 text-gray-500 text-sm">
              {getCurrencySymbol(productData.currency)}
            </span>
            <input
              type="text"
              value={isPriceFocused ? priceInput : productData.price}
              onChange={handlePriceChange}
              onFocus={handlePriceFocus}
              onBlur={handlePriceBlur}
              className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-r-none"
              placeholder="0"
              min="0"
            />
            <select 
              className="border-l-0 rounded-r-md border-gray-300 bg-stone-50 text-gray-700 py-2 pl-3 pr-8 text-sm focus:ring-emerald-500 focus:border-emerald-500 border"
              disabled
              value={productData.currency}
              onChange={(e) => setProductData({ ...productData, currency: e.target.value })}
            >
              <option value="PHP" selected>PHP</option>
              <option value="USD" disabled>USD</option>
              <option value="EUR" disabled>EUR</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Thumbnail Upload */}
      <div className="mt-8 mb-6">
        <h3 className="text-xl font-light mb-2">Product Photo</h3>
        <p className="text-sm text-gray-500 mb-4">Upload a high-quality photos of your physical product</p>
        
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
          ) : productData.coverImagePath ? (
            <div className="relative w-full">
              <img 
                src={
                  // Handle URLs that start with http:// or https://
                  productData.coverImagePath.startsWith('http') ? productData.coverImagePath :
                  // Handle protocol-relative URLs that start with //
                  productData.coverImagePath.startsWith('//') ? `https:${productData.coverImagePath}` :
                  // Handle absolute paths that start with /
                  productData.coverImagePath.startsWith('/') ? productData.coverImagePath :
                  // Handle relative paths by adding a leading /
                  `/${productData.coverImagePath}`
                } 
                alt="Thumbnail preview" 
                className="w-32 h-32 object-cover rounded-md mx-auto mb-2"
              />
              <button 
                onClick={() => setProductData({...productData, coverImagePath: ''})}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/2 -translate-y-1/2"
              >
                <X size={14} />
              </button>
              <p className="text-sm text-center text-gray-500">Existing photo</p>
            </div>
          ) : (
            <>
              <input
                type="file"
                id="cover-image"
                className="hidden"
                accept="image/*"
                onChange={handleCoverImageUpload}
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
