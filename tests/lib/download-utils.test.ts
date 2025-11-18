/**
 * ============================================================================
 * UTILITY TESTS - DOWNLOAD UTILITIES
 * ============================================================================
 *
 * Tests for download utility functions including:
 * - Download link generation
 * - Access code validation
 * - Download limit enforcement
 * - Link expiration
 * - Download tracking
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Prisma
const mockPrisma = {
  fileDownload: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  purchase: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
  },
  file: {
    findUnique: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

describe('Download Utilities Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock implementations
    mockPrisma.purchase.findUnique.mockResolvedValue({
      id: 'purchase123',
      userId: 'user123',
      productId: 'product123',
      accessCode: 'ACCESS123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      downloadLimit: 5,
    });

    mockPrisma.product.findUnique.mockResolvedValue({
      id: 'product123',
      name: 'Test Product',
      downloadLimit: 5,
      linkExpiryDays: 7,
    });

    mockPrisma.file.findUnique.mockResolvedValue({
      id: 'file123',
      productId: 'product123',
      url: 'https://cloudinary.com/test/file.pdf',
      cloudinaryPublicId: 'test_file_id',
    });

    mockPrisma.fileDownload.count.mockResolvedValue(0);
    mockPrisma.fileDownload.create.mockResolvedValue({
      id: 'download123',
      fileId: 'file123',
      purchaseId: 'purchase123',
      downloadedAt: new Date(),
    });
  });

  describe('Download Link Generation', () => {
    it('should generate valid download link', async () => {
      const { generateDownloadLink } = await import('@/lib/download-utils');

      const link = await generateDownloadLink({
        purchaseId: 'purchase123',
        fileId: 'file123',
        accessCode: 'ACCESS123',
      });

      expect(link).toContain('/api/files/download');
      expect(link).toContain('ACCESS123');
      expect(link).toContain('file123');
    });

    it('should include expiration in download link', async () => {
      const { generateDownloadLink } = await import('@/lib/download-utils');

      const link = await generateDownloadLink({
        purchaseId: 'purchase123',
        fileId: 'file123',
        accessCode: 'ACCESS123',
      });

      expect(link).toContain('expires');
    });

    it('should generate unique access codes', async () => {
      const { generateAccessCode } = await import('@/lib/download-utils');

      const code1 = generateAccessCode();
      const code2 = generateAccessCode();

      expect(code1).not.toBe(code2);
      expect(code1.length).toBeGreaterThan(10);
      expect(code2.length).toBeGreaterThan(10);
    });

    it('should generate secure access codes', async () => {
      const { generateAccessCode } = await import('@/lib/download-utils');

      const code = generateAccessCode();

      // Should be alphanumeric
      expect(code).toMatch(/^[A-Z0-9]+$/);
      // Should be reasonably long for security
      expect(code.length).toBeGreaterThanOrEqual(16);
    });
  });

  describe('Access Code Validation', () => {
    it('should validate correct access code', async () => {
      const { validateAccessCode } = await import('@/lib/download-utils');

      const result = await validateAccessCode('ACCESS123', 'purchase123');

      expect(result.valid).toBe(true);
      expect(result.purchase).toBeDefined();
    });

    it('should reject incorrect access code', async () => {
      mockPrisma.purchase.findUnique.mockResolvedValue(null);

      const { validateAccessCode } = await import('@/lib/download-utils');

      const result = await validateAccessCode('WRONG123', 'purchase123');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject access code for different purchase', async () => {
      const { validateAccessCode } = await import('@/lib/download-utils');

      const result = await validateAccessCode('ACCESS123', 'different_purchase');

      expect(result.valid).toBe(false);
    });

    it('should validate access code expiration', async () => {
      const expiredPurchase = {
        id: 'purchase123',
        accessCode: 'ACCESS123',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      };

      mockPrisma.purchase.findUnique.mockResolvedValue(expiredPurchase);

      const { validateAccessCode } = await import('@/lib/download-utils');

      const result = await validateAccessCode('ACCESS123', 'purchase123');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  describe('Download Limit Enforcement', () => {
    it('should allow download within limit', async () => {
      mockPrisma.fileDownload.count.mockResolvedValue(2); // 2 out of 5

      const { checkDownloadLimit } = await import('@/lib/download-utils');

      const result = await checkDownloadLimit('purchase123', 'file123');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3);
    });

    it('should reject download when limit reached', async () => {
      mockPrisma.fileDownload.count.mockResolvedValue(5); // 5 out of 5

      const { checkDownloadLimit } = await import('@/lib/download-utils');

      const result = await checkDownloadLimit('purchase123', 'file123');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.error).toContain('limit');
    });

    it('should handle unlimited downloads', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'product123',
        downloadLimit: null, // Unlimited
      });

      const { checkDownloadLimit } = await import('@/lib/download-utils');

      const result = await checkDownloadLimit('purchase123', 'file123');

      expect(result.allowed).toBe(true);
      expect(result.unlimited).toBe(true);
    });

    it('should track download count accurately', async () => {
      const { trackDownload } = await import('@/lib/download-utils');

      await trackDownload({
        fileId: 'file123',
        purchaseId: 'purchase123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(mockPrisma.fileDownload.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fileId: 'file123',
          purchaseId: 'purchase123',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      });
    });
  });

  describe('Link Expiration', () => {
    it('should calculate correct expiration date', async () => {
      const { calculateExpirationDate } = await import('@/lib/download-utils');

      const expiryDays = 7;
      const expirationDate = calculateExpirationDate(expiryDays);

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + expiryDays);

      expect(expirationDate.getDate()).toBe(expectedDate.getDate());
    });

    it('should check if link is expired', async () => {
      const { isLinkExpired } = await import('@/lib/download-utils');

      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      expect(isLinkExpired(futureDate)).toBe(false);
      expect(isLinkExpired(pastDate)).toBe(true);
    });

    it('should extend expiration date', async () => {
      const { extendExpiration } = await import('@/lib/download-utils');

      await extendExpiration('purchase123', 7);

      expect(mockPrisma.purchase.update).toHaveBeenCalledWith({
        where: { id: 'purchase123' },
        data: {
          expiresAt: expect.any(Date),
        },
      });
    });
  });

  describe('Download Tracking', () => {
    it('should track download metadata', async () => {
      const { trackDownload } = await import('@/lib/download-utils');

      await trackDownload({
        fileId: 'file123',
        purchaseId: 'purchase123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      });

      expect(mockPrisma.fileDownload.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fileId: 'file123',
          purchaseId: 'purchase123',
          ipAddress: '192.168.1.1',
          userAgent: expect.stringContaining('Mozilla'),
          downloadedAt: expect.any(Date),
        }),
      });
    });

    it('should get download history', async () => {
      mockPrisma.fileDownload.findMany.mockResolvedValue([
        {
          id: 'download1',
          fileId: 'file123',
          downloadedAt: new Date('2024-01-01'),
        },
        {
          id: 'download2',
          fileId: 'file123',
          downloadedAt: new Date('2024-01-02'),
        },
      ]);

      const { getDownloadHistory } = await import('@/lib/download-utils');

      const history = await getDownloadHistory('purchase123');

      expect(history).toHaveLength(2);
      expect(history[0].id).toBe('download1');
    });

    it('should get download statistics', async () => {
      mockPrisma.fileDownload.count.mockResolvedValue(10);

      const { getDownloadStats } = await import('@/lib/download-utils');

      const stats = await getDownloadStats('product123');

      expect(stats.totalDownloads).toBe(10);
    });
  });

  describe('Download Security', () => {
    it('should prevent unauthorized downloads', async () => {
      mockPrisma.purchase.findUnique.mockResolvedValue(null);

      const { authorizeDownload } = await import('@/lib/download-utils');

      const result = await authorizeDownload({
        accessCode: 'INVALID',
        fileId: 'file123',
      });

      expect(result.authorized).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should verify file belongs to purchase', async () => {
      mockPrisma.file.findUnique.mockResolvedValue({
        id: 'file123',
        productId: 'different_product',
      });

      const { authorizeDownload } = await import('@/lib/download-utils');

      const result = await authorizeDownload({
        accessCode: 'ACCESS123',
        fileId: 'file123',
      });

      expect(result.authorized).toBe(false);
      expect(result.error).toContain('not authorized');
    });

    it('should sanitize download URLs', async () => {
      const { sanitizeDownloadUrl } = await import('@/lib/download-utils');

      const maliciousUrl = 'https://evil.com/../../etc/passwd';
      const sanitized = sanitizeDownloadUrl(maliciousUrl);

      expect(sanitized).not.toContain('..');
      expect(sanitized).not.toContain('/etc/');
    });
  });

  describe('Download URL Generation', () => {
    it('should generate signed download URL', async () => {
      const { generateSignedUrl } = await import('@/lib/download-utils');

      const url = await generateSignedUrl('file123', 'ACCESS123', 3600);

      expect(url).toContain('signature');
      expect(url).toContain('expires');
    });

    it('should verify signed URL', async () => {
      const { generateSignedUrl, verifySignedUrl } = await import('@/lib/download-utils');

      const url = await generateSignedUrl('file123', 'ACCESS123', 3600);

      const isValid = await verifySignedUrl(url);
      expect(isValid).toBe(true);
    });

    it('should reject tampered signed URLs', async () => {
      const { verifySignedUrl } = await import('@/lib/download-utils');

      const tamperedUrl = 'https://example.com/download?file=file123&signature=invalid';

      const isValid = await verifySignedUrl(tamperedUrl);
      expect(isValid).toBe(false);
    });
  });
});
