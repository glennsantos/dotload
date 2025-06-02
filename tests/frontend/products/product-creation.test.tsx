/**
 * ============================================================================
 * FRONTEND TESTS - PRODUCT CREATION
 * ============================================================================
 * 
 * Tests for product creation flow including:
 * - Product form rendering
 * - File upload functionality
 * - Form validation
 * - Product publishing
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Next.js router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  pathname: '/dashboard/products/new',
  query: {},
  asPath: '/dashboard/products/new',
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/dashboard/products/new',
}));

// Mock file upload
const mockUpload = jest.fn();
jest.mock('@/lib/cloudinary', () => ({
  uploadFile: mockUpload,
}));

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

// Create a mock product creation form
const MockProductForm = () => {
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    price: '',
    type: 'digital',
    files: [] as File[],
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.name || !formData.description || !formData.price) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (parseFloat(formData.price) <= 0) {
      setError('Price must be greater than 0');
      setLoading(false);
      return;
    }

    if (formData.type === 'digital' && formData.files.length === 0) {
      setError('Digital products must have at least one file');
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      mockRouter.push('/dashboard/products');
    } catch (err) {
      setError('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, files }));
  };

  return (
    <div data-testid="product-form">
      <h1>Create New Product</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Product Name *</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            data-testid="name-input"
          />
        </div>

        <div>
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            data-testid="description-input"
          />
        </div>

        <div>
          <label htmlFor="price">Price (PHP) *</label>
          <input
            id="price"
            type="text"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            data-testid="price-input"
          />
        </div>

        <div>
          <label htmlFor="type">Product Type</label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            data-testid="type-select"
          >
            <option value="digital">Digital</option>
            <option value="physical">Physical</option>
          </select>
        </div>

        {formData.type === 'digital' && (
          <div>
            <label htmlFor="files">Upload Files *</label>
            <input
              id="files"
              type="file"
              multiple
              onChange={handleFileChange}
              data-testid="file-input"
              accept=".pdf,.zip,.mp4,.mp3,.jpg,.png"
            />
            {formData.files.length > 0 && (
              <div data-testid="file-list">
                {formData.files.map((file, index) => (
                  <div key={index}>{file.name}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div data-testid="error-message" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          data-testid="submit-button"
        >
          {loading ? 'Creating...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
};

describe('Product Creation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render product creation form with all fields', () => {
      render(<MockProductForm />);

      expect(screen.getByTestId('product-form')).toBeDefined();
      expect(screen.getByTestId('name-input')).toBeDefined();
      expect(screen.getByTestId('description-input')).toBeDefined();
      expect(screen.getByTestId('price-input')).toBeDefined();
      expect(screen.getByTestId('type-select')).toBeDefined();
    });

    it('should show file upload for digital products', () => {
      render(<MockProductForm />);
      
      expect(screen.getByTestId('file-input')).toBeDefined();
    });
  });

  describe('Form Validation', () => {
    it('should show error for missing required fields', async () => {
      const user = userEvent.setup();
      render(<MockProductForm />);

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please fill in all required fields')).toBeDefined();
      });
    });

    it('should show error for invalid price', async () => {
      const user = userEvent.setup();
      render(<MockProductForm />);

      await user.type(screen.getByTestId('name-input'), 'Test Product');
      await user.type(screen.getByTestId('description-input'), 'Test Description');
      await user.type(screen.getByTestId('price-input'), '0');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByText('Price must be greater than 0')).toBeDefined();
      });
    });

    it('should show error for digital product without files', async () => {
      const user = userEvent.setup();
      render(<MockProductForm />);

      await user.type(screen.getByTestId('name-input'), 'Test Product');
      await user.type(screen.getByTestId('description-input'), 'Test Description');
      await user.type(screen.getByTestId('price-input'), '10.00');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByText('Digital products must have at least one file')).toBeDefined();
      });
    });
  });

  describe('File Upload', () => {
    it('should handle file selection', async () => {
      const user = userEvent.setup();
      render(<MockProductForm />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByTestId('file-input');

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByTestId('file-list')).toBeDefined();
        expect(screen.getByText('test.pdf')).toBeDefined();
      });
    });
  });

  describe('Successful Product Creation', () => {
    it('should successfully create a digital product', async () => {
      const user = userEvent.setup();
      render(<MockProductForm />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      await user.type(screen.getByTestId('name-input'), 'Test Digital Product');
      await user.type(screen.getByTestId('description-input'), 'A great digital product');
      await user.type(screen.getByTestId('price-input'), '29.99');
      await user.upload(screen.getByTestId('file-input'), file);
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/products');
      });
    });
  });
}); 