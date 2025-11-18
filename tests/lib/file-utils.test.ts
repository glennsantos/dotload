/**
 * ============================================================================
 * UTILITY TESTS - FILE UTILITIES
 * ============================================================================
 *
 * Tests for file utility functions including:
 * - File upload to Cloudinary
 * - File validation (type, size)
 * - File deletion
 * - Error handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Cloudinary
const mockCloudinary = {
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
};

jest.mock('cloudinary', () => mockCloudinary);

describe('File Utilities Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock implementations
    mockCloudinary.v2.uploader.upload.mockResolvedValue({
      public_id: 'test_file_id',
      secure_url: 'https://res.cloudinary.com/test/upload/test_file.pdf',
      url: 'https://res.cloudinary.com/test/upload/test_file.pdf',
      bytes: 1024000,
      format: 'pdf',
      resource_type: 'raw',
    });

    mockCloudinary.v2.uploader.destroy.mockResolvedValue({
      result: 'ok'
    });

    mockCloudinary.v2.api.delete_resources.mockResolvedValue({
      deleted: { 'test_file_id': 'deleted' }
    });
  });

  describe('File Upload', () => {
    it('should successfully upload a valid file', async () => {
      const { uploadFile } = await import('@/lib/file-utils');

      const mockFile = new Blob(['test file content'], { type: 'application/pdf' });
      const file = new File([mockFile], 'test.pdf', { type: 'application/pdf' });

      const result = await uploadFile(file, 'products');

      expect(result).toHaveProperty('public_id');
      expect(result).toHaveProperty('url');
      expect(result.url).toContain('cloudinary.com');
      expect(mockCloudinary.v2.uploader.upload).toHaveBeenCalled();
    });

    it('should handle upload errors gracefully', async () => {
      const { uploadFile } = await import('@/lib/file-utils');

      mockCloudinary.v2.uploader.upload.mockRejectedValue(
        new Error('Upload failed')
      );

      const mockFile = new Blob(['test file content'], { type: 'application/pdf' });
      const file = new File([mockFile], 'test.pdf', { type: 'application/pdf' });

      await expect(uploadFile(file, 'products')).rejects.toThrow();
    });

    it('should upload with correct folder path', async () => {
      const { uploadFile } = await import('@/lib/file-utils');

      const mockFile = new Blob(['test file content'], { type: 'application/pdf' });
      const file = new File([mockFile], 'test.pdf', { type: 'application/pdf' });

      await uploadFile(file, 'products');

      expect(mockCloudinary.v2.uploader.upload).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          folder: expect.stringContaining('products')
        })
      );
    });
  });

  describe('File Deletion', () => {
    it('should successfully delete a file by public_id', async () => {
      const { deleteFile } = await import('@/lib/file-utils');

      const result = await deleteFile('test_file_id');

      expect(result).toBe(true);
      expect(mockCloudinary.v2.uploader.destroy).toHaveBeenCalledWith('test_file_id');
    });

    it('should handle deletion errors', async () => {
      const { deleteFile } = await import('@/lib/file-utils');

      mockCloudinary.v2.uploader.destroy.mockRejectedValue(
        new Error('Deletion failed')
      );

      await expect(deleteFile('test_file_id')).rejects.toThrow();
    });

    it('should return false for non-existent file', async () => {
      const { deleteFile } = await import('@/lib/file-utils');

      mockCloudinary.v2.uploader.destroy.mockResolvedValue({
        result: 'not found'
      });

      const result = await deleteFile('non_existent_id');

      expect(result).toBe(false);
    });
  });

  describe('File Validation', () => {
    it('should validate allowed file types', async () => {
      const { validateFileType } = await import('@/lib/file-validation');

      expect(validateFileType('test.pdf', ['pdf', 'doc'])).toBe(true);
      expect(validateFileType('test.jpg', ['jpg', 'png'])).toBe(true);
    });

    it('should reject disallowed file types', async () => {
      const { validateFileType } = await import('@/lib/file-validation');

      expect(validateFileType('test.exe', ['pdf', 'doc'])).toBe(false);
      expect(validateFileType('test.sh', ['jpg', 'png'])).toBe(false);
    });

    it('should validate file size limits', async () => {
      const { validateFileSize } = await import('@/lib/file-validation');

      const maxSize = 5 * 1024 * 1024; // 5MB

      expect(validateFileSize(1024000, maxSize)).toBe(true); // 1MB < 5MB
      expect(validateFileSize(6 * 1024 * 1024, maxSize)).toBe(false); // 6MB > 5MB
    });

    it('should validate file extension case-insensitively', async () => {
      const { validateFileType } = await import('@/lib/file-validation');

      expect(validateFileType('test.PDF', ['pdf'])).toBe(true);
      expect(validateFileType('test.Jpg', ['jpg'])).toBe(true);
    });
  });

  describe('File Metadata', () => {
    it('should extract file extension correctly', async () => {
      const { getFileExtension } = await import('@/lib/file-validation');

      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('image.jpg')).toBe('jpg');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('should handle files without extension', async () => {
      const { getFileExtension } = await import('@/lib/file-validation');

      expect(getFileExtension('README')).toBe('');
      expect(getFileExtension('Makefile')).toBe('');
    });

    it('should get MIME type from file extension', async () => {
      const { getMimeType } = await import('@/lib/file-validation');

      expect(getMimeType('pdf')).toBe('application/pdf');
      expect(getMimeType('jpg')).toBe('image/jpeg');
      expect(getMimeType('png')).toBe('image/png');
    });
  });

  describe('File Security', () => {
    it('should sanitize file names', async () => {
      const { sanitizeFileName } = await import('@/lib/file-validation');

      expect(sanitizeFileName('../../../etc/passwd')).not.toContain('..');
      expect(sanitizeFileName('file name with spaces.pdf')).not.toContain(' ');
      expect(sanitizeFileName('special!@#$%chars.pdf')).toMatch(/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/);
    });

    it('should reject potentially dangerous file names', async () => {
      const { isSecureFileName } = await import('@/lib/file-validation');

      expect(isSecureFileName('../../etc/passwd')).toBe(false);
      expect(isSecureFileName('normal-file.pdf')).toBe(true);
      expect(isSecureFileName('<script>alert(1)</script>.pdf')).toBe(false);
    });

    it('should prevent path traversal attacks', async () => {
      const { sanitizeFilePath } = await import('@/lib/file-validation');

      const maliciousPath = '../../../etc/passwd';
      const sanitized = sanitizeFilePath(maliciousPath);

      expect(sanitized).not.toContain('..');
      expect(sanitized).not.toContain('/etc/');
    });
  });
});
