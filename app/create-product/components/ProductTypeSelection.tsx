'use client'

import { Product } from './ProductCreationForm'
import { Download, Package } from 'lucide-react'

type ProductTypeSelectionProps = {
  productData: Product
  setProductData: (data: Product) => void
}

export default function ProductTypeSelection({ 
  productData, 
  setProductData 
}: ProductTypeSelectionProps) {
  const handleTypeSelect = (type: string) => {
    setProductData({ ...productData, type })
  }

  return (
    <div className="mt-8">
      <h3 className="tracking-tight text-xl font-light text-stone-900">Product Type</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div 
          className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
            productData.type === "digital_product" 
              ? "border-emerald-300 bg-emerald-50 shadow-sm" 
              : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
          }`}
          onClick={() => handleTypeSelect("digital_product")}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${
            productData.type === "digital_product" 
              ? "border-emerald-300 bg-emerald-100 shadow-sm"
              : "border-stone-300 hover:border-stone-300 hover:bg-stone-50"
            }`}>
              <Download className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-light text-stone-900">Digital Product</h3>
              <p className="text-sm text-stone-500 font-light">Files, courses, software</p>
            </div>
          </div>
        </div>
        
        <div 
          className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
            productData.type === "physical_product" 
              ? "border-emerald-300 bg-emerald-50 shadow-sm" 
              : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
          }`}
          onClick={() => handleTypeSelect("physical_product")}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${
            productData.type === "physical_product" 
              ? "border-emerald-300 bg-emerald-100 shadow-sm"
              : "border-stone-300 hover:border-stone-300 hover:bg-stone-50"
            }`}>
              <Package className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <h3 className="font-light text-stone-900">Physical Product</h3>
              <p className="text-sm text-stone-500 font-light">Tangible goods, merchandise</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
