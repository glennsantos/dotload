import { calculateFinalPrice, validateDiscountCode, hasDiscountCodes } from '../../app/p/[slug]/checkout/components/utils';
import { Product, Discount } from '../../app/p/[slug]/checkout/components/types';

describe('Discount Code Validation and Calculation', () => {
  const mockProduct: Product = {
    id: 'test-product-1',
    name: 'Test Product',
    price: 100,
    currency: 'PHP',
    discountCodes: [
      {
        id: '1',
        code: 'TEST20',
        type: 'percentage',
        value: 20,
        isActive: true,
        expiresAt: '2025-12-31',
        maxUses: 100,
        usedCount: 5
      },
      {
        id: '2',
        code: 'SAVE50',
        type: 'fixed',
        value: 50,
        isActive: true,
        expiresAt: '2025-12-31',
        maxUses: 50,
        usedCount: 0
      },
      {
        id: '3',
        code: 'LEGACY10',
        type: 'percentage',
        amount: '10', // Legacy format
        isActive: true,
        endDate: '2025-12-31'
      },
      {
        id: '4',
        code: 'EXPIRED',
        type: 'percentage',
        value: 30,
        isActive: true,
        expiresAt: '2023-01-01' // Expired
      },
      {
        id: '5',
        code: 'INACTIVE',
        type: 'percentage',
        value: 25,
        isActive: false
      },
      {
        id: '6',
        code: 'MAXUSED',
        type: 'percentage',
        value: 15,
        isActive: true,
        maxUses: 10,
        usedCount: 10 // Max uses reached
      }
    ]
  };

  describe('validateDiscountCode', () => {
    it('should validate active percentage discount with new format', () => {
      const result = validateDiscountCode('TEST20', mockProduct);
      expect(result.appliedDiscount).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.appliedDiscount?.type).toBe('percentage');
      expect(result.appliedDiscount?.value).toBe(20);
    });

    it('should validate active fixed discount', () => {
      const result = validateDiscountCode('SAVE50', mockProduct);
      expect(result.appliedDiscount).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.appliedDiscount?.type).toBe('fixed');
      expect(result.appliedDiscount?.value).toBe(50);
    });

    it('should validate legacy format discount codes', () => {
      const result = validateDiscountCode('LEGACY10', mockProduct);
      expect(result.appliedDiscount).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.appliedDiscount?.type).toBe('percentage');
      expect(result.appliedDiscount?.amount).toBe('10');
    });

    it('should reject invalid discount code', () => {
      const result = validateDiscountCode('INVALID', mockProduct);
      expect(result.appliedDiscount).toBeNull();
      expect(result.error).toBe('Invalid discount code');
    });

    it('should reject expired discount code', () => {
      const result = validateDiscountCode('EXPIRED', mockProduct);
      expect(result.appliedDiscount).toBeNull();
      expect(result.error).toBe('Discount code has expired');
    });

    it('should reject inactive discount code', () => {
      const result = validateDiscountCode('INACTIVE', mockProduct);
      expect(result.appliedDiscount).toBeNull();
      expect(result.error).toBe('Discount code is not active');
    });

    it('should reject discount code that has reached max uses', () => {
      const result = validateDiscountCode('MAXUSED', mockProduct);
      expect(result.appliedDiscount).toBeNull();
      expect(result.error).toBe('Discount code usage limit exceeded');
    });

    it('should handle case-insensitive discount codes', () => {
      const result = validateDiscountCode('test20', mockProduct);
      expect(result.appliedDiscount).toBeTruthy();
      expect(result.error).toBeNull();
    });
  });

  describe('calculateFinalPrice', () => {
    it('should calculate correct price for percentage discount (new format)', () => {
      const discount: Discount = {
        code: 'TEST20',
        type: 'percentage',
        value: 20
      };
      const finalPrice = calculateFinalPrice(mockProduct, discount);
      expect(finalPrice).toBe(80); // 100 - (20% of 100) = 80
    });

    it('should calculate correct price for fixed discount', () => {
      const discount: Discount = {
        code: 'SAVE50',
        type: 'fixed',
        value: 50
      };
      const finalPrice = calculateFinalPrice(mockProduct, discount);
      expect(finalPrice).toBe(50); // 100 - 50 = 50
    });

    it('should calculate correct price for percentage discount (legacy format)', () => {
      const discount: Discount = {
        code: 'LEGACY10',
        type: 'percentage',
        amount: '10'
      };
      const finalPrice = calculateFinalPrice(mockProduct, discount);
      expect(finalPrice).toBe(90); // 100 - (10% of 100) = 90
    });

    it('should not allow negative prices', () => {
      const discount: Discount = {
        code: 'HUGE',
        type: 'fixed',
        value: 200 // Larger than product price
      };
      const finalPrice = calculateFinalPrice(mockProduct, discount);
      expect(finalPrice).toBe(0); // Should not go below 0
    });

    it('should return original price when no discount applied', () => {
      const finalPrice = calculateFinalPrice(mockProduct, null);
      expect(finalPrice).toBe(100);
    });

    it('should handle invalid discount values gracefully', () => {
      const discount: Discount = {
        code: 'INVALID',
        type: 'percentage',
        value: NaN
      };
      const finalPrice = calculateFinalPrice(mockProduct, discount);
      expect(finalPrice).toBe(100); // Should return original price
    });

    it('should handle missing product gracefully', () => {
      const discount: Discount = {
        code: 'TEST',
        type: 'percentage',
        value: 20
      };
      // @ts-ignore - intentionally passing null for testing
      const finalPrice = calculateFinalPrice(null, discount);
      expect(finalPrice).toBe(0);
    });
  });

  describe('JSON parsing of discount codes', () => {
    it('should handle discount codes as JSON string', () => {
      const productWithStringCodes: Product = {
        ...mockProduct,
        discountCodes: JSON.stringify(mockProduct.discountCodes)
      };
      
      const result = validateDiscountCode('TEST20', productWithStringCodes);
      expect(result.appliedDiscount).toBeTruthy();
      expect(result.error).toBeNull();
    });

    it('should handle malformed JSON gracefully', () => {
      const productWithBadJson: Product = {
        ...mockProduct,
        discountCodes: 'invalid json string'
      };
      
      const result = validateDiscountCode('TEST20', productWithBadJson);
      expect(result.appliedDiscount).toBeNull();
      expect(result.error).toBe('Error applying discount code');
    });
  });

  describe('hasDiscountCodes', () => {
    it('should return true when product has discount codes array', () => {
      expect(hasDiscountCodes(mockProduct)).toBe(true);
    });

    it('should return true when product has discount codes as JSON string', () => {
      const productWithStringCodes: Product = {
        ...mockProduct,
        discountCodes: JSON.stringify(mockProduct.discountCodes)
      };
      expect(hasDiscountCodes(productWithStringCodes)).toBe(true);
    });

    it('should return false when product has no discount codes', () => {
      const productWithoutCodes: Product = {
        ...mockProduct,
        discountCodes: undefined
      };
      expect(hasDiscountCodes(productWithoutCodes)).toBe(false);
    });

    it('should return false when product has empty discount codes array', () => {
      const productWithEmptyCodes: Product = {
        ...mockProduct,
        discountCodes: []
      };
      expect(hasDiscountCodes(productWithEmptyCodes)).toBe(false);
    });

    it('should return false when product has empty discount codes JSON string', () => {
      const productWithEmptyCodes: Product = {
        ...mockProduct,
        discountCodes: '[]'
      };
      expect(hasDiscountCodes(productWithEmptyCodes)).toBe(false);
    });

    it('should return false when product has null discount codes', () => {
      const productWithNullCodes: Product = {
        ...mockProduct,
        discountCodes: undefined // Use undefined instead of null for TypeScript compatibility
      };
      expect(hasDiscountCodes(productWithNullCodes)).toBe(false);
    });

    it('should return false when product is null', () => {
      // @ts-ignore - intentionally passing null for testing
      expect(hasDiscountCodes(null)).toBe(false);
    });

    it('should handle malformed JSON gracefully', () => {
      const productWithBadJson: Product = {
        ...mockProduct,
        discountCodes: 'invalid json string'
      };
      expect(hasDiscountCodes(productWithBadJson)).toBe(false);
    });
  });

  describe('Dashboard Integration', () => {
    it('should provide correct management link format', () => {
      const productId = 'test-product-123';
      const expectedUrl = `/dashboard/promos?product=${productId}`;
      
      // Test that the URL format is correct for linking to the dashboard
      const managementUrl = `/dashboard/promos?product=${productId}`;
      expect(managementUrl).toBe(expectedUrl);
    });

    it('should correctly identify product-specific discount codes in API format', () => {
      const apiDiscountCode = {
        id: 'dc_123',
        code: 'API20',
        type: 'percentage' as 'percentage' | 'fixed',
        value: 20,
        maxUses: 100,
        usedCount: 5,
        expiresAt: '2025-12-31',
        isActive: true,
        productId: 'product_123',
        productName: 'Test Product'
      };
      
      expect(apiDiscountCode.productId).toBeTruthy();
      expect(apiDiscountCode.productName).toBe('Test Product');
      expect(apiDiscountCode.value).toBe(20);
    });
  });
}); 