import { Discount, Product } from './types';

/**
 * Validates a mobile number format
 * @param number Mobile number to validate
 * @returns Boolean indicating if the number is valid
 */
export const validateMobileNumber = (number: string): boolean => {
  // Basic mobile number validation - should be numeric and at least 10 digits
  // This can be adjusted based on specific country requirements
  const mobileRegex = /^[0-9]{10,15}$/;
  return mobileRegex.test(number.replace(/[\s-()]/g, ''));
};

/**
 * Calculates the final price after applying a discount
 * @param product The product
 * @param appliedDiscount The discount to apply
 * @returns The final price after discount
 */
export const calculateFinalPrice = (product: Product, appliedDiscount: Discount | null): number => {
  if (!product) return 0;
  
  let price = product.price;
  
  if (appliedDiscount) {
    if (appliedDiscount.type === 'percentage') {
      // Apply percentage discount
      const discountAmount = (parseFloat(appliedDiscount.amount) / 100) * price;
      price = price - discountAmount;
    } else if (appliedDiscount.type === 'fixed') {
      // Apply fixed amount discount
      price = price - parseFloat(appliedDiscount.amount);
    }
    
    // Ensure price doesn't go below zero
    price = Math.max(price, 0);
  }
  
  return price;
};

/**
 * Validates and applies a discount code
 * @param discountCode The discount code to validate
 * @param product The product to apply the discount to
 * @returns Object containing the applied discount and any error message
 */
export const validateDiscountCode = (discountCode: string, product: Product): { 
  appliedDiscount: Discount | null; 
  error: string | null;
} => {
  if (!discountCode || !product) {
    return { appliedDiscount: null, error: null };
  }
  
  try {
    // Parse discount codes from product
    const discountCodes = product.discountCodes ? 
      (typeof product.discountCodes === 'string' ? 
        JSON.parse(product.discountCodes) : 
        product.discountCodes) : 
      [];
    
    // Find matching discount code
    const matchedDiscount = discountCodes.find(
      (code: any) => code.code.toLowerCase() === discountCode.toLowerCase()
    );
    
    if (!matchedDiscount) {
      return { appliedDiscount: null, error: "Invalid discount code" };
    }
    
    // Check if discount is within valid date range
    const currentDate = new Date();
    const startDate = matchedDiscount.startDate ? new Date(matchedDiscount.startDate) : null;
    const endDate = matchedDiscount.endDate ? new Date(matchedDiscount.endDate) : null;
    
    if ((startDate && currentDate < startDate) || (endDate && currentDate > endDate)) {
      return { appliedDiscount: null, error: "Discount code is not valid at this time" };
    }
    
    // Apply the discount
    return { appliedDiscount: matchedDiscount, error: null };
  } catch (err) {
    console.error('Error applying discount code:', err);
    return { appliedDiscount: null, error: "Error applying discount code" };
  }
};
