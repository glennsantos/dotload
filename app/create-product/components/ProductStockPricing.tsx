'use client'

import { useState } from 'react'
import { Product } from './ProductCreationForm'

type ProductStockPricingProps = {
  productData: Product
  setProductData: (data: Product) => void
}

export default function ProductStockPricing({
  productData,
  setProductData
}: ProductStockPricingProps) {
  const [unlimitedQuantity, setUnlimitedQuantity] = useState(
    productData.stockQuantity === null || productData.stockQuantity === undefined
  )

  const handleUnlimitedToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isUnlimited = e.target.checked
    setUnlimitedQuantity(isUnlimited)
    
    if (isUnlimited) {
      // If unlimited, set stockQuantity to null
      setProductData({
        ...productData,
        stockQuantity: null
      })
    } else {
      // If not unlimited, set a default quantity
      setProductData({
        ...productData,
        stockQuantity: 100
      })
    }
  }

  const handleStockQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value >= 0) {
      setProductData({
        ...productData,
        stockQuantity: value
      })
    }
  }

  // Only show this component for physical products
  if (productData.type !== 'physical_product') {
    return null
  }

  return (
    <div className="mt-8 mb-6 border rounded-md p-4">
      <h3 className="tracking-tight text-xl font-light text-stone-900 mb-2">Stock & Pricing</h3>
      <p className="text-sm text-gray-500 mb-4 font-light">Manage inventory and availability</p>
      
      {/* Unlimited Quantity Toggle */}
      <div className="flex items-center justify-between p-2 border rounded-md mb-4">
        <div>
          <h4 className="text-sm font-light text-stone-900">Unlimited Quantity</h4>
          <p className="text-xs text-gray-500 font-light">No stock limitations</p>
        </div>
        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
          <input 
            type="checkbox" 
            id="unlimited-quantity" 
            checked={unlimitedQuantity}
            onChange={handleUnlimitedToggle}
            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
          />
          <label 
            htmlFor="unlimited-quantity" 
            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${unlimitedQuantity ? 'bg-emerald-500' : 'bg-stone-300'}`}
          ></label>
        </div>
      </div>
      
      {/* Stock Quantity Input - Only show if not unlimited */}
      {!unlimitedQuantity && (
        <div className="mb-4">
          <label htmlFor="stock-quantity" className="block text-sm font-light mb-1">
            Stock Quantity
          </label>
          <div className="relative">
            <input
              id="stock-quantity"
              type="number"
              min="0"
              value={productData.stockQuantity || 0}
              onChange={handleStockQuantityChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
      )}
    </div>
  )
}
