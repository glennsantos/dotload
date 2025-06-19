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
    <div className="mt-8 mb-6 border border-border rounded-lg p-6 bg-background">
          <h3 className="tracking-tight text-xl font-light text-foreground mb-2">Stock & Pricing</h3>
      <p className="text-sm text-muted-foreground mb-6 font-light">Manage inventory and availability</p>
      
      {/* Unlimited Quantity Toggle */}
      <div className="flex items-center justify-between p-4 border border-border rounded-lg mb-4 bg-muted/20">
        <div>
                  <h4 className="text-sm font-light text-foreground">Unlimited Quantity</h4>
        <p className="text-xs text-muted-foreground font-light">No stock limitations</p>
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
            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${unlimitedQuantity ? 'bg-primary' : 'bg-muted'}`}
          ></label>
        </div>
      </div>
      
      {/* Stock Quantity Input - Only show if not unlimited */}
      {!unlimitedQuantity && (
        <div className="mb-4">
          <label htmlFor="stock-quantity" className="block text-sm font-light mb-2 text-foreground">
            Stock Quantity
          </label>
          <div className="relative">
            <input
              id="stock-quantity"
              type="text"
              min="0"
              value={productData.stockQuantity || 0}
              onChange={handleStockQuantityChange}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  )
}
