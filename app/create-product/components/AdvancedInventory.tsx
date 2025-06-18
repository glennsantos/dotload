'use client'

import { Product } from './ProductCreationForm'
import { Package } from 'lucide-react'

type AdvancedInventoryProps = {
  productData: Product
  setProductData: (data: Product) => void
}

export default function AdvancedInventory({
  productData,
  setProductData
}: AdvancedInventoryProps) {
  // Only show this component for physical products
  if (productData.type !== 'physical_product') {
    return null
  }

  const handlePreOrderToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allowPreOrders = e.target.checked
    
    setProductData({
      ...productData,
      inventorySettings: {
        ...(productData.inventorySettings || {}),
        allowPreOrders
      }
    })
  }

  return (
    <div className="mt-8 mb-6 border rounded-md p-4">
      <div className="flex items-start mb-2">
        <div>
              <h3 className="tracking-tight text-xl font-light text-foreground">Advanced Inventory</h3>
    <p className="text-sm text-muted-foreground mb-4 font-light">
            Additional inventory management options
          </p>
        </div>
      </div>
      
      {/* Allow Pre-orders */}
      <div className="flex items-center justify-between p-2 border rounded-md mb-4">
        <div>
                  <h4 className="text-sm font-light text-foreground">Allow Pre-orders</h4>
        <p className="text-xs text-muted-foreground font-light">Accept orders beyond available stock</p>
        </div>
        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
          <input 
            type="checkbox" 
            id="allow-preorders" 
            checked={productData.inventorySettings?.allowPreOrders || false}
            onChange={handlePreOrderToggle}
            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
          />
          <label 
            htmlFor="allow-preorders" 
            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
              productData.inventorySettings?.allowPreOrders ? 'bg-primary' : 'bg-muted'
            }`}
          ></label>
        </div>
      </div>
    </div>
  )
}
