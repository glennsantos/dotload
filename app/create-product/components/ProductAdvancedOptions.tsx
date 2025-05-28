'use client'

import { useState } from 'react'
import { Product } from './ProductCreationForm'
import { Plus, X, Check, Lock } from 'lucide-react'

type ProductAdvancedOptionsProps = {
  productData: Product
  setProductData: (data: Product) => void
}

export default function ProductAdvancedOptions({ 
  productData, 
  setProductData 
}: ProductAdvancedOptionsProps) {
  const [newIncludedItem, setNewIncludedItem] = useState('')
  const [newCustomBadge, setNewCustomBadge] = useState('')
  const [newCustomTrustIndicator, setNewCustomTrustIndicator] = useState('')
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [newModuleItem, setNewModuleItem] = useState('')
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number | null>(null)

  // Handle adding a new "What's Included" item
  const handleAddIncludedItem = () => {
    if (newIncludedItem.trim()) {
      setProductData({
        ...productData,
        whatsIncluded: [...productData.whatsIncluded, newIncludedItem.trim()]
      })
      setNewIncludedItem('')
    }
  }

  // Handle removing a "What's Included" item
  const handleRemoveIncludedItem = (index: number) => {
    const newItems = [...productData.whatsIncluded]
    newItems.splice(index, 1)
    setProductData({...productData, whatsIncluded: newItems})
  }

  // Handle adding a new module to curriculum
  const handleAddModule = () => {
    if (newModuleTitle.trim()) {
      setProductData({
        ...productData,
        curriculum: [...productData.curriculum, {title: newModuleTitle.trim(), items: []}]
      })
      setNewModuleTitle('')
      setSelectedModuleIndex(productData.curriculum.length)
    }
  }

  // Handle removing a module from curriculum
  const handleRemoveModule = (index: number) => {
    const newCurriculum = [...productData.curriculum]
    newCurriculum.splice(index, 1)
    setProductData({...productData, curriculum: newCurriculum})
    setSelectedModuleIndex(null)
  }

  // Handle adding an item to a module
  const handleAddModuleItem = (moduleIndex: number) => {
    if (newModuleItem.trim()) {
      const newCurriculum = [...productData.curriculum]
      newCurriculum[moduleIndex].items.push(newModuleItem.trim())
      setProductData({...productData, curriculum: newCurriculum})
      setNewModuleItem('')
    }
  }

  // Handle removing an item from a module
  const handleRemoveModuleItem = (moduleIndex: number, itemIndex: number) => {
    const newCurriculum = [...productData.curriculum]
    newCurriculum[moduleIndex].items.splice(itemIndex, 1)
    setProductData({...productData, curriculum: newCurriculum})
  }

  // Handle adding a custom badge
  const handleAddCustomBadge = () => {
    if (newCustomBadge.trim()) {
      setProductData({
        ...productData,
        badges: {
          ...productData.badges,
          custom: [...productData.badges.custom, newCustomBadge.trim()]
        }
      })
      setNewCustomBadge('')
    }
  }

  // Handle removing a custom badge
  const handleRemoveCustomBadge = (index: number) => {
    const newCustomBadges = [...productData.badges.custom]
    newCustomBadges.splice(index, 1)
    setProductData({
      ...productData,
      badges: {...productData.badges, custom: newCustomBadges}
    })
  }

  // Handle adding a custom trust indicator
  const handleAddCustomTrustIndicator = () => {
    if (newCustomTrustIndicator.trim()) {
      setProductData({
        ...productData,
        trustIndicators: {
          ...productData.trustIndicators,
          custom: [...productData.trustIndicators.custom, newCustomTrustIndicator.trim()]
        }
      })
      setNewCustomTrustIndicator('')
    }
  }

  // Handle removing a custom trust indicator
  const handleRemoveCustomTrustIndicator = (index: number) => {
    const newCustomIndicators = [...productData.trustIndicators.custom]
    newCustomIndicators.splice(index, 1)
    setProductData({
      ...productData,
      trustIndicators: {...productData.trustIndicators, custom: newCustomIndicators}
    })
  }

  return (
    <div className="space-y-8">
      {/* Download Settings - Only for digital products */}
      {productData.type === 'digital_product' && (
        <div className="mb-8 border rounded-md p-4">
          <div className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <h3 className="text-base font-medium">Download Settings</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">Control how customers access your digital content</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Download Limit</label>
              <input
                type="number"
                min="1"
                value={productData.downloadSettings.downloadLimit}
                onChange={(e) => setProductData({
                  ...productData,
                  downloadSettings: {
                    ...productData.downloadSettings,
                    downloadLimit: parseInt(e.target.value) || 5
                  }
                })}
                className="w-full p-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum downloads per purchase</p>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Link Expiration (days)</label>
              <input
                type="number"
                min="1"
                value={productData.downloadSettings.linkExpiration}
                onChange={(e) => setProductData({
                  ...productData,
                  downloadSettings: {
                    ...productData.downloadSettings,
                    linkExpiration: parseInt(e.target.value) || 30
                  }
                })}
                className="w-full p-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">How long download links remain active</p>
            </div>
          </div>
        </div>
      )}
      
      {/* What's Included Section */}
      <div className="mb-8 border rounded-md p-4">
        <h3 className="text-base font-medium mb-2">What's Included</h3>
        <p className="text-sm text-gray-500 mb-4">List what customers will get with this product</p>
        
        <div className="mb-3">
          {productData.whatsIncluded.map((item, index) => (
            <div key={index} className="flex items-center justify-between mb-2 p-2 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <Check size={16} className="text-emerald-500 mr-2" />
                <span className="text-sm">{item}</span>
              </div>
              <button
                onClick={() => handleRemoveIncludedItem(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          ))}

          {productData.whatsIncluded.length === 0 && (
            <p className="text-sm text-gray-400 italic mb-2">No items added yet</p>
          )}
        </div>
        
        <div className="flex">
          <input
            type="text"
            placeholder="e.g., '10 HD video lessons'"
            className="flex-grow p-2 border rounded-l-md"
            value={newIncludedItem}
            onChange={(e) => setNewIncludedItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddIncludedItem()
              }
            }}
          />
          <button
            className="px-4 py-2 bg-gray-100 border border-l-0 rounded-r-md"
            onClick={handleAddIncludedItem}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      
      {/* Course Curriculum - Only for digital products */}
      {productData.type === 'digital_product' && (
        <div className="mb-8 border rounded-md p-4">
          <h3 className="text-base font-medium mb-2">Course Curriculum</h3>
          <p className="text-sm text-gray-500 mb-4">Add modules, lessons, and resources</p>
          
          {productData.curriculum.length > 0 ? (
            <div className="mb-4">
              {productData.curriculum.map((module, moduleIndex) => (
                <div key={moduleIndex} className="mb-4 p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{module.title}</h4>
                    <button
                      onClick={() => handleRemoveModule(moduleIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <ul className="space-y-1 mb-3">
                    {module.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <span className="text-sm">{item}</span>
                        <button
                          onClick={() => handleRemoveModuleItem(moduleIndex, itemIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Add lesson or item"
                      className="flex-grow p-2 border rounded-l-md text-sm"
                      value={selectedModuleIndex === moduleIndex ? newModuleItem : ''}
                      onChange={(e) => {
                        setSelectedModuleIndex(moduleIndex)
                        setNewModuleItem(e.target.value)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddModuleItem(moduleIndex)
                        }
                      }}
                    />
                    <button
                      className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-md"
                      onClick={() => handleAddModuleItem(moduleIndex)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic mb-4">No modules added yet.</p>
          )}
          
          <div className="mt-3">
            <div className="flex">
              <input
                type="text"
                placeholder="Enter module title"
                className="flex-grow p-2 border rounded-l-md"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddModule()
                  }
                }}
              />
              <button
                className="px-4 py-2 bg-gray-100 border border-l-0 rounded-r-md"
                onClick={handleAddModule}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Product Badges */}
      <div className="mb-8 border rounded-md p-4">
        <h3 className="text-base font-medium mb-2">Product Badges</h3>
        <p className="text-sm text-gray-500 mb-4">Add credibility badges to your digital product</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="badge-bestseller"
              checked={productData.badges.bestSeller}
              onChange={(e) => setProductData({
                ...productData,
                badges: {...productData.badges, bestSeller: e.target.checked}
              })}
              className="mr-2"
            />
            <label htmlFor="badge-bestseller" className="text-sm">Best Seller</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="badge-new"
              checked={productData.badges.newRelease}
              onChange={(e) => setProductData({
                ...productData,
                badges: {...productData.badges, newRelease: e.target.checked}
              })}
              className="mr-2"
            />
            <label htmlFor="badge-new" className="text-sm">New Release</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="badge-popular"
              checked={productData.badges.popular}
              onChange={(e) => setProductData({
                ...productData,
                badges: {...productData.badges, popular: e.target.checked}
              })}
              className="mr-2"
            />
            <label htmlFor="badge-popular" className="text-sm">Popular</label>
          </div>
        </div>
        
        <div>
          <label className="block text-sm mb-2">Custom Badges</label>
          <div className="mb-3">
            {productData.badges.custom.map((badge, index) => (
              <div key={index} className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs mr-2 mb-2 flex items-center">
                <span>{badge}</span>
                <button
                  onClick={() => handleRemoveCustomBadge(index)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {productData.badges.custom.length === 0 && (
              <p className="text-sm text-gray-400 italic mb-2">No custom badges added</p>
            )}
          </div>
          
          <div className="flex">
            <input
              type="text"
              placeholder="e.g., 'Limited Time'"
              className="flex-grow p-2 border rounded-l-md"
              value={newCustomBadge}
              onChange={(e) => setNewCustomBadge(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCustomBadge()
                }
              }}
            />
            <button
              className="px-4 py-2 bg-gray-100 border border-l-0 rounded-r-md"
              onClick={handleAddCustomBadge}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Trust Indicators */}
      <div className="mb-8 border rounded-md p-4">
        <h3 className="text-base font-medium mb-2">Trust Indicators</h3>
        <p className="text-sm text-gray-500 mb-4">Build customer confidence in your digital product</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="trust-secure"
              checked={productData.trustIndicators.secureCheckout}
              onChange={(e) => setProductData({
                ...productData,
                trustIndicators: {...productData.trustIndicators, secureCheckout: e.target.checked}
              })}
              className="mr-2"
            />
            <label htmlFor="trust-secure" className="text-sm">Secure Checkout</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="trust-instant"
              checked={productData.trustIndicators.instantDownload}
              onChange={(e) => setProductData({
                ...productData,
                trustIndicators: {...productData.trustIndicators, instantDownload: e.target.checked}
              })}
              className="mr-2"
            />
            <label htmlFor="trust-instant" className="text-sm">Instant Download</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="trust-refund"
              checked={productData.trustIndicators.refundPolicy}
              onChange={(e) => setProductData({
                ...productData,
                trustIndicators: {...productData.trustIndicators, refundPolicy: e.target.checked}
              })}
              className="mr-2"
            />
            <label htmlFor="trust-refund" className="text-sm">30-day refund policy</label>
          </div>
        </div>
        
        <div>
          <label className="block text-sm mb-2">Custom Trust Indicators</label>
          <div className="mb-3">
            {productData.trustIndicators.custom.map((indicator, index) => (
              <div key={index} className="flex items-center justify-between mb-2 p-2 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <Lock size={14} className="text-gray-500 mr-2" />
                  <span className="text-sm">{indicator}</span>
                </div>
                <button
                  onClick={() => handleRemoveCustomTrustIndicator(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            {productData.trustIndicators.custom.length === 0 && (
              <p className="text-sm text-gray-400 italic mb-2">No custom trust indicators added</p>
            )}
          </div>
          
          <div className="flex">
            <input
              type="text"
              placeholder="e.g., '24/7 Support'"
              className="flex-grow p-2 border rounded-l-md"
              value={newCustomTrustIndicator}
              onChange={(e) => setNewCustomTrustIndicator(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCustomTrustIndicator()
                }
              }}
            />
            <button
              className="px-4 py-2 bg-gray-100 border border-l-0 rounded-r-md"
              onClick={handleAddCustomTrustIndicator}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
