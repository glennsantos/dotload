'use client'

import { Product } from './ProductCreationForm'
import { Lock, ThumbsUp, Download, RefreshCcw } from 'lucide-react'
import RichTextRenderer from '@/components/rich-text-renderer'
import { useEffect, useState } from 'react'
import { getClientUser } from '@/lib/client-auth-utils'
import Image from 'next/image'

type ProductPreviewProps = {
  productData: Product
}

export default function ProductPreview({ productData }: ProductPreviewProps) {
  const [userData, setUserData] = useState({
    userName: "Your Store",
    storeLogoPath: ""
  });
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getClientUser();
        
        if (user) {
          setUserData({
            userName: user.name || 'Your Store',
            storeLogoPath: user.storeLogoPath || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();
  }, []);
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
      <div className="flex justify-end mb-2">
        <button className="text-xs text-gray-500 hover:text-gray-700">Live Preview</button>
      </div>
      
      <div className="border rounded-2xl overflow-hidden bg-white">
        {/* Store Header */}
        <div className="p-3 bg-gray-50 flex items-center">
          {userData.storeLogoPath ? (
            <img 
              src={userData.storeLogoPath} 
              alt="Store logo" 
              className="w-6 h-6 rounded-full object-cover mr-2" 
            />
          ) : (
            <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-white text-xs mr-2">
              {userData.userName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-lg font-light">{userData.userName}</span>
        </div>
        
        {/* Product Preview */}
        <div className="p-4 flex flex-col items-center">
          {productData.coverImage ? (
            <img 
              src={URL.createObjectURL(productData.coverImage)} 
              alt="Product thumbnail" 
              className="object-cover mb-2 rounded-3xl"
            />
          ) : productData.coverImagePath ? (
            <img 
              src={
                // Handle URLs that start with http:// or https://
                productData.coverImagePath.startsWith('http') ? productData.coverImagePath :
                // Handle protocol-relative URLs that start with //
                productData.coverImagePath.startsWith('//') ? `https:${productData.coverImagePath}` :
                // Handle absolute paths that start with /
                productData.coverImagePath.startsWith('/') ? productData.coverImagePath :
                // Handle relative paths by adding a leading /
                `/${productData.coverImagePath}`
              } 
              alt="Product thumbnail" 
              className="object-cover mb-2 rounded-3xl"
            />
          ) : (
            <div className="bg-gray-100 flex items-center justify-center mb-2 rounded-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
          )}          
          
          {/* Product Name */}
          <h3 className="text-2xl font-medium text-center mb-1 mt-4">
            {productData.name || 'Product Name'}
          </h3>

          <div className="mt-4">
            
            {/* Stock information for physical products */}
            {productData.type === 'physical_product' && (
              <div className="mt-1">
                <span className="text-sm text-stone-600">
                  {productData.stockQuantity === null || productData.stockQuantity === undefined ? 
                    'In Stock' : 
                    productData.stockQuantity > 0 ? 
                      `${productData.stockQuantity} in stock` : 
                      'Out of stock'}
                </span>
              </div>
            )}
          </div>

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
              
              {/* Custom badges */}
              {Array.isArray(productData.badges.custom) && productData.badges.custom.map((badge, index) => (
                <span key={index} className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                  {badge}
                </span>
              ))}
            </div>
          )}
          
          {/* Product Description */}
          <div className="text-sm text-gray-600 font-light mb-4">
            <RichTextRenderer 
              content={productData.description || 'Product description will appear here. Add a description to help customers understand what you\'re offering.'}
              className="text-gray-600"
            />
          </div>
          
          {/* Product Price */}
          <div className="text-2xl font-light mb-4">
            {getCurrencySymbol(productData.currency)}
            {productData.price > 0 
              ? productData.price.toFixed(2) 
              : '0.00'}
          </div>
          
          {/* Buy Button */}
          <button className="w-full bg-emerald-500 text-white py-2 px-4 rounded-md hover:bg-emerald-600 transition mb-2 text-xl font-normal">
            Buy Now
          </button>

          {/* What's Included Section - Only show if items exist */}
          {Array.isArray(productData.whatsIncluded) && productData.whatsIncluded.length > 0 && (
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
            <div className="flex flex-wrap items-center justify-center w-full text-xs text-gray-500 gap-4 mt-2">
              {productData.trustIndicators.secureCheckout && (
                <div className="flex items-center">
                  <Lock size={14} className="mr-1 text-emerald-500" />
                  <span>Secure Checkout</span>
                </div>
              )}
              
              {productData.type === 'digital_product' && productData.trustIndicators.instantDownload && (
                <div className="flex items-center">
                  <Download size={14} className="mr-1 text-emerald-500" />
                  <span>Instant Download</span>
                </div>
              )}
              
              {productData.trustIndicators.refundPolicy && (
                <div className="flex items-center">
                  <RefreshCcw size={14} className="mr-1 text-emerald-500" />
                  <span>Money-back Guarantee</span>
                </div>
              )}

              {/* Custom Trust Indicators */}
              {Array.isArray(productData.trustIndicators.custom) && productData.trustIndicators.custom.map((indicator, index) => (
                <div key={index} className="flex items-center">
                  <ThumbsUp size={14} className="mr-1 text-emerald-500" />
                  <span>{indicator}</span>
                </div>
              ))}
            </div>
          )}

        </div>
        
        {/* Powered by alacart footer */}
        <div className="py-6 text-center mx-auto text-xs text-stone-500 font-light flex flex-col items-center justify-center gap-1 border-t m-8">
          <div className="text-sm">Powered by</div>
          <div className="flex items-center mt-2">
            <Image 
              src="/logo.png" 
              alt="Alacart Logo" 
              width={200}
              height={40}
              className="h-6 w-auto sm:h-10"
              priority
            />
          </div>
        </div>

      </div>
    </div>
  )
}
