/**
 * ============================================================================
 * BACKEND TESTS - PURCHASE MANAGEMENT API
 * ============================================================================
 * 
 * Tests for purchase management API endpoints including:
 * - Purchase creation and processing
 * - Purchase retrieval and listing
 * - Payment integration
 * - Error handling and validation
 */

// Mock auth utilities before imports
jest.mock('@/lib/auth-utils', () => ({
  getCurrentUser: jest.fn(),
  getAuthUserId: jest.fn(),
}));

// Mock purchase utilities
jest.mock('@/lib/purchase-utils', () => ({
  createPurchase: jest.fn(),
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Declare global helper function
declare global {
  var createMockNextRequest: (url: string, init?: any) => any;
}

// Mock Prisma client
const mockPrisma = {
  purchase: {
    create: jest.fn() as jest.MockedFunction<any>,
    findUnique: jest.fn() as jest.MockedFunction<any>,
    findMany: jest.fn() as jest.MockedFunction<any>,
    update: jest.fn() as jest.MockedFunction<any>,
    count: jest.fn() as jest.MockedFunction<any>,
  },
  product: {
    findUnique: jest.fn() as jest.MockedFunction<any>,
  },
  user: {
    findUnique: jest.fn() as jest.MockedFunction<any>,
  },
};

// Mock purchase utilities
const mockPurchaseUtils = {
  createPurchase: jest.fn() as jest.MockedFunction<any>,
};

// Mock JWT
const mockJwt = {
  verify: jest.fn() as jest.MockedFunction<any>,
};

// Mock cookies
const mockCookies = {
  get: jest.fn() as jest.MockedFunction<any>,
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

describe('Purchase Management API Tests', () => {
  const mockUser = {
    id: 'user123',
    email: 'buyer@example.com',
    name: 'Test Buyer',
  };

  const mockProduct = {
    id: 'product123',
    name: 'Test Product',
    price: 2999, // Price in cents
    currency: 'PHP',
    type: 'digital_product',
    userId: 'seller123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mocks
    mockCookies.get.mockReturnValue({ value: 'mock_jwt_token' });
    mockJwt.verify.mockReturnValue({ userId: mockUser.id, email: mockUser.email });
    
    // Mock cookies function
    require('next/headers').cookies.mockResolvedValue(mockCookies);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/purchases - Purchase Listing', () => {
    it('should successfully retrieve user purchases', async () => {
      const mockPurchases = [
        {
          id: 'purchase1',
          productId: 'product123',
          email: 'buyer@example.com',
          amount: 2999,
          status: 'completed',
          createdAt: new Date(),
          product: {
            id: 'product123',
            name: 'Test Product',
            price: 2999,
          },
        },
      ];

      mockPrisma.purchase.count.mockResolvedValue(1);
      mockPrisma.purchase.findMany.mockResolvedValue(mockPurchases);

      const { GET } = await import('@/app/api/purchases/route');

      const request = createMockNextRequest('http://localhost:3000/api/purchases');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.purchases).toEqual(mockPurchases);
      expect(data.pagination.total).toBe(1);
      expect(mockPrisma.purchase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: mockUser.email },
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should handle pagination parameters', async () => {
      mockPrisma.purchase.count.mockResolvedValue(25);
      mockPrisma.purchase.findMany.mockResolvedValue([]);

      const { GET } = await import('@/app/api/purchases/route');

      const request = createMockNextRequest('http://localhost:3000/api/purchases?page=2&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.totalPages).toBe(3);
      expect(mockPrisma.purchase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page - 1) * limit
          take: 10,
        })
      );
    });

    it('should reject requests without authentication', async () => {
      mockCookies.get.mockReturnValue(null);

      const { GET } = await import('@/app/api/purchases/route');

      const request = createMockNextRequest('http://localhost:3000/api/purchases');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/purchases - Purchase Creation', () => {
    it('should successfully create a new purchase', async () => {
      const mockPurchase = {
        id: 'purchase123',
        productId: 'product123',
        email: 'buyer@example.com',
        amount: 2999,
        currency: 'PHP',
        status: 'pending',
        createdAt: new Date(),
      };

      mockPurchaseUtils.createPurchase.mockResolvedValue(mockPurchase);

      const { POST } = await import('@/app/api/purchases/route');

      const request = createMockNextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          email: 'buyer@example.com',
          amount: 29.99,
          currency: 'PHP',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.purchase).toEqual(mockPurchase);
      expect(mockPurchaseUtils.createPurchase).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'product123',
          email: 'buyer@example.com',
          amount: 29.99,
          currency: 'PHP',
        })
      );
    });

    it('should reject purchase creation with missing required fields', async () => {
      const { POST } = await import('@/app/api/purchases/route');

      const request = createMockNextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          productId: '', // Missing productId
          email: 'buyer@example.com',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should handle purchase creation errors', async () => {
      mockPurchaseUtils.createPurchase.mockRejectedValue(new Error('Purchase creation failed'));

      const { POST } = await import('@/app/api/purchases/route');

      const request = createMockNextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          email: 'buyer@example.com',
          amount: 29.99,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create purchase');
    });
  });

  describe('Purchase Validation and Business Logic', () => {
    it('should validate email format', async () => {
      const { POST } = await import('@/app/api/purchases/route');

      const request = createMockNextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          email: 'invalid-email', // Invalid email format
          amount: 29.99,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('email');
    });

    it('should validate amount is positive', async () => {
      const { POST } = await import('@/app/api/purchases/route');

      const request = createMockNextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          email: 'buyer@example.com',
          amount: -10, // Negative amount
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('amount');
    });

    it('should handle discount codes', async () => {
      const mockPurchase = {
        id: 'purchase123',
        productId: 'product123',
        email: 'buyer@example.com',
        amount: 2399, // Discounted amount
        discountAmount: 600,
        status: 'pending',
      };

      mockPurchaseUtils.createPurchase.mockResolvedValue(mockPurchase);

      const { POST } = await import('@/app/api/purchases/route');

      const request = createMockNextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          email: 'buyer@example.com',
          amount: 23.99,
          discountCode: 'SAVE20',
          discountAmount: 6.00,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.purchase.discountAmount).toBe(600);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON in request body', async () => {
      const { POST } = await import('@/app/api/purchases/route');

      const request = createMockNextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON in request body');
    });

    it('should handle database connection errors', async () => {
      mockPrisma.purchase.findMany.mockRejectedValue(new Error('Database connection failed'));

      const { GET } = await import('@/app/api/purchases/route');

      const request = createMockNextRequest('http://localhost:3000/api/purchases');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch purchase information');
    });

    it('should handle JWT verification errors', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('JsonWebTokenError');
      });

      const { GET } = await import('@/app/api/purchases/route');

      const request = createMockNextRequest('http://localhost:3000/api/purchases');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid authentication token');
    });
  });
}); 