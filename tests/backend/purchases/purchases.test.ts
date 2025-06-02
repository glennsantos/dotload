/**
 * ============================================================================
 * BACKEND TESTS - PURCHASE & PAYMENT PROCESSING
 * ============================================================================
 * 
 * Tests for purchase API endpoints including:
 * - Purchase creation and checkout flow
 * - Payment processing (cards, e-wallets, bank transfers)
 * - Order fulfillment and digital file delivery
 * - Discount codes and promotions
 * - Error handling and validation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock Prisma client
const mockPrisma = {
  product: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  purchase: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  discountCode: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Mock Xendit client
const mockXendit = {
  createInvoice: jest.fn(),
  createEWalletCharge: jest.fn(),
  createVirtualAccount: jest.fn(),
  getInvoiceStatus: jest.fn(),
};

// Mock email service
const mockEmailService = {
  sendPurchaseConfirmation: jest.fn(),
  sendDigitalDelivery: jest.fn(),
};

// Mock file utilities
const mockFileUtils = {
  generateDownloadToken: jest.fn(),
  createSecureDownloadLink: jest.fn(),
};

// Mock discount utilities
const mockDiscountUtils = {
  validateDiscountCode: jest.fn(),
  calculateDiscount: jest.fn(),
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('@/lib/xendit-client', () => mockXendit);

jest.mock('@/lib/email', () => mockEmailService);

jest.mock('@/lib/file-utils', () => mockFileUtils);

jest.mock('@/lib/discount-utils', () => mockDiscountUtils);

describe('Purchase & Payment Processing API Tests', () => {
  const mockProduct = {
    id: 'product123',
    name: 'Test Digital Product',
    type: 'digital_product',
    price: 2999, // PHP 29.99
    currency: 'PHP',
    published: true,
    stockQuantity: null,
    userId: 'seller123',
    files: [
      {
        id: 'file1',
        filename: 'product-file.pdf',
        url: 'https://cloudinary.com/file1.pdf',
        size: 1024000,
      },
    ],
  };

  const mockCustomer = {
    email: 'customer@example.com',
    name: 'Test Customer',
    phone: '+639123456789',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
    mockEmailService.sendPurchaseConfirmation.mockResolvedValue(true);
    mockEmailService.sendDigitalDelivery.mockResolvedValue(true);
    mockFileUtils.generateDownloadToken.mockReturnValue('download-token-123');
    mockFileUtils.createSecureDownloadLink.mockReturnValue('https://app.com/download/secure-link');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/purchases - Successful Purchase Flow', () => {
    it('should successfully create a purchase with credit card payment', async () => {
      const mockPurchase = {
        id: 'purchase123',
        productId: 'product123',
        customerEmail: 'customer@example.com',
        customerName: 'Test Customer',
        amount: 2999,
        currency: 'PHP',
        status: 'pending',
        paymentMethod: 'card',
        createdAt: new Date(),
      };

      const mockXenditInvoice = {
        id: 'xendit_invoice_123',
        external_id: 'purchase123',
        status: 'PENDING',
        invoice_url: 'https://checkout.xendit.co/web/invoice123',
        amount: 2999,
      };

      mockPrisma.purchase.create.mockResolvedValue(mockPurchase);
      mockXendit.createInvoice.mockResolvedValue(mockXenditInvoice);

      const { POST } = await import('@/app/api/purchases/route');

      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer',
          customerPhone: '+639123456789',
          paymentMethod: 'card',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.purchase.id).toBe('purchase123');
      expect(data.purchase.status).toBe('pending');
      expect(data.paymentUrl).toBe('https://checkout.xendit.co/web/invoice123');

      // Verify purchase was created
      expect(mockPrisma.purchase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId: 'product123',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer',
          amount: 2999,
          currency: 'PHP',
          paymentMethod: 'card',
          status: 'pending',
        }),
      });

      // Verify Xendit invoice was created
      expect(mockXendit.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          external_id: expect.stringContaining('purchase'),
          amount: 2999,
          currency: 'PHP',
          customer: expect.objectContaining({
            email: 'customer@example.com',
            given_names: 'Test Customer',
          }),
        })
      );
    });

    it('should successfully create a purchase with e-wallet payment', async () => {
      const mockPurchase = {
        id: 'purchase456',
        productId: 'product123',
        customerEmail: 'customer@example.com',
        amount: 2999,
        paymentMethod: 'grabpay',
        status: 'pending',
      };

      const mockEWalletCharge = {
        id: 'ewallet_charge_123',
        status: 'PENDING',
        actions: {
          desktop_web_checkout_url: 'https://grabpay.com/checkout/123',
          mobile_web_checkout_url: 'https://grabpay.com/mobile/123',
        },
      };

      mockPrisma.purchase.create.mockResolvedValue(mockPurchase);
      mockXendit.createEWalletCharge.mockResolvedValue(mockEWalletCharge);

      const { POST } = await import('@/app/api/purchases/route');

      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer',
          paymentMethod: 'grabpay',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.purchase.paymentMethod).toBe('grabpay');
      expect(data.paymentUrl).toBe('https://grabpay.com/checkout/123');

      // Verify e-wallet charge was created
      expect(mockXendit.createEWalletCharge).toHaveBeenCalledWith(
        expect.objectContaining({
          reference_id: expect.stringContaining('purchase'),
          currency: 'PHP',
          amount: 2999,
          checkout_method: 'ONE_TIME_PAYMENT',
          channel_code: 'ID_GRABPAY',
        })
      );
    });

    it('should successfully process a free product download', async () => {
      const freeProduct = {
        ...mockProduct,
        price: 0,
      };

      const mockFreePurchase = {
        id: 'purchase789',
        productId: 'product123',
        customerEmail: 'customer@example.com',
        amount: 0,
        status: 'completed',
        paymentMethod: 'free',
      };

      mockPrisma.product.findUnique.mockResolvedValue(freeProduct);
      mockPrisma.purchase.create.mockResolvedValue(mockFreePurchase);

      const { POST } = await import('@/app/api/purchases/route');

      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.purchase.status).toBe('completed');
      expect(data.purchase.amount).toBe(0);
      expect(data.downloadLinks).toBeDefined();

      // Verify no payment processing for free products
      expect(mockXendit.createInvoice).not.toHaveBeenCalled();
      expect(mockXendit.createEWalletCharge).not.toHaveBeenCalled();

      // Verify digital delivery email was sent
      expect(mockEmailService.sendDigitalDelivery).toHaveBeenCalled();
    });

    it('should apply discount codes correctly', async () => {
      const mockDiscountCode = {
        id: 'discount123',
        code: 'SAVE20',
        type: 'percentage',
        value: 20, // 20% off
        isActive: true,
        usageCount: 5,
        maxUsage: 100,
      };

      const discountedAmount = 2399; // 2999 - 20% = 2399

      mockDiscountUtils.validateDiscountCode.mockResolvedValue(mockDiscountCode);
      mockDiscountUtils.calculateDiscount.mockReturnValue({
        originalAmount: 2999,
        discountAmount: 600,
        finalAmount: discountedAmount,
      });

      const mockPurchase = {
        id: 'purchase_discount',
        amount: discountedAmount,
        discountCode: 'SAVE20',
        discountAmount: 600,
        status: 'pending',
      };

      mockPrisma.purchase.create.mockResolvedValue(mockPurchase);
      mockXendit.createInvoice.mockResolvedValue({
        id: 'invoice_discount',
        invoice_url: 'https://checkout.xendit.co/discount',
      });

      const { POST } = await import('@/app/api/purchases/route');

      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer',
          paymentMethod: 'card',
          discountCode: 'SAVE20',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.purchase.amount).toBe(discountedAmount);
      expect(data.purchase.discountAmount).toBe(600);
      expect(data.purchase.discountCode).toBe('SAVE20');

      // Verify discount validation was called
      expect(mockDiscountUtils.validateDiscountCode).toHaveBeenCalledWith('SAVE20');
      expect(mockDiscountUtils.calculateDiscount).toHaveBeenCalledWith(2999, mockDiscountCode);
    });
  });

  describe('POST /api/purchases - Error Scenarios', () => {
    it('should reject purchase of non-existent product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const { POST } = await import('@/app/api/purchases/route');

      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'nonexistent',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Product not found');
    });

    it('should reject purchase of unpublished product', async () => {
      const unpublishedProduct = {
        ...mockProduct,
        published: false,
      };

      mockPrisma.product.findUnique.mockResolvedValue(unpublishedProduct);

      const { POST } = await import('@/app/api/purchases/route');

      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Product is not available for purchase');
    });

    it('should reject purchase with insufficient stock', async () => {
      const physicalProduct = {
        ...mockProduct,
        type: 'physical_product',
        stockQuantity: 0,
      };

      mockPrisma.product.findUnique.mockResolvedValue(physicalProduct);

      const { POST } = await import('@/app/api/purchases/route');

      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer',
          quantity: 1,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Insufficient stock');
    });

    it('should reject purchase with invalid discount code', async () => {
      mockDiscountUtils.validateDiscountCode.mockRejectedValue(
        new Error('Invalid or expired discount code')
      );

      const { POST } = await import('@/app/api/purchases/route');

      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer',
          discountCode: 'INVALID',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('discount code');
    });

    it('should handle payment processing failures', async () => {
      mockPrisma.purchase.create.mockResolvedValue({
        id: 'purchase_failed',
        status: 'pending',
      });

      mockXendit.createInvoice.mockRejectedValue(
        new Error('Payment gateway error')
      );

      const { POST } = await import('@/app/api/purchases/route');

      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer',
          paymentMethod: 'card',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('payment processing');
    });

    it('should validate required customer information', async () => {
      const { POST } = await import('@/app/api/purchases/route');

      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product123',
          // Missing customerEmail and customerName
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });
  });

  describe('POST /api/webhooks/xendit - Payment Webhooks', () => {
    it('should handle successful payment webhook', async () => {
      const mockPurchase = {
        id: 'purchase123',
        status: 'pending',
        productId: 'product123',
        customerEmail: 'customer@example.com',
        amount: 2999,
      };

      const webhookPayload = {
        id: 'xendit_invoice_123',
        external_id: 'purchase123',
        status: 'PAID',
        amount: 2999,
        paid_amount: 2999,
        payment_method: 'CREDIT_CARD',
      };

      mockPrisma.purchase.findUnique.mockResolvedValue(mockPurchase);
      mockPrisma.purchase.update.mockResolvedValue({
        ...mockPurchase,
        status: 'completed',
      });

      const { POST } = await import('@/app/api/webhooks/xendit/route');

      const request = new NextRequest('http://localhost:3000/api/webhooks/xendit', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
        headers: {
          'Content-Type': 'application/json',
          'x-callback-token': 'valid-webhook-token',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify purchase status was updated
      expect(mockPrisma.purchase.update).toHaveBeenCalledWith({
        where: { id: 'purchase123' },
        data: { status: 'completed' },
      });

      // Verify confirmation email was sent
      expect(mockEmailService.sendPurchaseConfirmation).toHaveBeenCalled();
      expect(mockEmailService.sendDigitalDelivery).toHaveBeenCalled();
    });

    it('should handle failed payment webhook', async () => {
      const mockPurchase = {
        id: 'purchase456',
        status: 'pending',
      };

      const webhookPayload = {
        id: 'xendit_invoice_456',
        external_id: 'purchase456',
        status: 'EXPIRED',
      };

      mockPrisma.purchase.findUnique.mockResolvedValue(mockPurchase);
      mockPrisma.purchase.update.mockResolvedValue({
        ...mockPurchase,
        status: 'failed',
      });

      const { POST } = await import('@/app/api/webhooks/xendit/route');

      const request = new NextRequest('http://localhost:3000/api/webhooks/xendit', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
        headers: {
          'Content-Type': 'application/json',
          'x-callback-token': 'valid-webhook-token',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify purchase status was updated to failed
      expect(mockPrisma.purchase.update).toHaveBeenCalledWith({
        where: { id: 'purchase456' },
        data: { status: 'failed' },
      });
    });

    it('should reject webhooks with invalid tokens', async () => {
      const { POST } = await import('@/app/api/webhooks/xendit/route');

      const request = new NextRequest('http://localhost:3000/api/webhooks/xendit', {
        method: 'POST',
        body: JSON.stringify({ id: 'test' }),
        headers: {
          'Content-Type': 'application/json',
          'x-callback-token': 'invalid-token',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/purchases/[id] - Purchase Retrieval', () => {
    it('should retrieve purchase details with download links', async () => {
      const mockPurchase = {
        id: 'purchase123',
        status: 'completed',
        customerEmail: 'customer@example.com',
        amount: 2999,
        product: mockProduct,
      };

      mockPrisma.purchase.findUnique.mockResolvedValue(mockPurchase);

      const { GET } = await import('@/app/api/purchases/[id]/route');

      const request = new NextRequest('http://localhost:3000/api/purchases/purchase123');
      const response = await GET(request, { params: { id: 'purchase123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.purchase.id).toBe('purchase123');
      expect(data.purchase.status).toBe('completed');
      expect(data.downloadLinks).toBeDefined();

      // Verify secure download links were generated
      expect(mockFileUtils.createSecureDownloadLink).toHaveBeenCalled();
    });

    it('should return 404 for non-existent purchases', async () => {
      mockPrisma.purchase.findUnique.mockResolvedValue(null);

      const { GET } = await import('@/app/api/purchases/[id]/route');

      const request = new NextRequest('http://localhost:3000/api/purchases/nonexistent');
      const response = await GET(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Purchase not found');
    });
  });
}); 