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
  code: string;
  type: 'percentage' | 'fixed';
  amount: string;
  startDate?: string;
  endDate?: string;
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
