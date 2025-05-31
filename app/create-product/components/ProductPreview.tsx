'use client'

import { Product } from './ProductCreationForm'
import { Maximize } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getClientUser } from '@/lib/client-auth-utils'
import { Button } from '@/components/ui/button'
import ClientProductPage from '@/app/p/[slug]/client-page'

type ProductPreviewProps = {
  productData: Product
}

export default function ProductPreview({ productData }: ProductPreviewProps) {
  const [userData, setUserData] = useState({
    userName: "Your Store",
    storeLogoPath: ""
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Transform the productData to match the format expected by ClientProductPage
  const transformedProduct = {
    id: productData.id || 'preview',
    name: productData.name || 'Product Name',
    slug: productData.slug || 'preview',
    description: productData.description || 'Product description will appear here.',
    price: productData.price || 0,
    coverImagePath: productData.coverImagePath || (productData.coverImage ? URL.createObjectURL(productData.coverImage) : '/placeholder.jpg'),
    type: productData.type || 'digital_product',
    whatsIncluded: JSON.stringify(productData.whatsIncluded || []),
    customTrustIndicators: JSON.stringify(productData.trustIndicators?.custom || []),
    customBadges: JSON.stringify(productData.badges?.custom || []),
    bestSeller: productData.badges?.bestSeller || false,
    newRelease: productData.badges?.newRelease || false,
    popular: productData.badges?.popular || false,
    secureCheckout: productData.trustIndicators?.secureCheckout || false,
    instantDownload: productData.trustIndicators?.instantDownload || false,
    refundPolicy: productData.trustIndicators?.refundPolicy || false,
    user: {
      storeName: userData.userName,
      storeLogoPath: userData.storeLogoPath
    }
  };

  // Render the fullscreen preview
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-light">Product Preview</h2>
          <Button 
            onClick={toggleFullscreen}
            variant="outline"
          >
            Exit Fullscreen
          </Button>
        </div>
        
        <div className="mt-4">
          <ClientProductPage 
            product={transformedProduct} 
            slug="preview" 
          />
        </div>
      </div>
    );
  }

  // Regular preview
  return (
    <div className="sticky top-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-light">Product Preview <span className="text-xs bg-stone-100 text-stone-800 px-2 py-1 rounded-full">Live Preview</span></h3>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleFullscreen}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            title="View fullscreen"
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        {/* Use the ClientProductPage component for consistent rendering */}
        <div className="scale-[0.85] origin-top">
          <ClientProductPage 
            product={transformedProduct} 
            slug="preview" 
          />
        </div>
      </div>
    </div>
  )
}
