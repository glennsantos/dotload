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
      upload: jest.fn().mockResolvedValue({
        public_id: 'mock_public_id',
        secure_url: 'https://res.cloudinary.com/test/image/upload/mock_image.jpg',
        url: 'https://res.cloudinary.com/test/image/upload/mock_image.jpg',
        bytes: 1024,
        format: 'jpg'
      }),
      upload_stream: jest.fn().mockImplementation((options, callback) => {
        const mockResult = {
          public_id: 'mock_public_id',
          secure_url: 'https://res.cloudinary.com/test/image/upload/mock_image.jpg',
          url: 'https://res.cloudinary.com/test/image/upload/mock_image.jpg',
          bytes: 1024,
          format: 'jpg'
        };
        
        return {
          end: jest.fn((buffer) => {
            setTimeout(() => callback(null, mockResult), 0);
          })
        };
      }),
      destroy: jest.fn().mockResolvedValue({
        result: 'ok'
      })
    },
    api: {
      delete_resources: jest.fn().mockResolvedValue({
        deleted: ['mock_public_id']
      })
    }
  }
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

// Mock Cloudinary
const mockCloudinary = {
  uploader: {
    upload: jest.fn() as jest.MockedFunction<any>,
    destroy: jest.fn() as jest.MockedFunction<any>,
  },
};

