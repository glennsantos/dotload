import Image from "next/image";
import { Discount, Product } from "./types";
import { calculateFinalPrice } from "./utils";

interface OrderSummaryProps {
  product: Product;
  appliedDiscount: Discount | null;
}

export default function OrderSummary({ product, appliedDiscount }: OrderSummaryProps) {
  const finalPrice = calculateFinalPrice(product, appliedDiscount);
  
  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-lg font-light text-gray-900 mb-6">Order Summary</h2>
      
      {/* Product details */}
      <div className="flex items-start space-x-4 mb-6">
        <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-md overflow-hidden">
          {product.coverImagePath ? (
            <Image
              src={product.coverImagePath}
              alt={product.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-xs">No image</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-light text-gray-900">{product.name}</h3>
        </div>
        <p className="text-base font-light text-gray-900">{product.currency} {product.price.toFixed(2)}</p>
      </div>
      
      {/* Price breakdown */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between mb-2">
          <p className="text-sm text-gray-500">Subtotal</p>
          <p className="text-sm font-light text-gray-500">{product.currency} {product.price.toFixed(2)}</p>
        </div>
        
        {appliedDiscount && (
                      <div className="flex justify-between mb-2 text-primary">
            <p className="text-sm">Discount ({appliedDiscount.type === 'percentage' ? 
              `${appliedDiscount.value || appliedDiscount.amount}%` : 
              `${product.currency} ${appliedDiscount.value || appliedDiscount.amount}`})</p>
            <p className="text-sm font-light">- {product.currency} {(product.price - finalPrice).toFixed(2)}</p>
          </div>
        )}
        
        <div className="flex justify-between mb-2">
          <p className="text-sm text-gray-500">Taxes</p>
          <p className="text-sm font-light text-gray-500">{product.currency} 0.00</p>
        </div>
        
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <p className="text-base font-light text-gray-500">Total</p>
          <p className="text-base font-medium text-gray-500">{product.currency} {finalPrice.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
