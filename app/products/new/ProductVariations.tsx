"use client"

import { useState } from "react"
import { X, Plus, Trash2, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function ProductVariations({
  productData,
  setProductData,
  onNext,
  onCancel,
}: {
  productData: any
  setProductData: (data: any) => void
  onNext: () => void
  onCancel: () => void
}) {
  const [variations, setVariations] = useState<{ name: string; options: string[] }[]>(productData.variations || [])

  const addVariation = () => {
    setVariations([...variations, { name: "", options: [""] }])
  }

  const removeVariation = (index: number) => {
    const newVariations = [...variations]
    newVariations.splice(index, 1)
    setVariations(newVariations)
  }

  const updateVariationName = (index: number, name: string) => {
    const newVariations = [...variations]
    newVariations[index].name = name
    setVariations(newVariations)
  }

  const addOption = (variationIndex: number) => {
    const newVariations = [...variations]
    newVariations[variationIndex].options.push("")
    setVariations(newVariations)
  }

  const updateOption = (variationIndex: number, optionIndex: number, value: string) => {
    const newVariations = [...variations]
    newVariations[variationIndex].options[optionIndex] = value
    setVariations(newVariations)
  }

  const removeOption = (variationIndex: number, optionIndex: number) => {
    const newVariations = [...variations]
    newVariations[variationIndex].options.splice(optionIndex, 1)
    setVariations(newVariations)
  }

  const handleSave = () => {
    setProductData({
      ...productData,
      variations,
    })
    onNext()
  }

  return (
    <div>
      <div className="bg-gray-50 py-2 px-6 border-b">
        <div className="flex items-center text-sm">
          <Link href="/products" className="text-gray-600 hover:text-black">
            Products
          </Link>
          <ChevronRight size={16} className="mx-2 text-gray-400" />
          <span className="font-medium">Product Variations</span>
        </div>
      </div>

      <header className="p-6 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-normal truncate">
            {productData.name || "Solo Travel to Japan in Your 20s: A Comprehensive Guide"}
          </h1>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
            <button 
              onClick={onCancel} 
              className="w-full sm:w-auto px-4 py-2 border rounded-md flex items-center justify-center gap-2"
            >
              <X size={18} /> Cancel
            </button>
            <button 
              onClick={handleSave} 
              className="w-full sm:w-auto px-4 py-2 bg-black text-white rounded-md"
            >
              Continue
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-medium mb-4">Product Variations</h2>
          <p className="text-gray-600 mb-6">
            Add variations like size, color, or format to give customers more options. (Optional)
          </p>

          {variations.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed rounded-md">
              <h3 className="font-medium mb-2">No variations added yet (Optional)</h3>
              <p className="text-gray-600 mb-4">Add variations like size, color, or format if needed</p>
              <button onClick={addVariation} className="px-4 py-2 bg-black text-white rounded-md">
                Add Variation
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {variations.map((variation, variationIndex) => (
                <div key={variationIndex} className="border rounded-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Variation {variationIndex + 1}</h3>
                    <button onClick={() => removeVariation(variationIndex)} className="text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium">Variation Name</label>
                    <input
                      type="text"
                      value={variation.name}
                      onChange={(e) => updateVariationName(variationIndex, e.target.value)}
                      placeholder="e.g., Size, Color, Format"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium">Options</label>
                    <div className="space-y-2">
                      {variation.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex gap-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(variationIndex, optionIndex, e.target.value)}
                            placeholder={`Option ${optionIndex + 1}`}
                            className="flex-1 p-2 border rounded-md"
                          />
                          <button
                            onClick={() => removeOption(variationIndex, optionIndex)}
                            className="p-2 text-red-500"
                            disabled={variation.options.length <= 1}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => addOption(variationIndex)} className="flex items-center gap-1 text-blue-600">
                    <Plus size={16} /> Add Option
                  </button>
                </div>
              ))}

              <button onClick={addVariation} className="flex items-center gap-2 px-4 py-2 border rounded-md">
                <Plus size={18} /> Add Another Variation
              </button>
            </div>
          )}
        </div>

        {productData.type === "physical" && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-2xl font-medium mb-4">Shipping Options</h2>

            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Domestic Shipping</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm">Price</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-gray-100">
                        $
                      </span>
                      <input type="text" className="flex-1 p-2 border rounded-r-md" placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">Estimated Delivery</label>
                    <input type="text" className="w-full p-2 border rounded-md" placeholder="3-5 business days" />
                  </div>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">International Shipping</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm">Price</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-gray-100">
                        $
                      </span>
                      <input type="text" className="flex-1 p-2 border rounded-r-md" placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">Estimated Delivery</label>
                    <input type="text" className="w-full p-2 border rounded-md" placeholder="7-14 business days" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
