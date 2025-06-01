'use client'

import { Product } from './ProductCreationForm'
import { Maximize } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getClientUser } from '@/lib/client-auth-utils'
import { Button } from '@/components/ui/button'
import ClientProductPage from '@/app/p/[slug]/client-page'

type ProductPreviewProps = {
  productData: Product
  variant?: 'default' | 'success'
}

export default function ProductPreview({ productData, variant = 'default' }: ProductPreviewProps) {
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

  // Helper function to safely get array data
  const safeGetArray = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Helper function to safely stringify array data
  const safeStringifyArray = (data: any): string => {
    const arrayData = safeGetArray(data);
    return JSON.stringify(arrayData);
  };

  // Helper function to safely get boolean values
  const safeGetBoolean = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value === 'true';
    if (typeof value === 'number') return value !== 0;
    return false;
  };

  // Transform the productData to match the format expected by ClientProductPage
  const transformedProduct = {
    id: productData.id || 'preview',
    name: productData.name || 'Product Name',
    slug: productData.slug || 'preview',
    description: productData.description || 'Product description will appear here.',
    price: Number(productData.price) || 0,
    coverImagePath: productData.coverImagePath || (productData.coverImage ? URL.createObjectURL(productData.coverImage) : '/placeholder.jpg'),
    type: productData.type || 'digital_product',
    
    // Safely handle arrays that might be strings or objects from API response
    whatsIncluded: safeStringifyArray(productData.whatsIncluded),
    customTrustIndicators: safeStringifyArray(productData.trustIndicators?.custom),
    customBadges: safeStringifyArray(productData.badges?.custom),
    
    // Handle boolean values safely
    bestSeller: safeGetBoolean(productData.badges?.bestSeller),
    newRelease: safeGetBoolean(productData.badges?.newRelease),
    popular: safeGetBoolean(productData.badges?.popular),
    secureCheckout: safeGetBoolean(productData.trustIndicators?.secureCheckout),
    instantDownload: safeGetBoolean(productData.trustIndicators?.instantDownload),
    refundPolicy: safeGetBoolean(productData.trustIndicators?.refundPolicy),
    
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

  // Default variant - sticky with scaling
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
