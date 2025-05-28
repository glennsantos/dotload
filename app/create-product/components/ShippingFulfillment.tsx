'use client'

import { Product } from './ProductCreationForm'
import { Truck } from 'lucide-react'

type ShippingFulfillmentProps = {
  productData: Product
  setProductData: (data: Product) => void
}

export default function ShippingFulfillment({
  productData,
  setProductData
}: ShippingFulfillmentProps) {
  // Only show this component for physical products
  if (productData.type !== 'physical_product') {
    return null
  }

  return (
    <div className="mt-8 mb-6 border rounded-md p-4">
      <div className="flex items-start mb-2">
        <div>
          <h3 className="tracking-tight text-xl font-light text-stone-900">Shipping & Fulfillment</h3>
          <p className="text-sm text-gray-500 mb-4 font-light">
            Configure shipping options for your physical products
          </p>
        </div>
      </div>
      
      <div className="py-4">
        <h4 className="text-md font-light mb-4">Coming Soon:</h4>
        <ul className="space-y-2">
          <li className="flex items-center text-sm text-stone-600">
            <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            Shipping zones and rates
          </li>
          <li className="flex items-center text-sm text-stone-600">
            <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            Package dimensions and weight
          </li>
          <li className="flex items-center text-sm text-stone-600">
            <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            Fulfillment method selection
          </li>
          <li className="flex items-center text-sm text-stone-600">
            <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            International shipping options
          </li>
        </ul>
      </div>
    </div>
  )
}
