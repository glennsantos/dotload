/**
 * ============================================================================
 * BACKEND TESTS - PAYMENT API
 * ============================================================================
 *
 * Tests for payment API endpoints including:
 * - Payment creation (Xendit integration)
 * - Payment status checking
 * - Webhook handling
 * - Payment method support
 * - Error handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Declare global helper
declare global {
  var createMockNextRequest: (url: string, init?: any) => any;
}

// Mock Xendit client
const mockXendit = {
  Invoice: {
    createInvoice: jest.fn(),
    getInvoice: jest.fn(),
  },
  EWallet: {
    createEWalletCharge: jest.fn(),
  },
  VirtualAccount: {
    createVirtualAccount: jest.fn(),
  },
};

jest.mock('xendit-node', () => ({
  Xendit: jest.fn(() => mockXendit),
}));

// Mock Prisma
const mockPrisma = {
  purchase: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
  },
  discountCode: {
    findUnique: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock purchase utils
const mockPurchaseUtils = {
  createPurchase: jest.fn(),
  fulfillOrder: jest.fn(),
};

jest.mock('@/lib/purchase-utils', () => mockPurchaseUtils);

describe('Payment API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock implementations
    mockPrisma.product.findUnique.mockResolvedValue({
      id: 'product123',
      name: 'Test Product',
      price: 299,
      userId: 'seller123',
    });

    mockXendit.Invoice.createInvoice.mockResolvedValue({
      id: 'invoice123',
      external_id: 'order123',
      invoice_url: 'https://checkout.xendit.co/invoice123',
      status: 'PENDING',
      amount: 299,
    });

    mockXendit.Invoice.getInvoice.mockResolvedValue({
      id: 'invoice123',
      status: 'PAID',
      amount: 299,
    });

    mockPurchaseUtils.createPurchase.mockResolvedValue({
      id: 'purchase123',
      userId: 'buyer123',
      productId: 'product123',
      amount: 299,
    });

    mockPurchaseUtils.fulfillOrder.mockResolvedValue({
      success: true,
    });

    process.env.XENDIT_API_KEY = 'test-xendit-key';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:2222';
  });

  describe('POST /api/payments/create - Payment Creation', () => {
    it('should create payment invoice successfully', async () => {
      const { POST } = await import('@/app/api/payments/create/route');

      const request = createMockNextRequest('http://localhost:2222/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          userId: 'buyer123',
          amount: 299,
          customerEmail: 'buyer@example.com',
          customerName: 'Buyer Name',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.invoiceUrl).toBe('https://checkout.xendit.co/invoice123');
      expect(data.invoiceId).toBe('invoice123');
    });

    it('should validate product exists before creating payment', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const { POST } = await import('@/app/api/payments/create/route');

      const request = createMockNextRequest('http://localhost:2222/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'nonexistent',
          userId: 'buyer123',
          amount: 299,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Product not found');
    });

    it('should validate payment amount matches product price', async () => {
      const { POST } = await import('@/app/api/payments/create/route');

      const request = createMockNextRequest('http://localhost:2222/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          userId: 'buyer123',
          amount: 100, // Wrong amount
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid amount');
    });

    it('should apply discount code if provided', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue({
        id: 'discount123',
        code: 'SAVE20',
        type: 'percentage',
        value: 20,
        active: true,
      });

      const { POST } = await import('@/app/api/payments/create/route');

      const request = createMockNextRequest('http://localhost:2222/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          userId: 'buyer123',
          amount: 239, // 299 - 20% = 239.2
          discountCode: 'SAVE20',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockXendit.Invoice.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 239,
        })
      );
    });

    it('should handle Xendit API errors', async () => {
      mockXendit.Invoice.createInvoice.mockRejectedValue(
        new Error('Xendit API unavailable')
      );

      const { POST } = await import('@/app/api/payments/create/route');

      const request = createMockNextRequest('http://localhost:2222/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          userId: 'buyer123',
          amount: 299,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should include success and failure redirect URLs', async () => {
      const { POST } = await import('@/app/api/payments/create/route');

      const request = createMockNextRequest('http://localhost:2222/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          userId: 'buyer123',
          amount: 299,
        }),
      });

      await POST(request);

      expect(mockXendit.Invoice.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          success_redirect_url: expect.stringContaining('/success'),
          failure_redirect_url: expect.stringContaining('/failure'),
        })
      );
    });
  });

  describe('GET /api/payments/[id] - Payment Status', () => {
    it('should get payment status successfully', async () => {
      const { GET } = await import('@/app/api/payments/[id]/route');

      const request = createMockNextRequest('http://localhost:2222/api/payments/invoice123', {
        method: 'GET',
      });

      const response = await GET(request, { params: { id: 'invoice123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('PAID');
      expect(data.amount).toBe(299);
    });

    it('should handle non-existent payment', async () => {
      mockXendit.Invoice.getInvoice.mockRejectedValue(
        new Error('Invoice not found')
      );

      const { GET } = await import('@/app/api/payments/[id]/route');

      const request = createMockNextRequest('http://localhost:2222/api/payments/nonexistent', {
        method: 'GET',
      });

      const response = await GET(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });

  describe('POST /api/webhooks/xendit - Webhook Handler', () => {
    it('should process successful payment webhook', async () => {
      const { POST } = await import('@/app/api/webhooks/xendit/route');

      const webhookPayload = {
        id: 'invoice123',
        external_id: 'purchase123',
        status: 'PAID',
        amount: 299,
        paid_amount: 299,
        payment_channel: 'CREDIT_CARD',
        payment_method: 'VISA',
      };

      mockPrisma.purchase.findUnique.mockResolvedValue({
        id: 'purchase123',
        productId: 'product123',
        userId: 'buyer123',
        status: 'pending',
      });

      const request = createMockNextRequest('http://localhost:2222/api/webhooks/xendit', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
        headers: {
          'x-callback-token': 'test-webhook-token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPurchaseUtils.fulfillOrder).toHaveBeenCalledWith('purchase123');
    });

    it('should handle expired payment webhook', async () => {
      const { POST } = await import('@/app/api/webhooks/xendit/route');

      const webhookPayload = {
        id: 'invoice123',
        external_id: 'purchase123',
        status: 'EXPIRED',
      };

      mockPrisma.purchase.findUnique.mockResolvedValue({
        id: 'purchase123',
        status: 'pending',
      });

      const request = createMockNextRequest('http://localhost:2222/api/webhooks/xendit', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.purchase.update).toHaveBeenCalledWith({
        where: { id: 'purchase123' },
        data: { status: 'expired' },
      });
    });

    it('should validate webhook signature', async () => {
      const { POST } = await import('@/app/api/webhooks/xendit/route');

      const request = createMockNextRequest('http://localhost:2222/api/webhooks/xendit', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'x-callback-token': 'invalid-token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should handle duplicate webhook events', async () => {
      mockPrisma.purchase.findUnique.mockResolvedValue({
        id: 'purchase123',
        status: 'completed', // Already completed
      });

      const { POST } = await import('@/app/api/webhooks/xendit/route');

      const webhookPayload = {
        id: 'invoice123',
        external_id: 'purchase123',
        status: 'PAID',
      };

      const request = createMockNextRequest('http://localhost:2222/api/webhooks/xendit', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPurchaseUtils.fulfillOrder).not.toHaveBeenCalled();
    });
  });

  describe('Payment Method Support', () => {
    it('should support credit card payments', async () => {
      const { POST } = await import('@/app/api/payments/create/route');

      const request = createMockNextRequest('http://localhost:2222/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          userId: 'buyer123',
          amount: 299,
          paymentMethod: 'credit_card',
        }),
      });

      await POST(request);

      expect(mockXendit.Invoice.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_methods: expect.arrayContaining(['CREDIT_CARD']),
        })
      );
    });

    it('should support e-wallet payments', async () => {
      const { POST } = await import('@/app/api/payments/create/route');

      const request = createMockNextRequest('http://localhost:2222/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          userId: 'buyer123',
          amount: 299,
          paymentMethod: 'ewallet',
        }),
      });

      await POST(request);

      expect(mockXendit.Invoice.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_methods: expect.arrayContaining(['GCASH', 'PAYMAYA']),
        })
      );
    });

    it('should support bank transfer payments', async () => {
      const { POST } = await import('@/app/api/payments/create/route');

      const request = createMockNextRequest('http://localhost:2222/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          userId: 'buyer123',
          amount: 299,
          paymentMethod: 'bank_transfer',
        }),
      });

      await POST(request);

      expect(mockXendit.Invoice.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_methods: expect.arrayContaining(['BPI', 'BDO']),
        })
      );
    });
  });

  describe('Payment Security', () => {
    it('should validate required fields', async () => {
      const { POST } = await import('@/app/api/payments/create/route');

      const request = createMockNextRequest('http://localhost:2222/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should prevent price manipulation', async () => {
      const { POST } = await import('@/app/api/payments/create/route');

      const request = createMockNextRequest('http://localhost:2222/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          userId: 'buyer123',
          amount: 1, // Trying to pay ₱1 for ₱299 product
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid amount');
    });
  });
});
