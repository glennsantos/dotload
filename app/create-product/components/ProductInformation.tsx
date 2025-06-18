'use client'

import React, { useState } from 'react'
import { Product } from './ProductCreationForm'
import { RefreshCw, Upload, X } from 'lucide-react'
import RichTextEditor from '@/components/rich-text-editor'
import ErrorModal from '@/app/components/ErrorModal'
import { validatePrice } from '@/lib/form-validation'

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
    
    // Only allow integers (no decimals)
    const integerRegex = /^\d*$/
    if (value === '' || integerRegex.test(value)) {
      setPriceInput(value)
      
      // Validate and update productData if it's a valid integer in range
      if (value === '') {
        setProductData({ ...productData, price: 0 })
      } else {
        const numValue = parseInt(value, 10)
        const validation = validatePrice(numValue)
        
        if (validation.isValid) {
          setProductData({ ...productData, price: numValue })
        } else if (numValue > 500000) {
          // Show error for values exceeding max limit
          showError(validation.error!)
          // Keep the input but don't update productData
        } else {
          // For values less than 1, update productData but show error on blur
          setProductData({ ...productData, price: numValue })
        }
      }
    }
    // If the input contains non-integer characters, ignore the change
  }

  const handlePriceFocus = () => {
    setIsPriceFocused(true)
    // Show the raw input value when focused
    setPriceInput(productData.price.toString())
  }

  const handlePriceBlur = () => {
    setIsPriceFocused(false)
    
    // Validate the final price when focus is lost
    if (priceInput === '') {
      setProductData({ ...productData, price: 0 })
      setPriceInput('0')
      showError('Price is required')
    } else {
      const numValue = parseInt(priceInput, 10)
      const validation = validatePrice(numValue)
      
      if (!validation.isValid) {
        showError(validation.error!)
        // Reset to minimum valid value or keep current valid value
        if (numValue < 1) {
          setProductData({ ...productData, price: 1 })
          setPriceInput('1')
        } else if (numValue > 500000) {
          setProductData({ ...productData, price: 500000 })
          setPriceInput('500000')
        }
      } else {
        setProductData({ ...productData, price: numValue })
        setPriceInput(numValue.toString())
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
        title="Invalid Price"
        message={errorModalMessage}
      />

      <div className="mb-6">
        <h3 className="tracking-tight text-xl font-light text-foreground">Product Information</h3>
        <p className="text-sm text-muted-foreground mb-4">Essential details about your product</p>
      </div>
      
      <div className="space-y-6">
        {/* Product Name */}
        <div>
          <label className="block mb-2 text-sm text-foreground">Product Name</label>
          <input
            type="text"
            name="name"
            value={productData.name}
            onChange={handleInputChange}
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter product name"
          />
        </div>
        
        {/* Description */}
        <div>
          <label className="block mb-2 text-sm text-foreground">Description</label>
          <RichTextEditor
            value={productData.description || ''}
            onChange={(value: string) => setProductData({ ...productData, description: value })}
            placeholder="Describe your product..."
          />
        </div>
        
        {/* Custom URL */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-foreground">Custom URL (Optional)</label>
            <button 
              className="px-3 py-1.5 border border-border rounded-2xl text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-light"
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
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="your-product-name"
            />
            
          </div>
          <p className="text-xs text-muted-foreground mt-1">
          <span className="flex items-center bg-muted/50 p-3 rounded-lg mt-2">
            <span className="font-medium text-foreground">Product URL:</span>&nbsp;
            <a target="_blank" className="text-primary hover:text-primary/80 transition-colors" href={`${typeof window !== 'undefined' ? window.location.origin : ''}/p/${productData.slug}`}>{typeof window !== 'undefined' ? window.location.origin : ''}/p/{productData.slug ? productData.slug : 'your-product-url'}</a></span>
          </p>
        </div>
        
        {/* Price */}
        <div>
          <label className="block mb-2 text-sm text-foreground">Price</label>
          <div className="relative flex rounded-lg shadow-sm">
            <span className="inline-flex items-center px-3 border border-r-0 border-border rounded-l-lg bg-muted/50 text-muted-foreground text-sm">
              {getCurrencySymbol(productData.currency)}
            </span>
            <input
              type="text"
              value={isPriceFocused ? priceInput : productData.price}
              onChange={handlePriceChange}
              onFocus={handlePriceFocus}
              onBlur={handlePriceBlur}
              className="flex-1 min-w-0 block w-full px-3 py-3 border border-border focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground sm:text-sm rounded-r-none"
              placeholder="1"
              inputMode="numeric"
              pattern="[0-9]*"
            />
            <select 
              className="border-l-0 rounded-r-lg border-border bg-muted/50 text-foreground py-3 pl-3 pr-8 text-sm focus:ring-2 focus:ring-primary focus:border-transparent border"
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
        <h3 className="text-xl font-light mb-2 text-foreground">Product Photo</h3>
        <p className="text-sm text-muted-foreground mb-4">Upload a high-quality photo of your physical product</p>
        
        <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center mb-4 bg-background hover:bg-muted/20 transition-colors">
          {productData.coverImage ? (
            <div className="relative w-full">
              <img 
                src={URL.createObjectURL(productData.coverImage)} 
                alt="Thumbnail preview" 
                className="w-32 h-32 object-cover rounded-lg mx-auto mb-2"
              />
              <button 
                onClick={() => setProductData({...productData, coverImage: null})}
                className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full p-1 transform translate-x-1/2 -translate-y-1/2 hover:bg-destructive/90 transition-colors"
              >
                <X size={14} />
              </button>
              <p className="text-sm text-center text-muted-foreground">{productData.coverImage.name}</p>
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
                className="w-32 h-32 object-cover rounded-lg mx-auto mb-2"
              />
              <button 
                onClick={() => setProductData({...productData, coverImagePath: ''})}
                className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full p-1 transform translate-x-1/2 -translate-y-1/2 hover:bg-destructive/90 transition-colors"
              >
                <X size={14} />
              </button>
              <p className="text-sm text-center text-muted-foreground">Existing photo</p>
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
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2">
                  <Upload size={20} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Add Image</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB</p>
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
