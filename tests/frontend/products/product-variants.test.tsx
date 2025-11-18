/**
 * ============================================================================
 * FRONTEND TESTS - PRODUCT VARIANTS
 * ============================================================================
 *
 * Tests for product variants functionality including:
 * - Adding variants
 * - Editing variants
 * - Deleting variants
 * - Variant pricing
 * - Variant selection in checkout
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/products/edit/123',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Product Variants Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  describe('Adding Variants', () => {
    it('should add new variant successfully', async () => {
      const ProductVariantsForm = (await import('@/components/products/ProductVariantsForm')).default;

      const mockProduct = {
        id: 'product123',
        name: 'Test Product',
        variants: [],
      };

      render(<ProductVariantsForm product={mockProduct} />);

      // Click "Add Variant" button
      const addButton = screen.getByText(/add variant/i);
      fireEvent.click(addButton);

      // Fill variant form
      const nameInput = screen.getByLabelText(/variant name/i);
      const priceInput = screen.getByLabelText(/variant price/i);

      fireEvent.change(nameInput, { target: { value: 'Premium Edition' } });
      fireEvent.change(priceInput, { target: { value: '499' } });

      // Save variant
      const saveButton = screen.getByText(/save variant/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Premium Edition')).toBeInTheDocument();
        expect(screen.getByText('₱499')).toBeInTheDocument();
      });
    });

    it('should validate variant name is required', async () => {
      const ProductVariantsForm = (await import('@/components/products/ProductVariantsForm')).default;

      render(<ProductVariantsForm product={{ id: 'product123', variants: [] }} />);

      const addButton = screen.getByText(/add variant/i);
      fireEvent.click(addButton);

      const saveButton = screen.getByText(/save variant/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/variant name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate variant price is positive', async () => {
      const ProductVariantsForm = (await import('@/components/products/ProductVariantsForm')).default;

      render(<ProductVariantsForm product={{ id: 'product123', variants: [] }} />);

      const addButton = screen.getByText(/add variant/i);
      fireEvent.click(addButton);

      const priceInput = screen.getByLabelText(/variant price/i);
      fireEvent.change(priceInput, { target: { value: '-10' } });

      const saveButton = screen.getByText(/save variant/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/price must be positive/i)).toBeInTheDocument();
      });
    });
  });

  describe('Editing Variants', () => {
    it('should edit existing variant', async () => {
      const ProductVariantsForm = (await import('@/components/products/ProductVariantsForm')).default;

      const mockProduct = {
        id: 'product123',
        variants: [
          {
            id: 'variant1',
            name: 'Basic Edition',
            price: 299,
          },
        ],
      };

      render(<ProductVariantsForm product={mockProduct} />);

      // Click edit button
      const editButton = screen.getByLabelText(/edit variant/i);
      fireEvent.click(editButton);

      // Update variant name
      const nameInput = screen.getByLabelText(/variant name/i);
      fireEvent.change(nameInput, { target: { value: 'Standard Edition' } });

      // Save changes
      const saveButton = screen.getByText(/save changes/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Standard Edition')).toBeInTheDocument();
      });
    });
  });

  describe('Deleting Variants', () => {
    it('should delete variant with confirmation', async () => {
      const ProductVariantsForm = (await import('@/components/products/ProductVariantsForm')).default;

      const mockProduct = {
        id: 'product123',
        variants: [
          {
            id: 'variant1',
            name: 'Basic Edition',
            price: 299,
          },
        ],
      };

      render(<ProductVariantsForm product={mockProduct} />);

      // Click delete button
      const deleteButton = screen.getByLabelText(/delete variant/i);
      fireEvent.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByText(/confirm delete/i);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText('Basic Edition')).not.toBeInTheDocument();
      });
    });

    it('should cancel variant deletion', async () => {
      const ProductVariantsForm = (await import('@/components/products/ProductVariantsForm')).default;

      const mockProduct = {
        id: 'product123',
        variants: [
          {
            id: 'variant1',
            name: 'Basic Edition',
            price: 299,
          },
        ],
      };

      render(<ProductVariantsForm product={mockProduct} />);

      const deleteButton = screen.getByLabelText(/delete variant/i);
      fireEvent.click(deleteButton);

      const cancelButton = screen.getByText(/cancel/i);
      fireEvent.click(cancelButton);

      expect(screen.getByText('Basic Edition')).toBeInTheDocument();
    });
  });

  describe('Variant Display', () => {
    it('should display all product variants', async () => {
      const ProductVariantsList = (await import('@/components/products/ProductVariantsList')).default;

      const mockVariants = [
        { id: 'v1', name: 'Basic', price: 199 },
        { id: 'v2', name: 'Standard', price: 299 },
        { id: 'v3', name: 'Premium', price: 499 },
      ];

      render(<ProductVariantsList variants={mockVariants} />);

      expect(screen.getByText('Basic')).toBeInTheDocument();
      expect(screen.getByText('Standard')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('should format variant prices correctly', async () => {
      const ProductVariantsList = (await import('@/components/products/ProductVariantsList')).default;

      const mockVariants = [
        { id: 'v1', name: 'Basic', price: 199.50 },
      ];

      render(<ProductVariantsList variants={mockVariants} />);

      expect(screen.getByText(/₱199.50/i)).toBeInTheDocument();
    });
  });

  describe('Variant Selection in Checkout', () => {
    it('should allow selecting variant during checkout', async () => {
      const VariantSelector = (await import('@/components/checkout/VariantSelector')).default;

      const mockVariants = [
        { id: 'v1', name: 'Basic', price: 199 },
        { id: 'v2', name: 'Premium', price: 499 },
      ];

      const onSelectVariant = jest.fn();

      render(<VariantSelector variants={mockVariants} onSelect={onSelectVariant} />);

      const premiumOption = screen.getByLabelText(/Premium/i);
      fireEvent.click(premiumOption);

      expect(onSelectVariant).toHaveBeenCalledWith({
        id: 'v2',
        name: 'Premium',
        price: 499,
      });
    });

    it('should update price when variant is selected', async () => {
      const CheckoutPage = (await import('@/components/checkout/CheckoutPage')).default;

      const mockProduct = {
        id: 'product123',
        name: 'Test Product',
        price: 299,
        variants: [
          { id: 'v1', name: 'Basic', price: 199 },
          { id: 'v2', name: 'Premium', price: 499 },
        ],
      };

      render(<CheckoutPage product={mockProduct} />);

      // Default price
      expect(screen.getByText(/₱299/i)).toBeInTheDocument();

      // Select premium variant
      const premiumOption = screen.getByLabelText(/Premium/i);
      fireEvent.click(premiumOption);

      await waitFor(() => {
        expect(screen.getByText(/₱499/i)).toBeInTheDocument();
      });
    });
  });

  describe('Variant Validation', () => {
    it('should prevent duplicate variant names', async () => {
      const ProductVariantsForm = (await import('@/components/products/ProductVariantsForm')).default;

      const mockProduct = {
        id: 'product123',
        variants: [
          { id: 'v1', name: 'Basic', price: 199 },
        ],
      };

      render(<ProductVariantsForm product={mockProduct} />);

      const addButton = screen.getByText(/add variant/i);
      fireEvent.click(addButton);

      const nameInput = screen.getByLabelText(/variant name/i);
      fireEvent.change(nameInput, { target: { value: 'Basic' } });

      const saveButton = screen.getByText(/save variant/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/variant name already exists/i)).toBeInTheDocument();
      });
    });

    it('should limit maximum number of variants', async () => {
      const ProductVariantsForm = (await import('@/components/products/ProductVariantsForm')).default;

      const mockProduct = {
        id: 'product123',
        variants: Array.from({ length: 10 }, (_, i) => ({
          id: `v${i}`,
          name: `Variant ${i}`,
          price: 100 + i * 50,
        })),
      };

      render(<ProductVariantsForm product={mockProduct} />);

      const addButton = screen.queryByText(/add variant/i);
      expect(addButton).toBeDisabled();

      expect(screen.getByText(/maximum.*variants/i)).toBeInTheDocument();
    });
  });
});
