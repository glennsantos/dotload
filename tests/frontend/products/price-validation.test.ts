/**
 * ============================================================================
 * FRONTEND TESTS - PRICE VALIDATION
 * ============================================================================
 * 
 * Tests for price validation functionality including:
 * - Integer-only validation
 * - Range validation (1-500000)
 * - Error messages
 */

import { describe, it, expect } from '@jest/globals';
import { validatePrice, validateDiscountAmount } from '@/lib/form-validation';

describe('Price Validation Tests', () => {
  describe('validatePrice function', () => {
    it('should accept valid integer prices in range', () => {
      const testCases = [1, 100, 1000, 50000, 250000, 500000];
      
      testCases.forEach(price => {
        const result = validatePrice(price);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });
    });

    it('should reject decimal values', () => {
      const testCases = [1.5, 100.99, 0.5, 999.01];
      
      testCases.forEach(price => {
        const result = validatePrice(price);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Price must be a whole number (no decimals)');
      });
    });

    it('should reject prices below minimum (1)', () => {
      const testCases = [0, -1, -100];
      
      testCases.forEach(price => {
        const result = validatePrice(price);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Price must be at least ₱1');
      });
    });

    it('should reject prices above maximum (500000)', () => {
      const testCases = [500001, 600000, 1000000];
      
      testCases.forEach(price => {
        const result = validatePrice(price);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Price cannot exceed ₱500,000');
      });
    });

    it('should reject empty or invalid values', () => {
      const testCases = [null, undefined, '', 'abc', NaN];
      
      testCases.forEach(price => {
        const result = validatePrice(price);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeTruthy();
      });
    });

    it('should handle string numbers correctly', () => {
      const result1 = validatePrice('100');
      expect(result1.isValid).toBe(true);
      
      const result2 = validatePrice('100.5');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Price must be a whole number (no decimals)');
    });

    it('should handle edge cases', () => {
      // Minimum valid value
      const result1 = validatePrice(1);
      expect(result1.isValid).toBe(true);
      
      // Maximum valid value
      const result2 = validatePrice(500000);
      expect(result2.isValid).toBe(true);
      
      // Just below minimum
      const result3 = validatePrice(0);
      expect(result3.isValid).toBe(false);
      expect(result3.error).toBe('Price must be at least ₱1');
      
      // Just above maximum
      const result4 = validatePrice(500001);
      expect(result4.isValid).toBe(false);
      expect(result4.error).toBe('Price cannot exceed ₱500,000');
    });
  });

  describe('validateDiscountAmount function', () => {
    describe('percentage discounts', () => {
      it('should accept valid percentage values (1-100)', () => {
        const testCases = [1, 10, 25, 50, 75, 100];
        
        testCases.forEach(amount => {
          const result = validateDiscountAmount(amount, 'percentage');
          expect(result.isValid).toBe(true);
          expect(result.error).toBeNull();
        });
      });

      it('should reject percentage values below 1', () => {
        const testCases = [0, -1, -10];
        
        testCases.forEach(amount => {
          const result = validateDiscountAmount(amount, 'percentage');
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('Percentage discount must be at least 1%');
        });
      });

      it('should reject percentage values above 100', () => {
        const testCases = [101, 150, 200];
        
        testCases.forEach(amount => {
          const result = validateDiscountAmount(amount, 'percentage');
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('Percentage discount cannot exceed 100%');
        });
      });

      it('should reject decimal values for percentage discounts', () => {
        const testCases = [1.5, 50.5, 99.9];
        
        testCases.forEach(amount => {
          const result = validateDiscountAmount(amount, 'percentage');
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('Discount amount must be a whole number (no decimals)');
        });
      });
    });

    describe('fixed discounts', () => {
      it('should accept valid fixed amounts (1-500000)', () => {
        const testCases = [1, 100, 1000, 50000, 250000, 500000];
        
        testCases.forEach(amount => {
          const result = validateDiscountAmount(amount, 'fixed');
          expect(result.isValid).toBe(true);
          expect(result.error).toBeNull();
        });
      });

      it('should reject fixed amounts below 1', () => {
        const testCases = [0, -1, -100];
        
        testCases.forEach(amount => {
          const result = validateDiscountAmount(amount, 'fixed');
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('Fixed discount must be at least ₱1');
        });
      });

      it('should reject fixed amounts above 500000', () => {
        const testCases = [500001, 600000, 1000000];
        
        testCases.forEach(amount => {
          const result = validateDiscountAmount(amount, 'fixed');
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('Fixed discount cannot exceed ₱500,000');
        });
      });

      it('should reject decimal values for fixed discounts', () => {
        const testCases = [1.5, 100.99, 999.01];
        
        testCases.forEach(amount => {
          const result = validateDiscountAmount(amount, 'fixed');
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('Discount amount must be a whole number (no decimals)');
        });
      });
    });

    describe('common validation', () => {
      it('should reject empty or invalid values', () => {
        const testCases = [null, undefined, '', 'abc', NaN];
        
        testCases.forEach(amount => {
          const result1 = validateDiscountAmount(amount, 'percentage');
          expect(result1.isValid).toBe(false);
          expect(result1.error).toBeTruthy();
          
          const result2 = validateDiscountAmount(amount, 'fixed');
          expect(result2.isValid).toBe(false);
          expect(result2.error).toBeTruthy();
        });
      });

      it('should handle string numbers correctly', () => {
        const result1 = validateDiscountAmount('50', 'percentage');
        expect(result1.isValid).toBe(true);
        
        const result2 = validateDiscountAmount('1000', 'fixed');
        expect(result2.isValid).toBe(true);
        
        const result3 = validateDiscountAmount('50.5', 'percentage');
        expect(result3.isValid).toBe(false);
        expect(result3.error).toBe('Discount amount must be a whole number (no decimals)');
      });
    });
  });
}); 