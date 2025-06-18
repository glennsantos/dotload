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
      <h3 className="mb-4 tracking-tight text-xl font-light text-foreground">Product Type</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div 
          className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
            productData.type === 'digital' 
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border hover:border-muted-foreground hover:bg-muted"
          }`}
          onClick={() => handleTypeSelect("digital_product")}
        >
          <div className="flex items-center space-x-3">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${
              productData.type === 'digital'
                ? "border-primary bg-primary/10 shadow-sm text-primary"
                : "border-muted-foreground hover:border-muted-foreground hover:bg-muted text-muted-foreground"
            }`}>
              <Download className="h-5 w-5" />
            </div>
            <div>
                        <h3 className="font-light text-foreground">Digital Product</h3>
          <p className="text-sm text-muted-foreground font-light">Files, courses, software</p>
            </div>
          </div>
        </div>
        
        <div 
          className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
            productData.type === 'physical' 
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border hover:border-muted-foreground hover:bg-muted"
          }`}
          onClick={() => handleTypeSelect("physical_product")}
        >
          <div className="flex items-center space-x-3">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${
              productData.type === 'physical'
                ? "border-primary bg-primary/10 shadow-sm text-primary"
                : "border-muted-foreground hover:border-muted-foreground hover:bg-muted text-muted-foreground"
            }`}>
              <Package className="h-5 w-5" />
            </div>
            <div>
                        <h3 className="font-light text-foreground">Physical Product</h3>
          <p className="text-sm text-muted-foreground font-light">Tangible goods, merchandise</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
