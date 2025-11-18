/**
 * ============================================================================
 * INTEGRATION TESTS - COMPLETE PURCHASE FLOW
 * ============================================================================
 *
 * Tests the complete end-to-end purchase flow:
 * 1. Browse product
 * 2. Initiate checkout
 * 3. Create payment
 * 4. Process payment webhook
 * 5. Fulfill order
 * 6. Download digital file
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
  product: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  purchase: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  file: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  fileDownload: {
    create: jest.fn(),
    count: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
  },
  discountCode: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock Xendit
const mockXendit = {
  Invoice: {
    createInvoice: jest.fn(),
    getInvoice: jest.fn(),
  },
};

jest.mock('xendit-node', () => ({
  Xendit: jest.fn(() => mockXendit),
}));

// Mock email service
const mockEmailService = {
  sendPurchaseConfirmationEmail: jest.fn(),
};

jest.mock('@/lib/email', () => mockEmailService);

// Mock cloudinary
const mockCloudinary = {
  v2: {
    uploader: {
      upload: jest.fn(),
    },
  },
};

jest.mock('cloudinary', () => mockCloudinary);

describe('Complete Purchase Flow Integration Tests', () => {
  let productId: string;
  let buyerId: string;
  let sellerId: string;
  let purchaseId: string;
  let invoiceId: string;

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize test IDs
    productId = 'product_integration_123';
    buyerId = 'buyer_integration_123';
    sellerId = 'seller_integration_123';
    purchaseId = 'purchase_integration_123';
    invoiceId = 'invoice_integration_123';

    // Set up test data
    mockPrisma.product.findUnique.mockResolvedValue({
      id: productId,
      name: 'Integration Test E-book',
      description: 'A comprehensive test product',
      price: 499,
      userId: sellerId,
      published: true,
      downloadLimit: 3,
      linkExpiryDays: 7,
    });

    mockPrisma.user.findUnique.mockImplementation((args) => {
      if (args.where.id === buyerId) {
        return Promise.resolve({
          id: buyerId,
          email: 'buyer@integration.test',
          name: 'Test Buyer',
          emailVerified: true,
        });
      }
      if (args.where.id === sellerId) {
        return Promise.resolve({
          id: sellerId,
          email: 'seller@integration.test',
          name: 'Test Seller',
        });
      }
      return Promise.resolve(null);
    });

    mockPrisma.file.findMany.mockResolvedValue([
      {
        id: 'file123',
        productId,
        fileName: 'ebook.pdf',
        url: 'https://cloudinary.com/test/ebook.pdf',
        cloudinaryPublicId: 'test_ebook_id',
        fileSize: 1024000,
      },
    ]);

    mockXendit.Invoice.createInvoice.mockResolvedValue({
      id: invoiceId,
      external_id: purchaseId,
      invoice_url: `https://checkout.xendit.co/${invoiceId}`,
      status: 'PENDING',
      amount: 499,
    });

    mockPrisma.purchase.create.mockResolvedValue({
      id: purchaseId,
      userId: buyerId,
      productId,
      amount: 499,
      status: 'pending',
      accessCode: 'ACCESS_INTEGRATION_123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    mockEmailService.sendPurchaseConfirmationEmail.mockResolvedValue({
      success: true,
      messageId: 'email123',
    });

    mockPrisma.fileDownload.count.mockResolvedValue(0);
    mockPrisma.fileDownload.create.mockResolvedValue({
      id: 'download123',
      fileId: 'file123',
      purchaseId,
      downloadedAt: new Date(),
    });

    process.env.XENDIT_API_KEY = 'test-xendit-key';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:2222';
  });

  it('should complete full purchase flow successfully', async () => {
    // STEP 1: Browse product
    console.log('Step 1: Browse product');
    const productResult = await mockPrisma.product.findUnique({
      where: { id: productId },
    });

    expect(productResult).toBeDefined();
    expect(productResult.name).toBe('Integration Test E-book');
    expect(productResult.price).toBe(499);

    // STEP 2: Initiate checkout - Create payment
    console.log('Step 2: Initiate checkout');
    const { POST: createPayment } = await import('@/app/api/payments/create/route');

    const checkoutRequest = createMockNextRequest(
      'http://localhost:2222/api/payments/create',
      {
        method: 'POST',
        body: JSON.stringify({
          productId,
          userId: buyerId,
          amount: 499,
          customerEmail: 'buyer@integration.test',
          customerName: 'Test Buyer',
        }),
      }
    );

    const checkoutResponse = await createPayment(checkoutRequest);
    const checkoutData = await checkoutResponse.json();

    expect(checkoutResponse.status).toBe(200);
    expect(checkoutData.invoiceUrl).toContain('xendit.co');
    expect(checkoutData.invoiceId).toBe(invoiceId);

    // STEP 3: Simulate payment completion via webhook
    console.log('Step 3: Process payment webhook');
    mockPrisma.purchase.findUnique.mockResolvedValue({
      id: purchaseId,
      userId: buyerId,
      productId,
      amount: 499,
      status: 'pending',
      accessCode: 'ACCESS_INTEGRATION_123',
    });

    const { POST: webhookHandler } = await import('@/app/api/webhooks/xendit/route');

    const webhookRequest = createMockNextRequest(
      'http://localhost:2222/api/webhooks/xendit',
      {
        method: 'POST',
        body: JSON.stringify({
          id: invoiceId,
          external_id: purchaseId,
          status: 'PAID',
          amount: 499,
          paid_amount: 499,
          payment_channel: 'CREDIT_CARD',
        }),
      }
    );

    const webhookResponse = await webhookHandler(webhookRequest);
    expect(webhookResponse.status).toBe(200);

    // STEP 4: Verify order fulfillment
    console.log('Step 4: Verify order fulfillment');
    expect(mockPrisma.purchase.update).toHaveBeenCalledWith({
      where: { id: purchaseId },
      data: expect.objectContaining({
        status: 'completed',
      }),
    });

    expect(mockEmailService.sendPurchaseConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'buyer@integration.test',
        productName: 'Integration Test E-book',
      })
    );

    // STEP 5: Verify file download access
    console.log('Step 5: Test file download');
    mockPrisma.purchase.findUnique.mockResolvedValue({
      id: purchaseId,
      userId: buyerId,
      productId,
      status: 'completed',
      accessCode: 'ACCESS_INTEGRATION_123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      downloadLimit: 3,
    });

    mockPrisma.file.findUnique.mockResolvedValue({
      id: 'file123',
      productId,
      url: 'https://cloudinary.com/test/ebook.pdf',
    });

    const { POST: downloadFile } = await import('@/app/api/files/download/route');

    const downloadRequest = createMockNextRequest(
      'http://localhost:2222/api/files/download',
      {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'file123',
          accessCode: 'ACCESS_INTEGRATION_123',
        }),
      }
    );

    const downloadResponse = await downloadFile(downloadRequest);
    expect(downloadResponse.status).toBe(200);

    // Verify download was tracked
    expect(mockPrisma.fileDownload.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fileId: 'file123',
        purchaseId,
      }),
    });

    console.log('✓ Complete purchase flow test passed!');
  });

  it('should handle purchase with discount code', async () => {
    // Set up discount code
    mockPrisma.discountCode.findUnique.mockResolvedValue({
      id: 'discount123',
      code: 'TESTDISCOUNT',
      type: 'percentage',
      value: 20,
      active: true,
      usageLimit: 100,
      usageCount: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // STEP 1: Validate discount code
    const { POST: validateDiscount } = await import('@/app/api/discount-codes/validate/route');

    const validateRequest = createMockNextRequest(
      'http://localhost:2222/api/discount-codes/validate',
      {
        method: 'POST',
        body: JSON.stringify({
          code: 'TESTDISCOUNT',
          amount: 499,
        }),
      }
    );

    const validateResponse = await validateDiscount(validateRequest);
    const validateData = await validateResponse.json();

    expect(validateResponse.status).toBe(200);
    expect(validateData.valid).toBe(true);
    expect(validateData.discountedAmount).toBe(399); // 499 - 20% ≈ 399

    // STEP 2: Create payment with discount
    const { POST: createPayment } = await import('@/app/api/payments/create/route');

    const checkoutRequest = createMockNextRequest(
      'http://localhost:2222/api/payments/create',
      {
        method: 'POST',
        body: JSON.stringify({
          productId,
          userId: buyerId,
          amount: 399,
          discountCode: 'TESTDISCOUNT',
        }),
      }
    );

    const checkoutResponse = await createPayment(checkoutRequest);
    expect(checkoutResponse.status).toBe(200);

    // Verify Xendit invoice created with discounted amount
    expect(mockXendit.Invoice.createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 399,
      })
    );

    console.log('✓ Discount code purchase flow test passed!');
  });

  it('should enforce download limits', async () => {
    // Set up purchase with 3 download limit
    mockPrisma.purchase.findUnique.mockResolvedValue({
      id: purchaseId,
      userId: buyerId,
      productId,
      status: 'completed',
      accessCode: 'ACCESS_INTEGRATION_123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      product: {
        downloadLimit: 3,
      },
    });

    mockPrisma.file.findUnique.mockResolvedValue({
      id: 'file123',
      productId,
      url: 'https://cloudinary.com/test/ebook.pdf',
    });

    const { POST: downloadFile } = await import('@/app/api/files/download/route');

    // Download 1
    mockPrisma.fileDownload.count.mockResolvedValue(0);
    const download1 = await downloadFile(
      createMockNextRequest('http://localhost:2222/api/files/download', {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'file123',
          accessCode: 'ACCESS_INTEGRATION_123',
        }),
      })
    );
    expect(download1.status).toBe(200);

    // Download 2
    mockPrisma.fileDownload.count.mockResolvedValue(1);
    const download2 = await downloadFile(
      createMockNextRequest('http://localhost:2222/api/files/download', {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'file123',
          accessCode: 'ACCESS_INTEGRATION_123',
        }),
      })
    );
    expect(download2.status).toBe(200);

    // Download 3
    mockPrisma.fileDownload.count.mockResolvedValue(2);
    const download3 = await downloadFile(
      createMockNextRequest('http://localhost:2222/api/files/download', {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'file123',
          accessCode: 'ACCESS_INTEGRATION_123',
        }),
      })
    );
    expect(download3.status).toBe(200);

    // Download 4 - should fail (limit reached)
    mockPrisma.fileDownload.count.mockResolvedValue(3);
    const download4 = await downloadFile(
      createMockNextRequest('http://localhost:2222/api/files/download', {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'file123',
          accessCode: 'ACCESS_INTEGRATION_123',
        }),
      })
    );
    expect(download4.status).toBe(403);

    const download4Data = await download4.json();
    expect(download4Data.error).toContain('limit');

    console.log('✓ Download limit enforcement test passed!');
  });

  it('should reject expired access codes', async () => {
    // Set up expired purchase
    mockPrisma.purchase.findUnique.mockResolvedValue({
      id: purchaseId,
      userId: buyerId,
      productId,
      status: 'completed',
      accessCode: 'ACCESS_EXPIRED_123',
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
    });

    const { POST: downloadFile } = await import('@/app/api/files/download/route');

    const downloadRequest = createMockNextRequest(
      'http://localhost:2222/api/files/download',
      {
        method: 'POST',
        body: JSON.stringify({
          fileId: 'file123',
          accessCode: 'ACCESS_EXPIRED_123',
        }),
      }
    );

    const downloadResponse = await downloadFile(downloadRequest);
    const downloadData = await downloadResponse.json();

    expect(downloadResponse.status).toBe(403);
    expect(downloadData.error).toContain('expired');

    console.log('✓ Expired access code rejection test passed!');
  });

  it('should handle failed payment webhook', async () => {
    mockPrisma.purchase.findUnique.mockResolvedValue({
      id: purchaseId,
      status: 'pending',
    });

    const { POST: webhookHandler } = await import('@/app/api/webhooks/xendit/route');

    const webhookRequest = createMockNextRequest(
      'http://localhost:2222/api/webhooks/xendit',
      {
        method: 'POST',
        body: JSON.stringify({
          id: invoiceId,
          external_id: purchaseId,
          status: 'EXPIRED',
        }),
      }
    );

    const webhookResponse = await webhookHandler(webhookRequest);
    expect(webhookResponse.status).toBe(200);

    // Verify purchase status updated to failed/expired
    expect(mockPrisma.purchase.update).toHaveBeenCalledWith({
      where: { id: purchaseId },
      data: expect.objectContaining({
        status: expect.stringMatching(/expired|failed/i),
      }),
    });

    // Verify no confirmation email sent
    expect(mockEmailService.sendPurchaseConfirmationEmail).not.toHaveBeenCalled();

    console.log('✓ Failed payment handling test passed!');
  });
});
