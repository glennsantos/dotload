'use client'

import { useState } from 'react'
import { Product } from './ProductCreationForm'
import { Plus, X, Package } from 'lucide-react'

type ProductVariantsProps = {
  productData: Product
  setProductData: (data: Product) => void
}

type Variant = {
  name: string
  displayType: string
  options: string[]
}

export default function ProductVariants({
  productData,
  setProductData
}: ProductVariantsProps) {
  const [showVariantForm, setShowVariantForm] = useState(false)
  const [variantName, setVariantName] = useState('')
  const [displayType, setDisplayType] = useState('Dropdown')
  const [currentOption, setCurrentOption] = useState('')

  // Only show this component for physical products
  if (productData.type !== 'physical_product') {
    return null
  }

  const handleAddVariant = () => {
    if (!variantName.trim()) return
    
    // Add the new variant to the product data
    const newVariant: Variant = {
      name: variantName,
      displayType: displayType,
      options: []
    }
    
    setProductData({
      ...productData,
      variants: [...(productData.variants || []), newVariant]
    })
    
    // Reset form and hide it
    setVariantName('')
    setDisplayType('Dropdown')
    setShowVariantForm(false)
  }

  const handleAddOption = (variantIndex: number) => {
    if (!currentOption.trim()) return
    
    const updatedVariants = [...(productData.variants || [])]
    updatedVariants[variantIndex].options.push(currentOption)
    
    setProductData({
      ...productData,
      variants: updatedVariants
    })
    
    setCurrentOption('')
  }

  const handleRemoveVariant = (index: number) => {
    const updatedVariants = [...(productData.variants || [])]
    updatedVariants.splice(index, 1)
    
    setProductData({
      ...productData,
      variants: updatedVariants
    })
  }

  const handleRemoveOption = (variantIndex: number, optionIndex: number) => {
    const updatedVariants = [...(productData.variants || [])]
    updatedVariants[variantIndex].options.splice(optionIndex, 1)
    
    setProductData({
      ...productData,
      variants: updatedVariants
    })
  }

  return (
    <div className="mt-8 mb-6 border rounded-md p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
                <h3 className="tracking-tight text-xl font-light text-foreground">Product Variants</h3>
      <p className="text-sm text-muted-foreground mb-4 font-light">
            Add different options like size, color, or material for your physical products
          </p>
        </div>
        <button
          onClick={() => setShowVariantForm(true)}
          className="flex items-center text-sm bg-background border border-border text-foreground px-3 py-1.5 rounded-md hover:bg-muted"
        >
          <Plus size={16} className="mr-1" />
          Add Variant
        </button>
      </div>
      
      {/* Variant Form */}
      {showVariantForm && (
        <div className="border rounded-md p-4 mb-4 bg-muted">
          <div className="mb-4">
            <label htmlFor="variant-name" className="block text-sm font-light mb-1">
              Variant Name
            </label>
            <input
              id="variant-name"
              type="text"
              placeholder="e.g., Size, Color, Material"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="display-type" className="block text-sm font-light mb-1">
              Display Type
            </label>
            <select
              id="display-type"
              value={displayType}
              onChange={(e) => setDisplayType(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="Dropdown">Dropdown</option>
              <option value="Buttons">Buttons</option>
              <option value="Color Swatch">Color Swatch</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowVariantForm(false)}
              className="px-3 py-1.5 border border-border rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAddVariant}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Add Variant
            </button>
          </div>
        </div>
      )}
      
      {/* Existing Variants */}
      {productData.variants && productData.variants.length > 0 && (
        <div className="space-y-4">
          {productData.variants.map((variant, variantIndex) => (
            <div key={variantIndex} className="border rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium">{variant.name}</h4>
                  <p className="text-xs text-muted-foreground">Display as: {variant.displayType}</p>
                </div>
                <button
                  onClick={() => handleRemoveVariant(variantIndex)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <X size={16} />
                </button>
              </div>
              
              {/* Options */}
              <div className="mt-2">
                <p className="text-sm font-light mb-1">Options:</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {variant.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center bg-muted px-2 py-1 rounded-md">
                      <span className="text-sm">{option}</span>
                      <button
                        onClick={() => handleRemoveOption(variantIndex, optionIndex)}
                        className="ml-1 text-destructive hover:text-destructive/80"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Add Option */}
                <div className="flex mt-2">
                  <input
                    type="text"
                    placeholder="Add option"
                    value={currentOption}
                    onChange={(e) => setCurrentOption(e.target.value)}
                    className="flex-1 p-1.5 border rounded-l-md text-sm"
                  />
                  <button
                    onClick={() => handleAddOption(variantIndex)}
                    className="bg-primary text-primary-foreground px-2 py-1 rounded-r-md"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {(!productData.variants || productData.variants.length === 0) && !showVariantForm && (
        <div className="text-center py-6 border-dashed border-2 rounded-md">
                      <Package size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">No variants added yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Add variants like size, color, or material</p>
        </div>
      )}
    </div>
  )
}
