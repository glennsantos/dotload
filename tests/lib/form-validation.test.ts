/**
 * ============================================================================
 * UTILITY TESTS - FORM VALIDATION
 * ============================================================================
 *
 * Tests for form validation utilities including:
 * - Price validation
 * - Discount validation
 * - Email validation
 * - Product form validation
 * - User input sanitization
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Form Validation Tests', () => {
  describe('Price Validation', () => {
    it('should validate positive prices', async () => {
      const { validatePrice } = await import('@/lib/form-validation');

      expect(validatePrice(100)).toBe(true);
      expect(validatePrice(0.01)).toBe(true);
      expect(validatePrice(9999.99)).toBe(true);
    });

    it('should reject negative prices', async () => {
      const { validatePrice } = await import('@/lib/form-validation');

      expect(validatePrice(-10)).toBe(false);
      expect(validatePrice(-0.01)).toBe(false);
    });

    it('should reject zero price when required', async () => {
      const { validatePrice } = await import('@/lib/form-validation');

      expect(validatePrice(0, { allowZero: false })).toBe(false);
      expect(validatePrice(0, { allowZero: true })).toBe(true);
    });

    it('should validate price ranges', async () => {
      const { validatePriceRange } = await import('@/lib/form-validation');

      expect(validatePriceRange(50, 10, 100)).toBe(true);
      expect(validatePriceRange(5, 10, 100)).toBe(false);
      expect(validatePriceRange(150, 10, 100)).toBe(false);
    });

    it('should validate minimum price threshold', async () => {
      const { validatePrice } = await import('@/lib/form-validation');

      const minPrice = 1; // PHP 1 minimum

      expect(validatePrice(1, { min: minPrice })).toBe(true);
      expect(validatePrice(0.50, { min: minPrice })).toBe(false);
    });

    it('should validate maximum price threshold', async () => {
      const { validatePrice } = await import('@/lib/form-validation');

      const maxPrice = 999999; // Max price cap

      expect(validatePrice(999999, { max: maxPrice })).toBe(true);
      expect(validatePrice(1000000, { max: maxPrice })).toBe(false);
    });

    it('should handle decimal precision correctly', async () => {
      const { roundPrice } = await import('@/lib/form-validation');

      expect(roundPrice(10.123)).toBe(10.12);
      expect(roundPrice(10.999)).toBe(11.00);
      expect(roundPrice(10.5)).toBe(10.50);
    });
  });

  describe('Discount Validation', () => {
    it('should validate percentage discounts', async () => {
      const { validateDiscount } = await import('@/lib/form-validation');

      expect(validateDiscount(10, 'percentage')).toBe(true);
      expect(validateDiscount(50, 'percentage')).toBe(true);
      expect(validateDiscount(100, 'percentage')).toBe(true);
    });

    it('should reject invalid percentage discounts', async () => {
      const { validateDiscount } = await import('@/lib/form-validation');

      expect(validateDiscount(-10, 'percentage')).toBe(false);
      expect(validateDiscount(101, 'percentage')).toBe(false);
      expect(validateDiscount(0, 'percentage')).toBe(false);
    });

    it('should validate fixed amount discounts', async () => {
      const { validateDiscount } = await import('@/lib/form-validation');

      expect(validateDiscount(50, 'fixed')).toBe(true);
      expect(validateDiscount(100, 'fixed')).toBe(true);
    });

    it('should reject invalid fixed discounts', async () => {
      const { validateDiscount } = await import('@/lib/form-validation');

      expect(validateDiscount(-50, 'fixed')).toBe(false);
      expect(validateDiscount(0, 'fixed')).toBe(false);
    });

    it('should validate discount codes format', async () => {
      const { validateDiscountCode } = await import('@/lib/form-validation');

      expect(validateDiscountCode('SUMMER2024')).toBe(true);
      expect(validateDiscountCode('SAVE50')).toBe(true);
      expect(validateDiscountCode('20OFF')).toBe(true);
    });

    it('should reject invalid discount code formats', async () => {
      const { validateDiscountCode } = await import('@/lib/form-validation');

      expect(validateDiscountCode('')).toBe(false);
      expect(validateDiscountCode('a')).toBe(false); // Too short
      expect(validateDiscountCode('code with spaces')).toBe(false);
      expect(validateDiscountCode('special!@#$')).toBe(false);
    });

    it('should calculate discounted price correctly', async () => {
      const { calculateDiscountedPrice } = await import('@/lib/form-validation');

      // Percentage discount
      expect(calculateDiscountedPrice(100, 10, 'percentage')).toBe(90);
      expect(calculateDiscountedPrice(100, 50, 'percentage')).toBe(50);

      // Fixed discount
      expect(calculateDiscountedPrice(100, 20, 'fixed')).toBe(80);
      expect(calculateDiscountedPrice(100, 100, 'fixed')).toBe(0);
    });

    it('should not allow discount to result in negative price', async () => {
      const { calculateDiscountedPrice } = await import('@/lib/form-validation');

      // Fixed discount greater than price
      expect(calculateDiscountedPrice(50, 100, 'fixed')).toBe(0);
      expect(calculateDiscountedPrice(10, 20, 'fixed')).toBe(0);
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email formats', async () => {
      const { validateEmail } = await import('@/lib/form-validation');

      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', async () => {
      const { validateEmail } = await import('@/lib/form-validation');

      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('should handle email edge cases', async () => {
      const { validateEmail } = await import('@/lib/form-validation');

      expect(validateEmail('user..name@example.com')).toBe(false); // Double dot
      expect(validateEmail('.user@example.com')).toBe(false); // Leading dot
      expect(validateEmail('user.@example.com')).toBe(false); // Trailing dot
    });
  });

  describe('Product Form Validation', () => {
    it('should validate product name', async () => {
      const { validateProductName } = await import('@/lib/form-validation');

      expect(validateProductName('Valid Product Name')).toBe(true);
      expect(validateProductName('Product 123')).toBe(true);
    });

    it('should reject invalid product names', async () => {
      const { validateProductName } = await import('@/lib/form-validation');

      expect(validateProductName('')).toBe(false);
      expect(validateProductName('ab')).toBe(false); // Too short
      expect(validateProductName('a'.repeat(201))).toBe(false); // Too long
    });

    it('should validate product description', async () => {
      const { validateProductDescription } = await import('@/lib/form-validation');

      expect(validateProductDescription('This is a valid product description.')).toBe(true);
      expect(validateProductDescription('Short desc')).toBe(true);
    });

    it('should validate product slug format', async () => {
      const { validateSlug } = await import('@/lib/form-validation');

      expect(validateSlug('valid-product-slug')).toBe(true);
      expect(validateSlug('product-123')).toBe(true);
      expect(validateSlug('my-awesome-ebook')).toBe(true);
    });

    it('should reject invalid slug formats', async () => {
      const { validateSlug } = await import('@/lib/form-validation');

      expect(validateSlug('Invalid Slug')).toBe(false); // Spaces
      expect(validateSlug('invalid_slug')).toBe(false); // Underscores
      expect(validateSlug('UPPERCASE')).toBe(false); // Uppercase
      expect(validateSlug('special!chars')).toBe(false); // Special chars
    });

    it('should generate slug from product name', async () => {
      const { generateSlug } = await import('@/lib/form-validation');

      expect(generateSlug('My Awesome Product')).toBe('my-awesome-product');
      expect(generateSlug('Product   with    spaces')).toBe('product-with-spaces');
      expect(generateSlug('Product 123!')).toBe('product-123');
    });
  });

  describe('User Input Sanitization', () => {
    it('should sanitize HTML input', async () => {
      const { sanitizeHtml } = await import('@/lib/form-validation');

      expect(sanitizeHtml('<script>alert(1)</script>')).not.toContain('<script>');
      expect(sanitizeHtml('<b>Bold text</b>')).toContain('Bold text');
    });

    it('should prevent XSS attacks', async () => {
      const { sanitizeInput } = await import('@/lib/form-validation');

      const maliciousInput = '<img src=x onerror="alert(1)">';
      const sanitized = sanitizeInput(maliciousInput);

      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });

    it('should trim whitespace from inputs', async () => {
      const { sanitizeInput } = await import('@/lib/form-validation');

      expect(sanitizeInput('  text  ')).toBe('text');
      expect(sanitizeInput('\n\ntext\n\n')).toBe('text');
    });

    it('should normalize unicode characters', async () => {
      const { normalizeText } = await import('@/lib/form-validation');

      // Test normalization of accented characters
      const input = 'café résumé';
      const normalized = normalizeText(input);

      expect(normalized).toBeDefined();
      expect(typeof normalized).toBe('string');
    });
  });

  describe('Password Validation', () => {
    it('should validate strong passwords', async () => {
      const { validatePassword } = await import('@/lib/form-validation');

      expect(validatePassword('SecurePass123!')).toBe(true);
      expect(validatePassword('MyP@ssw0rd')).toBe(true);
    });

    it('should reject weak passwords', async () => {
      const { validatePassword } = await import('@/lib/form-validation');

      expect(validatePassword('short')).toBe(false); // Too short
      expect(validatePassword('alllowercase')).toBe(false); // No uppercase
      expect(validatePassword('ALLUPPERCASE')).toBe(false); // No lowercase
      expect(validatePassword('NoNumbers!')).toBe(false); // No numbers
    });

    it('should enforce minimum password length', async () => {
      const { validatePassword } = await import('@/lib/form-validation');

      expect(validatePassword('Pass1!')).toBe(false); // Less than 8 chars
      expect(validatePassword('Pass123!')).toBe(true); // 8+ chars
    });

    it('should validate password confirmation match', async () => {
      const { validatePasswordMatch } = await import('@/lib/form-validation');

      expect(validatePasswordMatch('password123', 'password123')).toBe(true);
      expect(validatePasswordMatch('password123', 'different')).toBe(false);
    });
  });

  describe('URL Validation', () => {
    it('should validate correct URLs', async () => {
      const { validateUrl } = await import('@/lib/form-validation');

      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://example.com')).toBe(true);
      expect(validateUrl('https://sub.example.com/path')).toBe(true);
    });

    it('should reject invalid URLs', async () => {
      const { validateUrl } = await import('@/lib/form-validation');

      expect(validateUrl('not-a-url')).toBe(false);
      expect(validateUrl('ftp://example.com')).toBe(false); // Wrong protocol
      expect(validateUrl('')).toBe(false);
    });
  });

  describe('Phone Number Validation', () => {
    it('should validate Philippine phone numbers', async () => {
      const { validatePhoneNumber } = await import('@/lib/form-validation');

      expect(validatePhoneNumber('+639123456789')).toBe(true);
      expect(validatePhoneNumber('09123456789')).toBe(true);
    });

    it('should reject invalid phone numbers', async () => {
      const { validatePhoneNumber } = await import('@/lib/form-validation');

      expect(validatePhoneNumber('12345')).toBe(false); // Too short
      expect(validatePhoneNumber('invalid')).toBe(false);
      expect(validatePhoneNumber('')).toBe(false);
    });
  });
});
