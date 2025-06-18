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
  externalFullscreen?: boolean
  onToggleFullscreen?: () => void
}

export default function ProductPreview({ 
  productData, 
  variant = 'default', 
  externalFullscreen = false, 
  onToggleFullscreen 
}: ProductPreviewProps) {
  const [userData, setUserData] = useState({
    userName: "Your Store",
    storeLogoPath: ""
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Use external fullscreen state if provided, otherwise use internal state
  const fullscreenState = onToggleFullscreen ? externalFullscreen : isFullscreen;
  
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
    if (onToggleFullscreen) {
      onToggleFullscreen();
    } else {
      setIsFullscreen(!isFullscreen);
    }
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
  if (fullscreenState) {
    return (
      <div className="fixed inset-0 bg-background z-50 overflow-auto">
        <div className="flex justify-between items-center p-4 border-b border-border bg-background/80 backdrop-blur-sm">
          <h2 className="text-lg font-light text-foreground">Product Preview</h2>
          <Button 
            onClick={toggleFullscreen}
            variant="outline"
            className="rounded-2xl font-light"
          >
            Exit Fullscreen
          </Button>
        </div>
        
        <div className="mt-4">
          <ClientProductPage 
            product={transformedProduct} 
            slug="preview" 
            isPreview={true}
          />
        </div>
      </div>
    );
  }

  // Default variant - sticky with scaling
  return (
    <div className="sticky top-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-light text-foreground">
          Product Preview 
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full ml-2 font-light">
            Live Preview
          </span>
        </h3>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleFullscreen}
            className="text-muted-foreground hover:text-foreground focus:outline-none transition-colors p-1"
            title="View fullscreen"
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>
      
      <div className="border border-border rounded-lg overflow-hidden bg-background shadow-sm">
        {/* Use the ClientProductPage component for consistent rendering */}
        <div className="scale-[0.85] origin-top">
          <ClientProductPage 
            product={transformedProduct} 
            slug="preview" 
            isPreview={true}
          />
        </div>
      </div>
    </div>
  )
}
