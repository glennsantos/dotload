/**
 * ============================================================================
 * FRONTEND TESTS - PRODUCT EDITING
 * ============================================================================
 * 
 * Tests for product editing functionality including:
 * - Product information updates
 * - Price and currency changes
 * - Image uploads and management
 * - Product type switching
 * - Validation and error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock toast notifications
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

jest.mock('react-hot-toast', () => ({
  toast: mockToast,
}));

// Mock product edit component
const MockProductEditForm = ({ productId = 'product123' }: { productId?: string }) => {
  const [productData, setProductData] = React.useState({
    id: productId,
    name: 'Test Product',
    description: 'This is a test product description',
    price: '29.99',
    currency: 'PHP',
    type: 'digital_product',
    published: false,
    images: ['https://example.com/image1.jpg'],
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [imageFiles, setImageFiles] = React.useState<File[]>([]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!productData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!productData.description.trim()) {
      newErrors.description = 'Product description is required';
    }

    const priceValue = parseFloat(productData.price);
    if (!productData.price || isNaN(priceValue) || priceValue <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!productData.type) {
      newErrors.type = 'Product type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setProductData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeImageFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', productData.name);
      formData.append('description', productData.description);
      formData.append('price', productData.price);
      formData.append('currency', productData.currency);
      formData.append('type', productData.type);
      formData.append('published', productData.published.toString());

      // Add existing images
      productData.images.forEach((image, index) => {
        formData.append(`existingImages[${index}]`, image);
      });

      // Add new image files
      imageFiles.forEach((file, index) => {
        formData.append(`newImages[${index}]`, file);
      });

      const response = await fetch(`/api/products/${productData.id}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        mockToast.success('Product updated successfully!');
        mockRouter.push('/dashboard/products');
      } else {
        mockToast.error(data.error || 'Failed to update product');
      }
    } catch (error) {
      mockToast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/products/${productData.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        mockToast.success('Product deleted successfully!');
        mockRouter.push('/dashboard/products');
      } else {
        const data = await response.json();
        mockToast.error(data.error || 'Failed to delete product');
      }
    } catch (error) {
      mockToast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="product-edit-form">
      <h1>Edit Product</h1>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Product Name *</label>
          <input
            id="name"
            type="text"
            value={productData.name}
            onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
            data-testid="name-input"
          />
          {errors.name && <span data-testid="name-error" className="error">{errors.name}</span>}
        </div>

        <div>
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={productData.description}
            onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
            data-testid="description-input"
            rows={4}
          />
          {errors.description && <span data-testid="description-error" className="error">{errors.description}</span>}
        </div>

        <div>
          <label htmlFor="price">Price *</label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={productData.price}
            onChange={(e) => setProductData(prev => ({ ...prev, price: e.target.value }))}
            data-testid="price-input"
          />
          {errors.price && <span data-testid="price-error" className="error">{errors.price}</span>}
        </div>

        <div>
          <label htmlFor="currency">Currency</label>
          <select
            id="currency"
            value={productData.currency}
            onChange={(e) => setProductData(prev => ({ ...prev, currency: e.target.value }))}
            data-testid="currency-select"
          >
            <option value="PHP">PHP</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>

        <div>
          <label htmlFor="type">Product Type *</label>
          <select
            id="type"
            value={productData.type}
            onChange={(e) => setProductData(prev => ({ ...prev, type: e.target.value }))}
            data-testid="type-select"
          >
            <option value="">Select type</option>
            <option value="digital_product">Digital Product</option>
            <option value="physical_product">Physical Product</option>
            <option value="service">Service</option>
          </select>
          {errors.type && <span data-testid="type-error" className="error">{errors.type}</span>}
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={productData.published}
              onChange={(e) => setProductData(prev => ({ ...prev, published: e.target.checked }))}
              data-testid="published-checkbox"
            />
            Publish this product
          </label>
        </div>

        <div>
          <label htmlFor="images">Product Images</label>
          <input
            id="images"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            data-testid="image-upload"
          />
          
          {/* Existing images */}
          <div data-testid="existing-images">
            {productData.images.map((image, index) => (
              <div key={index} data-testid={`existing-image-${index}`}>
                <img src={image} alt={`Product ${index + 1}`} width="100" height="100" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  data-testid={`remove-existing-image-${index}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* New image files */}
          <div data-testid="new-images">
            {imageFiles.map((file, index) => (
              <div key={index} data-testid={`new-image-${index}`}>
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeImageFile(index)}
                  data-testid={`remove-new-image-${index}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div data-testid="form-actions">
          <button
            type="submit"
            disabled={isLoading}
            data-testid="save-button"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            type="button"
            onClick={() => mockRouter.push('/dashboard/products')}
            data-testid="cancel-button"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            data-testid="delete-button"
            className="danger"
          >
            {isLoading ? 'Deleting...' : 'Delete Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

describe('Product Editing Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore - Mock fetch for testing
    global.fetch = jest.fn();
    // @ts-ignore - Mock confirm dialog
    global.confirm = jest.fn();
  });

  describe('Form Rendering', () => {
    it('should render product edit form with existing data', () => {
      render(<MockProductEditForm />);

      expect(screen.getByTestId('product-edit-form')).toBeDefined();
      
      const nameInput = screen.getByTestId('name-input') as HTMLInputElement;
      const descriptionInput = screen.getByTestId('description-input') as HTMLTextAreaElement;
      const priceInput = screen.getByTestId('price-input') as HTMLInputElement;
      const currencySelect = screen.getByTestId('currency-select') as HTMLSelectElement;
      const typeSelect = screen.getByTestId('type-select') as HTMLSelectElement;
      const publishedCheckbox = screen.getByTestId('published-checkbox') as HTMLInputElement;

      expect(nameInput.value).toBe('Test Product');
      expect(descriptionInput.value).toBe('This is a test product description');
      expect(priceInput.value).toBe('29.99');
      expect(currencySelect.value).toBe('PHP');
      expect(typeSelect.value).toBe('digital_product');
      expect(publishedCheckbox.checked).toBe(false);
    });

    it('should render form actions', () => {
      render(<MockProductEditForm />);

      expect(screen.getByTestId('form-actions')).toBeDefined();
      expect(screen.getByTestId('save-button')).toBeDefined();
      expect(screen.getByTestId('cancel-button')).toBeDefined();
      expect(screen.getByTestId('delete-button')).toBeDefined();
    });

    it('should render existing images', () => {
      render(<MockProductEditForm />);

      expect(screen.getByTestId('existing-images')).toBeDefined();
      expect(screen.getByTestId('existing-image-0')).toBeDefined();
      expect(screen.getByTestId('remove-existing-image-0')).toBeDefined();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      render(<MockProductEditForm />);

      // Clear required fields
      fireEvent.change(screen.getByTestId('name-input'), { target: { value: '' } });
      fireEvent.change(screen.getByTestId('description-input'), { target: { value: '' } });
      fireEvent.change(screen.getByTestId('price-input'), { target: { value: '0' } });
      fireEvent.change(screen.getByTestId('type-select'), { target: { value: '' } });

      fireEvent.click(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toBeDefined();
        expect(screen.getByTestId('description-error')).toBeDefined();
        expect(screen.getByTestId('price-error')).toBeDefined();
        expect(screen.getByTestId('type-error')).toBeDefined();
      });
    });
  });

  describe('Product Updates', () => {
    it('should successfully update product', async () => {
      // @ts-ignore - Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Product updated successfully' }),
      });

      render(<MockProductEditForm />);

      // Update product data
      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Updated Product Name' } });
      fireEvent.change(screen.getByTestId('description-input'), { target: { value: 'Updated description' } });
      fireEvent.change(screen.getByTestId('price-input'), { target: { value: '39.99' } });
      fireEvent.change(screen.getByTestId('currency-select'), { target: { value: 'USD' } });
      fireEvent.change(screen.getByTestId('type-select'), { target: { value: 'physical_product' } });
      fireEvent.click(screen.getByTestId('published-checkbox'));

      fireEvent.click(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/products/product123', {
          method: 'PUT',
          body: expect.any(FormData),
        });
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Product updated successfully!');
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/products');
      });
    });

    it('should handle update errors', async () => {
      // @ts-ignore - Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Product name already exists' }),
      });

      render(<MockProductEditForm />);

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Duplicate Name' } });
      fireEvent.click(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Product name already exists');
      });
    });

    it('should handle network errors', async () => {
      // @ts-ignore - Mock fetch rejection
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<MockProductEditForm />);

      fireEvent.click(screen.getByTestId('save-button'));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Network error. Please try again.');
      });
    });
  });

  describe('Image Management', () => {
    it('should handle image file uploads', () => {
      render(<MockProductEditForm />);

      const imageUpload = screen.getByTestId('image-upload');
      const file1 = new File(['image1'], 'image1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['image2'], 'image2.png', { type: 'image/png' });

      fireEvent.change(imageUpload, {
        target: { files: [file1, file2] },
      });

      expect(screen.getByTestId('new-images')).toBeDefined();
      expect(screen.getByTestId('new-image-0')).toBeDefined();
      expect(screen.getByTestId('new-image-1')).toBeDefined();
    });

    it('should remove existing images', () => {
      render(<MockProductEditForm />);

      expect(screen.getByTestId('existing-image-0')).toBeDefined();

      fireEvent.click(screen.getByTestId('remove-existing-image-0'));

      expect(screen.queryByTestId('existing-image-0')).toBeNull();
    });

    it('should remove new image files', () => {
      render(<MockProductEditForm />);

      const imageUpload = screen.getByTestId('image-upload');
      const file = new File(['image'], 'image.jpg', { type: 'image/jpeg' });

      fireEvent.change(imageUpload, {
        target: { files: [file] },
      });

      expect(screen.getByTestId('new-image-0')).toBeDefined();

      fireEvent.click(screen.getByTestId('remove-new-image-0'));

      expect(screen.queryByTestId('new-image-0')).toBeNull();
    });
  });

  describe('Product Deletion', () => {
    it('should delete product with confirmation', async () => {
      // @ts-ignore - Mock confirm dialog
      (global.confirm as jest.Mock).mockReturnValue(true);
      
      // @ts-ignore - Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Product deleted successfully' }),
      });

      render(<MockProductEditForm />);

      fireEvent.click(screen.getByTestId('delete-button'));

      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this product? This action cannot be undone.'
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/products/product123', {
          method: 'DELETE',
        });
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Product deleted successfully!');
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/products');
      });
    });

    it('should cancel deletion if not confirmed', () => {
      // @ts-ignore - Mock confirm dialog
      (global.confirm as jest.Mock).mockReturnValue(false);

      render(<MockProductEditForm />);

      fireEvent.click(screen.getByTestId('delete-button'));

      expect(global.confirm).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle deletion errors', async () => {
      // @ts-ignore - Mock confirm dialog
      (global.confirm as jest.Mock).mockReturnValue(true);
      
      // @ts-ignore - Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Cannot delete product with active orders' }),
      });

      render(<MockProductEditForm />);

      fireEvent.click(screen.getByTestId('delete-button'));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Cannot delete product with active orders');
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to products list on cancel', () => {
      render(<MockProductEditForm />);

      fireEvent.click(screen.getByTestId('cancel-button'));

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/products');
    });
  });

  describe('Loading States', () => {
    it('should show loading state during save', async () => {
      // @ts-ignore - Mock fetch with delay
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Product updated successfully' }),
        }), 100))
      );

      render(<MockProductEditForm />);

      const saveButton = screen.getByTestId('save-button');
      fireEvent.click(saveButton);

      expect(saveButton.textContent).toBe('Saving...');
      expect(saveButton.hasAttribute('disabled')).toBe(true);

      await waitFor(() => {
        expect(saveButton.textContent).toBe('Save Changes');
        expect(saveButton.hasAttribute('disabled')).toBe(false);
      });
    });

    it('should show loading state during delete', async () => {
      // @ts-ignore - Mock confirm dialog
      (global.confirm as jest.Mock).mockReturnValue(true);
      
      // @ts-ignore - Mock fetch with delay
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Product deleted successfully' }),
        }), 100))
      );

      render(<MockProductEditForm />);

      const deleteButton = screen.getByTestId('delete-button');
      fireEvent.click(deleteButton);

      expect(deleteButton.textContent).toBe('Deleting...');
      expect(deleteButton.hasAttribute('disabled')).toBe(true);

      await waitFor(() => {
        expect(deleteButton.textContent).toBe('Delete Product');
        expect(deleteButton.hasAttribute('disabled')).toBe(false);
      });
    });
  });

  describe('Product Type Changes', () => {
    it('should handle product type switching', () => {
      render(<MockProductEditForm />);

      const typeSelect = screen.getByTestId('type-select') as HTMLSelectElement;
      
      // Switch to physical product
      fireEvent.change(typeSelect, { target: { value: 'physical_product' } });
      expect(typeSelect.value).toBe('physical_product');

      // Switch to service
      fireEvent.change(typeSelect, { target: { value: 'service' } });
      expect(typeSelect.value).toBe('service');

      // Switch back to digital product
      fireEvent.change(typeSelect, { target: { value: 'digital_product' } });
      expect(typeSelect.value).toBe('digital_product');
    });
  });
}); 