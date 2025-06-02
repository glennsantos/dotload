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

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
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

// Mock cookies
const mockCookies = {
  get: jest.fn() as jest.MockedFunction<any>,
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
    
    // Mock cookies function
    mockCookies.get.mockReturnValue({ value: 'mock_jwt_token' });
    require('next/headers').cookies.mockResolvedValue(mockCookies);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/products - Successful Product Creation', () => {
    it('should successfully create a digital product', async () => {
      // Ensure the mock is set up correctly
      const mockGetAuthUserId = require('@/lib/auth-utils').getAuthUserId;
      mockGetAuthUserId.mockResolvedValue('user123');
      
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

      // Instead of testing the full HTTP request, let's test the core logic
      // by mocking the request.formData() method directly
      const mockRequest = {
        formData: jest.fn().mockResolvedValue({
          // @ts-ignore
          get: jest.fn().mockImplementation((key: string) => {
            const data: Record<string, string> = {
              'name': 'Test Digital Product',
              'type': 'digital_product',
              'price': '30', // Integer price (no decimals)
              'currency': 'PHP',
              'description': 'Test description',
              'contentLinks': JSON.stringify(['https://example.com/file1.pdf']) // Add content links for digital product
            };
            return data[key] || null;
          })
        })
      };

      const { POST } = await import('@/app/api/products/route');
      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.product).toEqual({
        ...mockProduct,
        createdAt: mockProduct.createdAt.toISOString()
      });
    });

    it('should successfully create a physical product', async () => {
      // Ensure the mock is set up correctly
      const mockGetAuthUserId = require('@/lib/auth-utils').getAuthUserId;
      mockGetAuthUserId.mockResolvedValue('user123');
      
      const mockProduct = {
        id: 'product456',
        name: 'Test Physical Product',
        type: 'physical_product',
        price: 4999,
        currency: 'PHP',
        userId: 'user123',
        createdAt: new Date(),
      };

      mockPrisma.product.create.mockResolvedValue(mockProduct);

      // Mock request with formData
      const mockRequest = {
        // @ts-ignore
        formData: jest.fn().mockResolvedValue({
          // @ts-ignore
          get: jest.fn().mockImplementation((key: string) => {
            const data: Record<string, string> = {
              'name': 'Test Physical Product',
              'type': 'physical_product',
              'price': '50' // Integer price (no decimals)
            };
            return data[key] || null;
          })
        })
      };

      const { POST } = await import('@/app/api/products/route');
      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.product.name).toBe('Test Physical Product');
      expect(data.product.type).toBe('physical_product');
    });
  });

  describe('POST /api/products - Error Scenarios', () => {
    it('should reject product creation without authentication', async () => {
      const mockGetAuthUserId = require('@/lib/auth-utils').getAuthUserId;
      mockGetAuthUserId.mockResolvedValue(null);

      // Mock request with formData
      const mockRequest = {
        // @ts-ignore
        formData: jest.fn().mockResolvedValue({
          // @ts-ignore
          get: jest.fn().mockImplementation((key: string) => {
            const data: Record<string, string> = {
              'name': 'Test Product',
              'type': 'digital_product',
              'price': '30' // Integer price (no decimals)
            };
            return data[key] || null;
          })
        })
      };

      const { POST } = await import('@/app/api/products/route');
      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should reject product creation with missing required fields', async () => {
      const mockGetAuthUserId = require('@/lib/auth-utils').getAuthUserId;
      mockGetAuthUserId.mockResolvedValue('user123');

      // Mock request with missing fields
      const mockRequest = {
        // @ts-ignore
        formData: jest.fn().mockResolvedValue({
          // @ts-ignore
          get: jest.fn().mockImplementation((key: string) => {
            const data: Record<string, string> = {
              'name': '', // Missing name
              'type': 'digital_product'
            };
            return data[key] || null;
          })
        })
      };

      const { POST } = await import('@/app/api/products/route');
      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should reject product creation with invalid price', async () => {
      const mockGetAuthUserId = require('@/lib/auth-utils').getAuthUserId;
      mockGetAuthUserId.mockResolvedValue('user123');

      // Mock request with invalid price
      const mockRequest = {
        // @ts-ignore
        formData: jest.fn().mockResolvedValue({
          // @ts-ignore
          get: jest.fn().mockImplementation((key: string) => {
            const data: Record<string, string> = {
              'name': 'Test Product',
              'type': 'digital_product',
              'price': '0' // Invalid price
            };
            return data[key] || null;
          })
        })
      };

      const { POST } = await import('@/app/api/products/route');
      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid price');
    });
  });

  describe('GET /api/products - Product Listing', () => {
    it('should successfully retrieve products list', async () => {
      // Set up authentication mock
      const mockGetAuthUserId = require('@/lib/auth-utils').getAuthUserId;
      mockGetAuthUserId.mockResolvedValue('user123');
      
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
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      // The API returns products directly, not wrapped in { products: ... }
      expect(data).toEqual(mockProducts);
    });
  });

  describe('Product Validation and Business Logic', () => {
    it('should generate unique slugs for products', async () => {
      const mockGetAuthUserId = require('@/lib/auth-utils').getAuthUserId;
      mockGetAuthUserId.mockResolvedValue('user123');
      
      // Clear and reset the slug utils mock
      const mockSlugUtilsModule = require('@/lib/slug-utils');
      mockSlugUtilsModule.generateUniqueSlug.mockClear();
      mockSlugUtilsModule.generateUniqueSlug.mockResolvedValue('test-product-1');
      
      const mockProduct = {
        id: 'product123',
        name: 'Test Product',
        slug: 'test-product-1',
        type: 'digital_product',
        price: 2999,
        userId: 'user123',
        createdAt: new Date(),
      };

      mockPrisma.product.create.mockResolvedValue(mockProduct);

      // Mock request with formData (no slug provided, so it should generate one)
      const mockRequest = {
        // @ts-ignore
        formData: jest.fn().mockResolvedValue({
          // @ts-ignore
          get: jest.fn().mockImplementation((key: string) => {
            const data: Record<string, string> = {
              'name': 'Test Product',
              'type': 'digital_product',
              'price': '30', // Integer price (no decimals)
              'contentLinks': JSON.stringify(['https://example.com/file1.pdf']) // Add content links for digital product
              // No slug key at all, should trigger generation
            };
            return data[key] || null;
          })
        })
      };

      const { POST } = await import('@/app/api/products/route');
      const response = await POST(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      // Check if the mock was called
      expect(mockSlugUtilsModule.generateUniqueSlug).toHaveBeenCalled();
      expect(mockSlugUtilsModule.generateUniqueSlug).toHaveBeenCalledWith('Test Product');
    });
  });
}); 