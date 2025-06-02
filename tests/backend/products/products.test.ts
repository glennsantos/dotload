/**
 * ============================================================================
 * BACKEND TESTS - PRODUCT MANAGEMENT API
 * ============================================================================
 * 
 * Tests for product management API endpoints including:
 * - Product creation (digital and physical)
 * - Product updates and deletion
 * - File upload handling
 * - Validation and error scenarios
 */

// Mock cloudinary before any imports
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
    api: {
      delete_resources: jest.fn(),
    }
  }
}));

// Mock auth utilities
jest.mock('@/lib/auth-utils', () => ({
  getCurrentUser: jest.fn(),
  getAuthUserId: jest.fn(),
}));

// Mock cloudinary upload function
jest.mock('@/lib/cloudinary', () => ({
  uploadToCloudinary: jest.fn(),
}));

// Mock slug utils
jest.mock('@/lib/slug-utils', () => ({
  generateUniqueSlug: jest.fn(),
}));

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Declare global helper function
declare global {
  var createMockNextRequest: (url: string, init?: any) => any;
}

// Mock Prisma client
const mockPrisma = {
  product: {
    create: jest.fn() as jest.MockedFunction<any>,
    findUnique: jest.fn() as jest.MockedFunction<any>,
    findMany: jest.fn() as jest.MockedFunction<any>,
    update: jest.fn() as jest.MockedFunction<any>,
    delete: jest.fn() as jest.MockedFunction<any>,
  },
  user: {
    findUnique: jest.fn() as jest.MockedFunction<any>,
  },
  file: {
    create: jest.fn() as jest.MockedFunction<any>,
    findMany: jest.fn() as jest.MockedFunction<any>,
    delete: jest.fn() as jest.MockedFunction<any>,
  },
  $transaction: jest.fn() as jest.MockedFunction<any>,
};

// Mock auth utilities
const mockAuth = {
  getCurrentUser: jest.fn() as jest.MockedFunction<any>,
  getAuthUserId: jest.fn() as jest.MockedFunction<any>,
};

// Mock cloudinary
const mockCloudinary = {
  uploadToCloudinary: jest.fn() as jest.MockedFunction<any>,
};

// Mock slug utils
const mockSlugUtils = {
  generateUniqueSlug: jest.fn() as jest.MockedFunction<any>,
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

describe('Product Management API Tests', () => {
  const mockUser = {
    id: 'user123',
    email: 'seller@example.com',
    name: 'Test Seller',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.getCurrentUser.mockResolvedValue(mockUser);
    mockAuth.getAuthUserId.mockResolvedValue(mockUser.id);
    mockSlugUtils.generateUniqueSlug.mockResolvedValue('test-product-slug');
    mockCloudinary.uploadToCloudinary.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test/image/upload/mock_image.jpg',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/products - Successful Product Creation', () => {
    it('should successfully create a digital product', async () => {
      const mockProduct = {
        id: 'product123',
        name: 'Test Digital Product',
        type: 'digital_product',
        price: 2999,
        currency: 'PHP',
        description: 'Test description',
        slug: 'test-digital-product',
        userId: 'user123',
        published: false,
        createdAt: new Date(),
      };

      mockPrisma.product.create.mockResolvedValue(mockProduct);

      const { POST } = await import('@/app/api/products/route');

      const formData = new FormData();
      formData.append('name', 'Test Digital Product');
      formData.append('type', 'digital_product');
      formData.append('price', '29.99');
      formData.append('currency', 'PHP');
      formData.append('description', 'Test description');

      const request = createMockNextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.product).toEqual(mockProduct);
      expect(mockPrisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Digital Product',
            type: 'digital_product',
            price: 2999, // Price in cents
            currency: 'PHP',
            userId: 'user123',
          }),
        })
      );
    });

    it('should successfully create a physical product', async () => {
      const mockProduct = {
        id: 'product456',
        name: 'Test Physical Product',
        type: 'physical_product',
        price: 4999,
        currency: 'PHP',
        userId: 'user123',
      };

      mockPrisma.product.create.mockResolvedValue(mockProduct);

      const { POST } = await import('@/app/api/products/route');

      const formData = new FormData();
      formData.append('name', 'Test Physical Product');
      formData.append('type', 'physical_product');
      formData.append('price', '49.99');

      const request = createMockNextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.product.name).toBe('Test Physical Product');
      expect(data.product.type).toBe('physical_product');
    });
  });

  describe('POST /api/products - Error Scenarios', () => {
    it('should reject product creation without authentication', async () => {
      mockAuth.getAuthUserId.mockResolvedValue(null);

      const { POST } = await import('@/app/api/products/route');

      const formData = new FormData();
      formData.append('name', 'Test Product');
      formData.append('type', 'digital_product');
      formData.append('price', '29.99');

      const request = createMockNextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should reject product creation with missing required fields', async () => {
      const { POST } = await import('@/app/api/products/route');

      const formData = new FormData();
      formData.append('name', ''); // Missing name
      formData.append('type', 'digital_product');

      const request = createMockNextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should reject product creation with invalid price', async () => {
      const { POST } = await import('@/app/api/products/route');

      const formData = new FormData();
      formData.append('name', 'Test Product');
      formData.append('type', 'digital_product');
      formData.append('price', '0'); // Invalid price

      const request = createMockNextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid price');
    });
  });

  describe('GET /api/products - Product Listing', () => {
    it('should successfully retrieve products list', async () => {
      const mockProducts = [
        {
          id: 'product1',
          name: 'Product 1',
          price: 1999,
          type: 'digital_product',
        },
        {
          id: 'product2',
          name: 'Product 2',
          price: 2999,
          type: 'physical_product',
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const { GET } = await import('@/app/api/products/route');

      const request = createMockNextRequest('http://localhost:3000/api/products');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.products).toEqual(mockProducts);
    });
  });

  describe('Product Validation and Business Logic', () => {
    it('should generate unique slugs for products', async () => {
      const mockProduct = {
        id: 'product123',
        name: 'Test Product',
        slug: 'test-product-1',
        type: 'digital_product',
        price: 2999,
        userId: 'user123',
      };

      mockPrisma.product.create.mockResolvedValue(mockProduct);
      mockSlugUtils.generateUniqueSlug.mockResolvedValue('test-product-1');

      const { POST } = await import('@/app/api/products/route');

      const formData = new FormData();
      formData.append('name', 'Test Product');
      formData.append('type', 'digital_product');
      formData.append('price', '29.99');

      const request = createMockNextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockSlugUtils.generateUniqueSlug).toHaveBeenCalled();
    });
  });
}); 