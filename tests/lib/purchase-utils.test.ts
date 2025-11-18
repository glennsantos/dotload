/**
 * ============================================================================
 * UTILITY TESTS - PURCHASE UTILITIES
 * ============================================================================
 *
 * Tests for purchase utility functions including:
 * - Purchase creation
 * - Order fulfillment
 * - Payment validation
 * - Digital file delivery
 * - Purchase status management
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Prisma
const mockPrisma = {
  purchase: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
  },
  file: {
    findMany: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock email service
const mockEmailService = {
  sendPurchaseConfirmationEmail: jest.fn(),
};

jest.mock('@/lib/email', () => mockEmailService);

// Mock download utils
const mockDownloadUtils = {
  generateAccessCode: jest.fn(() => 'ACCESS123XYZ'),
  calculateExpirationDate: jest.fn(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  generateDownloadLink: jest.fn(() => 'https://example.com/download/ACCESS123XYZ'),
};

jest.mock('@/lib/download-utils', () => mockDownloadUtils);

describe('Purchase Utilities Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock implementations
    mockPrisma.product.findUnique.mockResolvedValue({
      id: 'product123',
      name: 'Test Product',
      price: 299,
      userId: 'seller123',
      downloadLimit: 5,
      linkExpiryDays: 7,
    });

    mockPrisma.file.findMany.mockResolvedValue([
      {
        id: 'file123',
        productId: 'product123',
        url: 'https://cloudinary.com/test/file.pdf',
        fileName: 'product.pdf',
      },
    ]);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'buyer123',
      email: 'buyer@example.com',
      name: 'Buyer Name',
    });

    mockPrisma.purchase.create.mockResolvedValue({
      id: 'purchase123',
      userId: 'buyer123',
      productId: 'product123',
      amount: 299,
      status: 'completed',
      accessCode: 'ACCESS123XYZ',
      createdAt: new Date(),
    });

    mockPrisma.transaction.create.mockResolvedValue({
      id: 'transaction123',
      purchaseId: 'purchase123',
      amount: 299,
      type: 'sale',
    });

    mockEmailService.sendPurchaseConfirmationEmail.mockResolvedValue({
      success: true,
    });
  });

  describe('Purchase Creation', () => {
    it('should create purchase successfully', async () => {
      const { createPurchase } = await import('@/lib/purchase-utils');

      const purchase = await createPurchase({
        userId: 'buyer123',
        productId: 'product123',
        amount: 299,
        paymentId: 'payment123',
      });

      expect(purchase).toBeDefined();
      expect(purchase.id).toBe('purchase123');
      expect(mockPrisma.purchase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'buyer123',
          productId: 'product123',
          amount: 299,
        }),
      });
    });

    it('should generate access code on purchase', async () => {
      const { createPurchase } = await import('@/lib/purchase-utils');

      await createPurchase({
        userId: 'buyer123',
        productId: 'product123',
        amount: 299,
      });

      expect(mockDownloadUtils.generateAccessCode).toHaveBeenCalled();
    });

    it('should set expiration date on purchase', async () => {
      const { createPurchase } = await import('@/lib/purchase-utils');

      await createPurchase({
        userId: 'buyer123',
        productId: 'product123',
        amount: 299,
      });

      expect(mockDownloadUtils.calculateExpirationDate).toHaveBeenCalled();
    });

    it('should create transaction record', async () => {
      const { createPurchase } = await import('@/lib/purchase-utils');

      await createPurchase({
        userId: 'buyer123',
        productId: 'product123',
        amount: 299,
        paymentId: 'payment123',
      });

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          purchaseId: 'purchase123',
          amount: 299,
          type: 'sale',
        }),
      });
    });

    it('should validate product exists before purchase', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const { createPurchase } = await import('@/lib/purchase-utils');

      await expect(
        createPurchase({
          userId: 'buyer123',
          productId: 'nonexistent',
          amount: 299,
        })
      ).rejects.toThrow('Product not found');
    });

    it('should validate purchase amount matches product price', async () => {
      const { createPurchase } = await import('@/lib/purchase-utils');

      await expect(
        createPurchase({
          userId: 'buyer123',
          productId: 'product123',
          amount: 100, // Different from product price 299
        })
      ).rejects.toThrow('Invalid amount');
    });
  });

  describe('Order Fulfillment', () => {
    it('should fulfill order after successful payment', async () => {
      const { fulfillOrder } = await import('@/lib/purchase-utils');

      const result = await fulfillOrder('purchase123');

      expect(result.success).toBe(true);
      expect(mockEmailService.sendPurchaseConfirmationEmail).toHaveBeenCalled();
    });

    it('should send confirmation email with download link', async () => {
      const { fulfillOrder } = await import('@/lib/purchase-utils');

      mockPrisma.purchase.findUnique.mockResolvedValue({
        id: 'purchase123',
        userId: 'buyer123',
        productId: 'product123',
        accessCode: 'ACCESS123XYZ',
        status: 'completed',
      });

      await fulfillOrder('purchase123');

      expect(mockEmailService.sendPurchaseConfirmationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'buyer@example.com',
          productName: 'Test Product',
          downloadUrl: expect.stringContaining('download'),
        })
      );
    });

    it('should update purchase status to completed', async () => {
      const { fulfillOrder } = await import('@/lib/purchase-utils');

      mockPrisma.purchase.findUnique.mockResolvedValue({
        id: 'purchase123',
        status: 'pending',
      });

      await fulfillOrder('purchase123');

      expect(mockPrisma.purchase.update).toHaveBeenCalledWith({
        where: { id: 'purchase123' },
        data: expect.objectContaining({
          status: 'completed',
        }),
      });
    });

    it('should handle fulfillment errors gracefully', async () => {
      mockEmailService.sendPurchaseConfirmationEmail.mockRejectedValue(
        new Error('Email service unavailable')
      );

      const { fulfillOrder } = await import('@/lib/purchase-utils');

      const result = await fulfillOrder('purchase123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Payment Validation', () => {
    it('should validate payment amount', async () => {
      const { validatePayment } = await import('@/lib/purchase-utils');

      const result = await validatePayment({
        productId: 'product123',
        amount: 299,
      });

      expect(result.valid).toBe(true);
    });

    it('should reject mismatched payment amount', async () => {
      const { validatePayment } = await import('@/lib/purchase-utils');

      const result = await validatePayment({
        productId: 'product123',
        amount: 100, // Product price is 299
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('amount');
    });

    it('should validate payment status', async () => {
      const { validatePaymentStatus } = await import('@/lib/purchase-utils');

      expect(validatePaymentStatus('succeeded')).toBe(true);
      expect(validatePaymentStatus('completed')).toBe(true);
      expect(validatePaymentStatus('failed')).toBe(false);
      expect(validatePaymentStatus('pending')).toBe(false);
    });
  });

  describe('Purchase Status Management', () => {
    it('should update purchase status', async () => {
      const { updatePurchaseStatus } = await import('@/lib/purchase-utils');

      await updatePurchaseStatus('purchase123', 'completed');

      expect(mockPrisma.purchase.update).toHaveBeenCalledWith({
        where: { id: 'purchase123' },
        data: { status: 'completed' },
      });
    });

    it('should get purchase by access code', async () => {
      mockPrisma.purchase.findUnique.mockResolvedValue({
        id: 'purchase123',
        accessCode: 'ACCESS123XYZ',
        userId: 'buyer123',
      });

      const { getPurchaseByAccessCode } = await import('@/lib/purchase-utils');

      const purchase = await getPurchaseByAccessCode('ACCESS123XYZ');

      expect(purchase).toBeDefined();
      expect(purchase.id).toBe('purchase123');
    });

    it('should get user purchase history', async () => {
      mockPrisma.purchase.findMany.mockResolvedValue([
        {
          id: 'purchase1',
          userId: 'buyer123',
          createdAt: new Date(),
        },
        {
          id: 'purchase2',
          userId: 'buyer123',
          createdAt: new Date(),
        },
      ]);

      const { getPurchaseHistory } = await import('@/lib/purchase-utils');

      const history = await getPurchaseHistory('buyer123');

      expect(history).toHaveLength(2);
      expect(mockPrisma.purchase.findMany).toHaveBeenCalledWith({
        where: { userId: 'buyer123' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('Discount Application', () => {
    it('should apply percentage discount to purchase', async () => {
      const { applyDiscount } = await import('@/lib/purchase-utils');

      const discountedAmount = applyDiscount(100, {
        type: 'percentage',
        value: 10,
      });

      expect(discountedAmount).toBe(90);
    });

    it('should apply fixed discount to purchase', async () => {
      const { applyDiscount } = await import('@/lib/purchase-utils');

      const discountedAmount = applyDiscount(100, {
        type: 'fixed',
        value: 20,
      });

      expect(discountedAmount).toBe(80);
    });

    it('should not allow negative final amount', async () => {
      const { applyDiscount } = await import('@/lib/purchase-utils');

      const discountedAmount = applyDiscount(50, {
        type: 'fixed',
        value: 100,
      });

      expect(discountedAmount).toBe(0);
    });

    it('should validate discount code usage limit', async () => {
      const { validateDiscountCodeUsage } = await import('@/lib/purchase-utils');

      const result = await validateDiscountCodeUsage({
        code: 'SAVE20',
        userId: 'buyer123',
        usageLimit: 1,
        currentUsage: 0,
      });

      expect(result.valid).toBe(true);
    });

    it('should reject discount code over usage limit', async () => {
      const { validateDiscountCodeUsage } = await import('@/lib/purchase-utils');

      const result = await validateDiscountCodeUsage({
        code: 'SAVE20',
        userId: 'buyer123',
        usageLimit: 1,
        currentUsage: 1,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('limit');
    });
  });

  describe('Refund Processing', () => {
    it('should process refund for purchase', async () => {
      const { processRefund } = await import('@/lib/purchase-utils');

      mockPrisma.purchase.findUnique.mockResolvedValue({
        id: 'purchase123',
        amount: 299,
        status: 'completed',
      });

      const result = await processRefund('purchase123', 'Customer request');

      expect(result.success).toBe(true);
      expect(mockPrisma.purchase.update).toHaveBeenCalledWith({
        where: { id: 'purchase123' },
        data: expect.objectContaining({
          status: 'refunded',
        }),
      });
    });

    it('should create refund transaction', async () => {
      const { processRefund } = await import('@/lib/purchase-utils');

      mockPrisma.purchase.findUnique.mockResolvedValue({
        id: 'purchase123',
        amount: 299,
        status: 'completed',
      });

      await processRefund('purchase123', 'Customer request');

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'refund',
          amount: 299,
        }),
      });
    });

    it('should not refund already refunded purchase', async () => {
      const { processRefund } = await import('@/lib/purchase-utils');

      mockPrisma.purchase.findUnique.mockResolvedValue({
        id: 'purchase123',
        status: 'refunded',
      });

      await expect(
        processRefund('purchase123', 'Duplicate refund')
      ).rejects.toThrow('already refunded');
    });
  });

  describe('Purchase Analytics', () => {
    it('should calculate total sales for product', async () => {
      mockPrisma.purchase.findMany.mockResolvedValue([
        { amount: 100 },
        { amount: 200 },
        { amount: 300 },
      ]);

      const { calculateTotalSales } = await import('@/lib/purchase-utils');

      const total = await calculateTotalSales('product123');

      expect(total).toBe(600);
    });

    it('should get purchase count for product', async () => {
      const { getPurchaseCount } = await import('@/lib/purchase-utils');

      mockPrisma.purchase.findMany.mockResolvedValue([
        { id: 'p1' },
        { id: 'p2' },
        { id: 'p3' },
      ]);

      const count = await getPurchaseCount('product123');

      expect(count).toBe(3);
    });
  });
});
