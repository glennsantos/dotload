'use client'

import { Product } from './ProductCreationForm'
import { Lock } from 'lucide-react'

type ProductPreviewProps = {
  productData: Product
}

export default function ProductPreview({ productData }: ProductPreviewProps) {
  // Get currency symbol based on selected currency
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'PHP':
        return '₱'
      case 'USD':
        return '$'
      case 'EUR':
        return '€'
      default:
        return '₱' // Default to PHP
    }
  }

  return (
    <div className="sticky top-4">
      <h3 className="text-xl font-light mb-2">Product Preview</h3>
      <div className="flex justify-end mb-2">
        <button className="text-xs text-gray-500 hover:text-gray-700">Live Preview</button>
      </div>
      
      <div className="border rounded-md overflow-hidden bg-white">
        {/* Store Header */}
        <div className="p-3 bg-gray-50 flex items-center">
          <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-white text-xs mr-2">YS</div>
          <span className="text-sm font-medium">Your Store</span>
        </div>
        
        {/* Product Preview */}
        <div className="p-4 flex flex-col items-center">
          {productData.coverImage ? (
            <img 
              src={URL.createObjectURL(productData.coverImage)} 
              alt="Product thumbnail" 
              className="w-24 h-24 object-cover mb-2 rounded-md"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-100 flex items-center justify-center mb-2 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
          )}
          
          {/* Product Badges */}
          {productData.badges && (
            <div className="flex flex-wrap justify-center gap-1 my-3">
              {productData.badges.bestSeller && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                  Best Seller
                </span>
              )}
              
              {productData.badges.newRelease && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  New Release
                </span>
              )}
              
              {productData.badges.popular && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  Popular
                </span>
              )}
              
              {productData.badges.custom.map((badge, index) => (
                <span key={index} className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                  {badge}
                </span>
              ))}

              {/* Product Type Badge */}
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {productData.type === 'digital_product' 
                  ? 'Digital Product' 
                  : productData.type === 'physical_product' 
                    ? 'Physical Product' 
                    : 'Product'}
              </span> 
            </div>
          )}
          
          
          {/* Product Name */}
          <h3 className="text-2xl font-light text-center mb-1">
            {productData.name || 'Product Name'}
          </h3>
          
          {/* Product Description */}
          <p className="text-sm text-gray-600 font-light text-center mb-4 line-clamp-3">
            {productData.description || 'Product description will appear here. Add a description to help customers understand what you\'re offering.'}
          </p>
          
          {/* Product Price */}
          <div className="text-xl font-light mb-4">
            {getCurrencySymbol(productData.currency)}
            {productData.price > 0 
              ? productData.price.toFixed(2) 
              : '0.00'}
          </div>
          
          {/* Buy Button */}
          <button className="w-full bg-emerald-500 text-white py-2 px-4 rounded-md hover:bg-emerald-600 transition mb-2">
            {productData.type === 'digital_product' 
              ? 'Buy Now - Instant Download' 
              : 'Buy Now'}
          </button>

          {/* What's Included Section - Only show if items exist */}
          {productData.whatsIncluded.length > 0 && (
            <div className="p-4 border font-light rounded-xl py-6 my-4">
              <h4 className="text-md mb-2 text-center">What's Included</h4>
              <ul className="space-y-1">
                {productData.whatsIncluded.map((item, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Trust Indicators */}
          {productData.trustIndicators && (
            <div className="flex items-center justify-center w-full text-xs text-gray-500 space-x-4 mt-2">
              {productData.trustIndicators.secureCheckout && (
                <div className="flex items-center">
                  <Lock size={14} className="mr-1" />
                  <span>Secure Checkout</span>
                </div>
              )}
              
              {productData.type === 'digital_product' && productData.trustIndicators.instantDownload && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Instant Download</span>
                </div>
              )}
              
              {productData.trustIndicators.refundPolicy && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  <span>Money-back Guarantee</span>
                </div>
              )}
            </div>
          )}

        </div>
        
        
      </div>
    </div>
  )
}
