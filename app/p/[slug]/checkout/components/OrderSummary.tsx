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
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-medium text-foreground mb-6">Order Summary</h2>
      
      {/* Product details */}
      <div className="flex items-start space-x-4 mb-6">
        <div className="flex-shrink-0 w-20 h-20 bg-muted rounded-lg overflow-hidden border border-border">
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
              <span className="text-muted-foreground text-xs">No image</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground line-clamp-2">{product.name}</h3>
        </div>
        <p className="text-sm font-medium text-foreground">{product.currency} {product.price.toFixed(2)}</p>
      </div>
      
      {/* Price breakdown */}
      <div className="border-t border-border pt-4 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Subtotal</p>
          <p className="text-sm text-muted-foreground">{product.currency} {product.price.toFixed(2)}</p>
        </div>
        
        {appliedDiscount && (
          <div className="flex justify-between items-center text-primary">
            <p className="text-sm">Discount ({appliedDiscount.type === 'percentage' ? 
              `${appliedDiscount.value || appliedDiscount.amount}%` : 
              `${product.currency} ${appliedDiscount.value || appliedDiscount.amount}`})</p>
            <p className="text-sm font-medium">- {product.currency} {(product.price - finalPrice).toFixed(2)}</p>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Taxes</p>
          <p className="text-sm text-muted-foreground">{product.currency} 0.00</p>
        </div>
        
        <div className="flex justify-between items-center pt-3 border-t border-border">
          <p className="text-base font-medium text-foreground">Total</p>
          <p className="text-base font-semibold text-foreground">{product.currency} {finalPrice.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
