'use client'

import { Product } from './ProductCreationForm'

type ProductTypeCardProps = {
  icon: string
  title: string
  description: string
  selected: boolean
  onClick: () => void
}

function ProductTypeCard({
  icon,
  title,
  description,
  selected,
  onClick,
}: ProductTypeCardProps) {
  return (
    <div
      className={`border rounded-md p-4 cursor-pointer hover:border-gray-400 ${selected ? "border-2 border-emerald-500" : ""}`}
      onClick={onClick}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

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
      <h3 className="text-base font-medium mb-2">Product Type</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ProductTypeCard
          icon="🖥️"
          title="Digital Product"
          description="Files, courses, software"
          selected={productData.type === "digital_product"}
          onClick={() => handleTypeSelect("digital_product")}
        />
        <ProductTypeCard
          icon="📦"
          title="Physical Product"
          description="Tangible goods, merchandise"
          selected={productData.type === "physical_product"}
          onClick={() => handleTypeSelect("physical_product")}
        />
      </div>
    </div>
  )
}
