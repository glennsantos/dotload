/**
 * ============================================================================
 * BACKEND TESTS - DISCOUNT CODES API
 * ============================================================================
 *
 * Tests for discount code API endpoints including:
 * - Discount code creation
 * - Discount code validation
 * - Discount code application
 * - Usage tracking
 * - Expiration handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Declare global helper
declare global {
  var createMockNextRequest: (url: string, init?: any) => any;
}

// Mock Prisma
const mockPrisma = {
  discountCode: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  purchase: {
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock auth
const mockAuth = {
  verifyAuth: jest.fn(),
};

jest.mock('@/lib/auth', () => mockAuth);

describe('Discount Codes API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock implementations
    mockAuth.verifyAuth.mockResolvedValue({
      userId: 'user123',
      email: 'seller@example.com',
    });

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user123',
      email: 'seller@example.com',
      name: 'Seller Name',
    });

    mockPrisma.discountCode.create.mockResolvedValue({
      id: 'discount123',
      code: 'SAVE20',
      type: 'percentage',
      value: 20,
      userId: 'user123',
      active: true,
      usageLimit: 100,
      usageCount: 0,
      createdAt: new Date(),
    });

    mockPrisma.discountCode.findUnique.mockResolvedValue({
      id: 'discount123',
      code: 'SAVE20',
      type: 'percentage',
      value: 20,
      userId: 'user123',
      active: true,
      usageLimit: 100,
      usageCount: 5,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    mockPrisma.purchase.count.mockResolvedValue(5);
  });

  describe('POST /api/discount-codes - Create Discount Code', () => {
    it('should create discount code successfully', async () => {
      const { POST } = await import('@/app/api/discount-codes/route');

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes', {
        method: 'POST',
        body: JSON.stringify({
          code: 'SAVE20',
          type: 'percentage',
          value: 20,
          usageLimit: 100,
        }),
        headers: {
          Authorization: 'Bearer mock_token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.code).toBe('SAVE20');
      expect(data.type).toBe('percentage');
      expect(data.value).toBe(20);
    });

    it('should validate discount code format', async () => {
      const { POST } = await import('@/app/api/discount-codes/route');

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes', {
        method: 'POST',
        body: JSON.stringify({
          code: 'invalid code', // Has spaces
          type: 'percentage',
          value: 20,
        }),
        headers: {
          Authorization: 'Bearer mock_token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid code format');
    });

    it('should validate percentage discount range', async () => {
      const { POST } = await import('@/app/api/discount-codes/route');

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes', {
        method: 'POST',
        body: JSON.stringify({
          code: 'INVALID',
          type: 'percentage',
          value: 150, // Over 100%
        }),
        headers: {
          Authorization: 'Bearer mock_token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('percentage must be between');
    });

    it('should validate fixed discount is positive', async () => {
      const { POST } = await import('@/app/api/discount-codes/route');

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes', {
        method: 'POST',
        body: JSON.stringify({
          code: 'INVALID',
          type: 'fixed',
          value: -50, // Negative
        }),
        headers: {
          Authorization: 'Bearer mock_token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('must be positive');
    });

    it('should prevent duplicate discount codes', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue({
        id: 'existing',
        code: 'SAVE20',
      });

      const { POST } = await import('@/app/api/discount-codes/route');

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes', {
        method: 'POST',
        body: JSON.stringify({
          code: 'SAVE20',
          type: 'percentage',
          value: 20,
        }),
        headers: {
          Authorization: 'Bearer mock_token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists');
    });

    it('should require authentication', async () => {
      mockAuth.verifyAuth.mockResolvedValue(null);

      const { POST } = await import('@/app/api/discount-codes/route');

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes', {
        method: 'POST',
        body: JSON.stringify({
          code: 'SAVE20',
          type: 'percentage',
          value: 20,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('POST /api/discount-codes/validate - Validate Discount Code', () => {
    it('should validate active discount code', async () => {
      const { POST } = await import('@/app/api/discount-codes/validate/route');

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'SAVE20',
          amount: 100,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.discountedAmount).toBe(80); // 100 - 20%
    });

    it('should reject expired discount code', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue({
        code: 'EXPIRED',
        active: true,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      });

      const { POST } = await import('@/app/api/discount-codes/validate/route');

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'EXPIRED',
          amount: 100,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
      expect(data.error).toContain('expired');
    });

    it('should reject inactive discount code', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue({
        code: 'INACTIVE',
        active: false,
      });

      const { POST } = await import('@/app/api/discount-codes/validate/route');

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'INACTIVE',
          amount: 100,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
      expect(data.error).toContain('not active');
    });

    it('should reject code over usage limit', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue({
        code: 'MAXED',
        active: true,
        usageLimit: 100,
        usageCount: 100,
      });

      const { POST } = await import('@/app/api/discount-codes/validate/route');

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'MAXED',
          amount: 100,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
      expect(data.error).toContain('usage limit');
    });

    it('should calculate percentage discount correctly', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue({
        code: 'PERCENT50',
        type: 'percentage',
        value: 50,
        active: true,
      });

      const { POST } = await import('@/app/api/discount-codes/validate/route');

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'PERCENT50',
          amount: 200,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.discountedAmount).toBe(100); // 200 - 50%
    });

    it('should calculate fixed discount correctly', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue({
        code: 'FIXED100',
        type: 'fixed',
        value: 100,
        active: true,
      });

      const { POST } = await import('@/app/api/discount-codes/validate/route');

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'FIXED100',
          amount: 300,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.discountedAmount).toBe(200); // 300 - 100
    });

    it('should not allow negative final amount', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue({
        code: 'TOOBIG',
        type: 'fixed',
        value: 500,
        active: true,
      });

      const { POST } = await import('@/app/api/discount-codes/validate/route');

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TOOBIG',
          amount: 100,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.discountedAmount).toBe(0); // Minimum is 0
    });
  });

  describe('GET /api/discount-codes - List Discount Codes', () => {
    it('should list user discount codes', async () => {
      mockPrisma.discountCode.findMany.mockResolvedValue([
        {
          id: 'discount1',
          code: 'SAVE20',
          type: 'percentage',
          value: 20,
        },
        {
          id: 'discount2',
          code: 'SAVE50',
          type: 'fixed',
          value: 50,
        },
      ]);

      const { GET } = await import('@/app/api/discount-codes/route');

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock_token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.discountCodes).toHaveLength(2);
      expect(data.discountCodes[0].code).toBe('SAVE20');
    });

    it('should require authentication', async () => {
      mockAuth.verifyAuth.mockResolvedValue(null);

      const { GET } = await import('@/app/api/discount-codes/route');

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('PATCH /api/discount-codes/[id] - Update Discount Code', () => {
    it('should update discount code status', async () => {
      const { PATCH } = await import('@/app/api/discount-codes/[id]/route');

      mockPrisma.discountCode.update.mockResolvedValue({
        id: 'discount123',
        active: false,
      });

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes/discount123', {
        method: 'PATCH',
        body: JSON.stringify({
          active: false,
        }),
        headers: {
          Authorization: 'Bearer mock_token',
        },
      });

      const response = await PATCH(request, { params: { id: 'discount123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.active).toBe(false);
    });

    it('should not allow updating code value after usage', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue({
        id: 'discount123',
        usageCount: 10, // Already used
      });

      const { PATCH } = await import('@/app/api/discount-codes/[id]/route');

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes/discount123', {
        method: 'PATCH',
        body: JSON.stringify({
          value: 50, // Trying to change value
        }),
        headers: {
          Authorization: 'Bearer mock_token',
        },
      });

      const response = await PATCH(request, { params: { id: 'discount123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Cannot modify');
    });
  });

  describe('DELETE /api/discount-codes/[id] - Delete Discount Code', () => {
    it('should delete unused discount code', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue({
        id: 'discount123',
        usageCount: 0,
      });

      const { DELETE } = await import('@/app/api/discount-codes/[id]/route');

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes/discount123', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer mock_token',
        },
      });

      const response = await DELETE(request, { params: { id: 'discount123' } });

      expect(response.status).toBe(204);
      expect(mockPrisma.discountCode.delete).toHaveBeenCalledWith({
        where: { id: 'discount123' },
      });
    });

    it('should not delete code with active usage', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue({
        id: 'discount123',
        usageCount: 5,
      });

      const { DELETE } = await import('@/app/api/discount-codes/[id]/route');

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes/discount123', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer mock_token',
        },
      });

      const response = await DELETE(request, { params: { id: 'discount123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Cannot delete');
    });
  });

  describe('Discount Code Analytics', () => {
    it('should track discount code usage', async () => {
      const { GET } = await import('@/app/api/discount-codes/[id]/stats/route');

      mockPrisma.purchase.count.mockResolvedValue(25);

      const request = createMockNextRequest('http://localhost:2222/api/discount-codes/discount123/stats', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock_token',
        },
      });

      const response = await GET(request, { params: { id: 'discount123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.usageCount).toBe(25);
    });
  });
});
