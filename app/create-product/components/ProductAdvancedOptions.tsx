'use client'

import { useState, useEffect } from 'react'
import { Product } from './ProductCreationForm'
import { Plus, X, Check, Lock, ThumbsUp } from 'lucide-react'
import ProductVariants from './ProductVariants'
import AdvancedInventory from './AdvancedInventory'
import ShippingFulfillment from './ShippingFulfillment'

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
  
  // One-time initialization for badges and trust indicators
  useEffect(() => {
    let needsUpdate = false;
    let updatedProduct = {...productData};
    
    // Initialize badges if needed
    if (!updatedProduct.badges) {
      updatedProduct.badges = {
        bestSeller: false,
        newRelease: false,
        popular: false,
        custom: []
      };
      needsUpdate = true;
    } else if (!Array.isArray(updatedProduct.badges.custom)) {
      updatedProduct.badges.custom = [];
      needsUpdate = true;
    }
    
    // Initialize trust indicators if needed
    if (!updatedProduct.trustIndicators) {
      updatedProduct.trustIndicators = {
        secureCheckout: true,
        instantDownload: true,
        refundPolicy: false,
        custom: []
      };
      needsUpdate = true;
    } else if (!Array.isArray(updatedProduct.trustIndicators.custom)) {
      updatedProduct.trustIndicators.custom = [];
      needsUpdate = true;
    }
    
    // Only update if needed
    if (needsUpdate) {
      setProductData(updatedProduct);
    }
  }, []);  // Empty dependency array means this only runs once on mount

  // Handle adding a new "What's Included" item
  const handleAddIncludedItem = () => {
    if (newIncludedItem.trim()) {
      // Ensure whatsIncluded is an array before spreading
      const currentItems = Array.isArray(productData.whatsIncluded) ? productData.whatsIncluded : [];
      setProductData({
        ...productData,
        whatsIncluded: [...currentItems, newIncludedItem.trim()]
      })
      setNewIncludedItem('')
    }
  }

  // Handle removing a "What's Included" item
  const handleRemoveIncludedItem = (index: number) => {
    // Ensure whatsIncluded is an array before spreading
    const currentItems = Array.isArray(productData.whatsIncluded) ? productData.whatsIncluded : [];
    const newItems = [...currentItems]
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
        <div className="mt-5 mb-8 border rounded-md p-4">
          <div className="flex items-center mb-4">
            <h3 className="text-xl font-light text-stone-900">Download Settings</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">Control how customers access your digital content</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Download Limit</label>
              <input
                type="text"
                value={productData.downloadSettings.downloadLimit}
                onChange={(e) => setProductData({
                  ...productData,
                  downloadSettings: {
                    ...productData.downloadSettings,
                    downloadLimit: parseInt(e.target.value) || 2
                  }
                })}
                className="w-full p-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum downloads per purchase</p>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Link Expiration (days)</label>
              <input
                type="text"
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

      {/* Physical Product Advanced Options */}
      {productData.type === 'physical_product' && (
        <>
          {/* Product Variants */}
          <ProductVariants
            productData={productData}
            setProductData={setProductData}
          />
          
          {/* Advanced Inventory */}
          <AdvancedInventory
            productData={productData}
            setProductData={setProductData}
          />
          
          {/* Shipping & Fulfillment */}
          <ShippingFulfillment
            productData={productData}
            setProductData={setProductData}
          />
        </>
      )}
      
      {/* What's Included Section */}
      <div className="mb-8 border rounded-md p-4">
        <h3 className="text-xl font-light mb-2">What's Included</h3>
        <p className="text-sm text-gray-500 mb-4">List what customers will get with this product</p>
        
        <div className="mb-3">
          {Array.isArray(productData.whatsIncluded) && productData.whatsIncluded.map((item, index) => (
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

          {(!Array.isArray(productData.whatsIncluded) || productData.whatsIncluded.length === 0) && (
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
          <h3 className="text-xl font-light mb-2">Course Curriculum</h3>
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
        <h3 className="text-xl font-light mb-2">Product Badges</h3>
        <p className="text-sm text-gray-500 mb-4 font-light">Add credibility badges to your digital product</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="flex items-center justify-between p-2 border rounded-md">
            <label htmlFor="badge-bestseller" className="text-sm font-light">Best Seller</label>
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input 
                type="checkbox" 
                id="badge-bestseller" 
                checked={productData.badges.bestSeller}
                onChange={(e) => setProductData({
                  ...productData,
                  badges: {...productData.badges, bestSeller: e.target.checked}
                })}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              />
              <label 
                htmlFor="badge-bestseller" 
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${productData.badges.bestSeller ? 'bg-emerald-500' : 'bg-stone-300'}`}
              ></label>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-2 border rounded-md">
            <label htmlFor="badge-new" className="text-sm font-light">New Release</label>
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input 
                type="checkbox" 
                id="badge-new" 
                checked={productData.badges.newRelease}
                onChange={(e) => setProductData({
                  ...productData,
                  badges: {...productData.badges, newRelease: e.target.checked}
                })}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              />
              <label 
                htmlFor="badge-new" 
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${productData.badges.newRelease ? 'bg-emerald-500' : 'bg-stone-300'}`}
              ></label>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-2 border rounded-md">
            <label htmlFor="badge-popular" className="text-sm font-light">Popular</label>
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input 
                type="checkbox" 
                id="badge-popular" 
                checked={productData.badges.popular}
                onChange={(e) => setProductData({
                  ...productData,
                  badges: {...productData.badges, popular: e.target.checked}
                })}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              />
              <label 
                htmlFor="badge-popular" 
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${productData.badges.popular ? 'bg-emerald-500' : 'bg-stone-300'}`}
              ></label>
            </div>
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
        <h3 className="text-xl font-light mb-2">Trust Indicators</h3>
        <p className="text-sm text-gray-500 mb-4 font-light">Add trust indicators to increase customer confidence</p>
        
        <div className="flex items-center justify-between p-2 border rounded-md mb-2">
          <div>
            <h4 className="text-sm font-light">Secure Checkout</h4>
            <p className="text-xs text-gray-500 font-light">Show that your checkout is secure</p>
          </div>
          <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
            <input 
              type="checkbox" 
              id="trust-secure" 
              checked={productData.trustIndicators.secureCheckout}
              onChange={(e) => setProductData({
                ...productData,
                trustIndicators: {...productData.trustIndicators, secureCheckout: e.target.checked}
              })}
              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
            />
            <label 
              htmlFor="trust-secure" 
              className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${productData.trustIndicators.secureCheckout ? 'bg-emerald-500' : 'bg-stone-300'}`}
            ></label>
          </div>
        </div>
        
        {productData.type === 'digital_product' && (
          <div className="flex items-center justify-between p-2 border rounded-md mb-2">
            <div>
              <h4 className="text-sm font-light">Instant Download</h4>
              <p className="text-xs text-gray-500 font-light">Show that your product is available immediately</p>
            </div>
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input 
                type="checkbox" 
                id="trust-download" 
                checked={productData.trustIndicators.instantDownload}
                onChange={(e) => setProductData({
                  ...productData,
                  trustIndicators: {...productData.trustIndicators, instantDownload: e.target.checked}
                })}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              />
              <label 
                htmlFor="trust-download" 
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${productData.trustIndicators.instantDownload ? 'bg-emerald-500' : 'bg-stone-300'}`}
              ></label>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between p-2 border rounded-md mb-2">
          <div>
            <h4 className="text-sm font-light">30-Day Refund Policy</h4>
            <p className="text-xs text-gray-500 font-light">Show that you offer refunds</p>
          </div>
          <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
            <input 
              type="checkbox" 
              id="trust-refund" 
              checked={productData.trustIndicators.refundPolicy}
              onChange={(e) => setProductData({
                ...productData,
                trustIndicators: {...productData.trustIndicators, refundPolicy: e.target.checked}
              })}
              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
            />
            <label 
              htmlFor="trust-refund" 
              className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${productData.trustIndicators.refundPolicy ? 'bg-emerald-500' : 'bg-stone-300'}`}
            ></label>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm mb-2">Custom Trust Indicators</label>
          <div className="mb-3">
            {productData.trustIndicators.custom.map((indicator, index) => (
              <div key={index} className="flex items-center justify-between mb-2 p-2 bg-stone-50 rounded-md border border-stone-200">
                <div className="flex items-center">
                  <ThumbsUp size={14} className="text-emerald-500 mr-2" />
                  <span className="text-sm font-light">{indicator}</span>
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
              placeholder="Add custom trust indicator"
              value={newCustomTrustIndicator}
              onChange={(e) => setNewCustomTrustIndicator(e.target.value)}
              className="flex-1 p-2 border rounded-l-md"
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