// Mock auth utilities
const mockAuth = {
  getCurrentUser: jest.fn() as jest.MockedFunction<any>,
  getAuthUserId: jest.fn() as jest.MockedFunction<any>,
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('@/lib/auth', () => mockAuth);

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

    it('should successfully create a physical product with variants', async () => {
      const mockProduct = {
        id: 'product456',
        name: 'Test Physical Product',
        type: 'physical_product',
        price: 4999,
        currency: 'PHP',
        stockQuantity: 100,
        userId: 'user123',
      };

      const mockVariations = [
        {
          id: 'var1',
          productId: 'product456',
          name: 'Size',
          options: 'Small,Medium,Large',
        },
      ];

      mockPrisma.product.create.mockResolvedValue(mockProduct);
      mockPrisma.$transaction.mockResolvedValue([mockProduct, mockVariations]);

      const { POST } = await import('@/app/api/products/route');

      const formData = new FormData();
      formData.append('name', 'Test Physical Product');
      formData.append('type', 'physical_product');
      formData.append('price', '49.99');
      formData.append('stockQuantity', '100');
      formData.append('variants', JSON.stringify([
        {
          name: 'Size',
          displayType: 'dropdown',
          options: ['Small', 'Medium', 'Large'],
        },
      ]));

      const request = createMockNextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.product.name).toBe('Test Physical Product');
      expect(data.product.type).toBe('physical_product');
      expect(data.product.stockQuantity).toBe(100);
    });

    it('should handle file uploads for digital products', async () => {
      const mockProduct = {
        id: 'product789',
        name: 'Product with Files',
        type: 'digital_product',
        userId: 'user123',
      };

      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const mockUploadResult = {
        secure_url: 'https://cloudinary.com/test.pdf',
        public_id: 'test_pdf_123',
        bytes: 1024,
      };

      mockPrisma.product.create.mockResolvedValue(mockProduct);
      mockCloudinary.uploader.upload.mockResolvedValue(mockUploadResult);

      const { POST } = await import('@/app/api/products/route');

      const formData = new FormData();
      formData.append('name', 'Product with Files');
      formData.append('type', 'digital_product');
      formData.append('price', '19.99');
      formData.append('contentFile0', mockFile);

      const request = createMockNextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockCloudinary.uploader.upload).toHaveBeenCalled();
    });
  });

  describe('POST /api/products - Error Scenarios', () => {
    it('should reject product creation without authentication', async () => {
      mockAuth.getCurrentUser.mockResolvedValue(null);

      const { POST } = await import('@/app/api/products/route');

      const formData = new FormData();
      formData.append('name', 'Test Product');

      const request = createMockNextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject product creation with missing required fields', async () => {
      const { POST } = await import('@/app/api/products/route');

      const formData = new FormData();
      // Missing name and price

      const request = createMockNextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });

    it('should reject product creation with invalid price', async () => {
      const { POST } = await import('@/app/api/products/route');

      const formData = new FormData();
      formData.append('name', 'Test Product');
      formData.append('price', 'invalid-price');

      const request = createMockNextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('price');
    });

    it('should handle file upload errors', async () => {
      const mockProduct = {
        id: 'product789',
        name: 'Product with Files',
        type: 'digital_product',
        userId: 'user123',
      };

      mockPrisma.product.create.mockResolvedValue(mockProduct);
      mockCloudinary.uploader.upload.mockRejectedValue(new Error('Upload failed'));

      const { POST } = await import('@/app/api/products/route');

      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('name', 'Product with Files');
      formData.append('type', 'digital_product');
      formData.append('price', '19.99');
      formData.append('contentFile0', mockFile);

      const request = createMockNextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: formData,
      });

      // Product should still be created even if file upload fails
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
    });
  });

  describe('PUT /api/products/[id] - Product Updates', () => {
    it('should successfully update product details', async () => {
      const existingProduct = {
        id: 'product123',
        name: 'Original Product',
        price: 1999,
        userId: 'user123',
      };

      const updatedProduct = {
        ...existingProduct,
        name: 'Updated Product',
        price: 2999,
      };

      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);
      mockPrisma.product.update.mockResolvedValue(updatedProduct);

      const { PUT } = await import('@/app/api/products/[id]/route');

      const formData = new FormData();
      formData.append('name', 'Updated Product');
      formData.append('price', '29.99');

      const request = createMockNextRequest('http://localhost:3000/api/products/product123', {
        method: 'PUT',
        body: formData,
      });

      const response = await PUT(request, { params: { id: 'product123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.product.name).toBe('Updated Product');
      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product123' },
          data: expect.objectContaining({
            name: 'Updated Product',
            price: 2999,
          }),
        })
      );
    });

    it('should reject updates to non-existent products', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const { PUT } = await import('@/app/api/products/[id]/route');

      const formData = new FormData();
      formData.append('name', 'Updated Product');

      const request = createMockNextRequest('http://localhost:3000/api/products/nonexistent', {
        method: 'PUT',
        body: formData,
      });

      const response = await PUT(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Product not found');
    });

    it('should reject updates from unauthorized users', async () => {
      const existingProduct = {
        id: 'product123',
        name: 'Original Product',
        userId: 'other-user',
      };

      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);

      const { PUT } = await import('@/app/api/products/[id]/route');

      const formData = new FormData();
      formData.append('name', 'Updated Product');

      const request = createMockNextRequest('http://localhost:3000/api/products/product123', {
        method: 'PUT',
        body: formData,
      });

      const response = await PUT(request, { params: { id: 'product123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/products/[id] - Product Retrieval', () => {
    it('should successfully retrieve a product by ID', async () => {
      const mockProduct = {
        id: 'product123',
        name: 'Test Product',
        price: 2999,
        description: 'Test description',
        userId: 'user123',
        user: {
          name: 'Test Seller',
          email: 'seller@example.com',
        },
        files: [],
      };

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const { GET } = await import('@/app/api/products/[id]/route');

      const request = createMockNextRequest('http://localhost:3000/api/products/product123');
      const response = await GET(request, { params: { id: 'product123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.product).toEqual(mockProduct);
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product123' },
          include: expect.objectContaining({
            user: true,
            files: true,
          }),
        })
      );
    });

    it('should return 404 for non-existent products', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const { GET } = await import('@/app/api/products/[id]/route');

      const request = createMockNextRequest('http://localhost:3000/api/products/nonexistent');
      const response = await GET(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Product not found');
    });
  });

  describe('DELETE /api/products/[id] - Product Deletion', () => {
    it('should successfully delete a product', async () => {
      const existingProduct = {
        id: 'product123',
        name: 'Product to Delete',
        userId: 'user123',
        files: [
          { id: 'file1', cloudinaryPublicId: 'test_file_1' },
        ],
      };

      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);
      mockPrisma.product.delete.mockResolvedValue(existingProduct);
      mockCloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

      const { DELETE } = await import('@/app/api/products/[id]/route');

      const request = createMockNextRequest('http://localhost:3000/api/products/product123');
      const response = await DELETE(request, { params: { id: 'product123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Product deleted successfully');
      expect(mockPrisma.product.delete).toHaveBeenCalledWith({
        where: { id: 'product123' },
      });
      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith('test_file_1');
    });

    it('should reject deletion from unauthorized users', async () => {
      const existingProduct = {
        id: 'product123',
        name: 'Product to Delete',
        userId: 'other-user',
      };

      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);

      const { DELETE } = await import('@/app/api/products/[id]/route');

      const request = createMockNextRequest('http://localhost:3000/api/products/product123');
      const response = await DELETE(request, { params: { id: 'product123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Product Validation and Business Logic', () => {
    it('should generate unique slugs for products', async () => {
      const mockProduct = {
        id: 'product123',
        name: 'Test Product',
        slug: 'test-product',
        userId: 'user123',
      };

      // Mock existing product with same slug
      mockPrisma.product.findMany
        .mockResolvedValueOnce([{ slug: 'test-product' }]) // First call finds existing
        .mockResolvedValueOnce([]); // Second call finds none

      mockPrisma.product.create.mockResolvedValue({
        ...mockProduct,
        slug: 'test-product-1',
      });

      const { POST } = await import('@/app/api/products/route');

      const formData = new FormData();
      formData.append('name', 'Test Product');
      formData.append('type', 'digital_product');
      formData.append('price', '19.99');

      const request = createMockNextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.product.slug).toBe('test-product-1');
    });

    it('should validate file types for digital products', async () => {
      const { POST } = await import('@/app/api/products/route');

      const invalidFile = new File(['test'], 'test.exe', { type: 'application/x-executable' });
      const formData = new FormData();
      formData.append('name', 'Product with Invalid File');
      formData.append('type', 'digital_product');
      formData.append('price', '19.99');
      formData.append('contentFile0', invalidFile);

      const request = createMockNextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('file type');
    });

    it('should validate file size limits', async () => {
      const { POST } = await import('@/app/api/products/route');

      // Create a mock file that's too large (over 50MB)
      const largeFile = new File(['x'.repeat(51 * 1024 * 1024)], 'large.pdf', { 
        type: 'application/pdf' 
      });

      const formData = new FormData();
      formData.append('name', 'Product with Large File');
      formData.append('type', 'digital_product');
      formData.append('price', '19.99');
      formData.append('contentFile0', largeFile);

      const request = createMockNextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('size limit');
    });
  });
}); 