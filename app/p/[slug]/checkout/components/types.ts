export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  coverImagePath?: string;
  discountCodes?: string | any[];
  variations?: ProductVariation[];
}

export interface ProductVariation {
  id: string;
  name: string;
  options: string | string[];
}

export interface Discount {
  id?: string;
  code: string;
  type: 'percentage' | 'fixed';
  // Support both old and new field names for backward compatibility
  amount?: string; // Legacy field name
  value?: number;  // New field name
  startDate?: string; // Legacy field name
  endDate?: string;   // Legacy field name
  expiresAt?: string; // New field name
  maxUses?: number;
  usedCount?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface CheckoutFormData {
  email: string;
  mobileNumber: string;
  selectedVariation: string;
  discountCode: string;
  paymentMethod: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  cardName: string;
}
