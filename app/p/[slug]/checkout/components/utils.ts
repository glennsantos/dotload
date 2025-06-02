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
  if (!product || typeof product.price !== 'number') return 0;
  
  let price = product.price;
  
  if (appliedDiscount) {
    let discountValue = 0;
    
    // Handle both old and new field formats
    if (appliedDiscount.value !== undefined) {
      // New format uses 'value' field
      discountValue = Number(appliedDiscount.value);
    } else if (appliedDiscount.amount !== undefined) {
      // Legacy format uses 'amount' field
      discountValue = Number(appliedDiscount.amount);
    }
    
    // Validate discount value is a valid number
    if (isNaN(discountValue) || discountValue < 0) {
      console.warn('Invalid discount value:', appliedDiscount);
      return price;
    }
    
    if (appliedDiscount.type === 'percentage') {
      // Apply percentage discount
      const discountAmount = (discountValue / 100) * price;
      price = price - discountAmount;
    } else if (appliedDiscount.type === 'fixed') {
      // Apply fixed amount discount
      price = price - discountValue;
    }
    
    // Ensure price doesn't go below zero
    price = Math.max(price, 0);
  }
  
  return price;
};

/**
 * Checks if a product has any discount codes available
 * @param product The product to check
 * @returns Boolean indicating if the product has discount codes
 */
export const hasDiscountCodes = (product: Product): boolean => {
  if (!product || !product.discountCodes) {
    return false;
  }
  
  try {
    // Parse discount codes from product
    const discountCodes = typeof product.discountCodes === 'string' ? 
      JSON.parse(product.discountCodes) : 
      product.discountCodes;
    
    // Check if there are any valid discount codes
    return Array.isArray(discountCodes) && discountCodes.length > 0;
  } catch (err) {
    console.error('Error parsing discount codes:', err);
    return false;
  }
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
    
    // Check if discount is active
    if (matchedDiscount.isActive === false) {
      return { appliedDiscount: null, error: "Discount code is not active" };
    }
    
    // Check usage limits
    if (matchedDiscount.maxUses && matchedDiscount.usedCount >= matchedDiscount.maxUses) {
      return { appliedDiscount: null, error: "Discount code usage limit exceeded" };
    }
    
    // Check if discount is within valid date range
    const currentDate = new Date();
    
    // Handle legacy startDate/endDate format
    if (matchedDiscount.startDate) {
      const startDate = new Date(matchedDiscount.startDate);
      if (currentDate < startDate) {
        return { appliedDiscount: null, error: "Discount code is not valid yet" };
      }
    }
    
    // Handle both legacy endDate and new expiresAt format
    const expirationDate = matchedDiscount.expiresAt || matchedDiscount.endDate;
    if (expirationDate) {
      const expDate = new Date(expirationDate);
      if (currentDate > expDate) {
        return { appliedDiscount: null, error: "Discount code has expired" };
      }
    }
    
    // Apply the discount
    return { appliedDiscount: matchedDiscount, error: null };
  } catch (err) {
    console.error('Error applying discount code:', err);
    return { appliedDiscount: null, error: "Error applying discount code" };
  }
};
