/**
 * ============================================================================
 * UTILITY TESTS - EMAIL SERVICE
 * ============================================================================
 *
 * Tests for email service including:
 * - Email sending functionality
 * - Template rendering
 * - Verification emails
 * - Password reset emails
 * - Purchase confirmation emails
 * - Error handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock nodemailer
const mockTransporter = {
  sendMail: jest.fn(),
  verify: jest.fn(),
};

const mockNodemailer = {
  createTransport: jest.fn(() => mockTransporter),
};

jest.mock('nodemailer', () => mockNodemailer);

// Mock AWS SES
const mockSESClient = {
  send: jest.fn(),
};

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn(() => mockSESClient),
  SendEmailCommand: jest.fn((params) => params),
}));

describe('Email Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock implementations
    mockTransporter.sendMail.mockResolvedValue({
      messageId: 'test-message-id',
      accepted: ['recipient@example.com'],
      rejected: [],
    });

    mockTransporter.verify.mockResolvedValue(true);

    mockSESClient.send.mockResolvedValue({
      MessageId: 'aws-message-id',
    });

    // Set environment variables
    process.env.EMAIL_PROVIDER = 'smtp';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASS = 'password';
    process.env.FROM_EMAIL = 'noreply@dotload.com';
    process.env.FROM_NAME = 'Dotload';
  });

  describe('Email Sending', () => {
    it('should send email successfully via SMTP', async () => {
      const { sendEmail } = await import('@/lib/email');

      const result = await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.stringContaining('Dotload'),
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      });
    });

    it('should send email via AWS SES', async () => {
      process.env.EMAIL_PROVIDER = 'aws-ses';
      process.env.AWS_REGION = 'us-east-1';
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';

      const { sendEmail } = await import('@/lib/email');

      const result = await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(true);
      expect(mockSESClient.send).toHaveBeenCalled();
    });

    it('should handle email sending errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(
        new Error('SMTP connection failed')
      );

      const { sendEmail } = await import('@/lib/email');

      const result = await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate email addresses before sending', async () => {
      const { sendEmail } = await import('@/lib/email');

      const result = await sendEmail({
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email');
    });
  });

  describe('Verification Emails', () => {
    it('should send email verification email', async () => {
      const { sendVerificationEmail } = await import('@/lib/email');

      const result = await sendVerificationEmail({
        email: 'user@example.com',
        name: 'Test User',
        verificationToken: 'abc123xyz',
      });

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Verify'),
        })
      );
    });

    it('should include verification link in email', async () => {
      const { sendVerificationEmail } = await import('@/lib/email');

      await sendVerificationEmail({
        email: 'user@example.com',
        name: 'Test User',
        verificationToken: 'abc123xyz',
      });

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('abc123xyz');
      expect(emailCall.html).toContain('verify');
    });

    it('should include user name in verification email', async () => {
      const { sendVerificationEmail } = await import('@/lib/email');

      await sendVerificationEmail({
        email: 'user@example.com',
        name: 'John Doe',
        verificationToken: 'abc123xyz',
      });

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('John Doe');
    });
  });

  describe('Password Reset Emails', () => {
    it('should send password reset email', async () => {
      const { sendPasswordResetEmail } = await import('@/lib/email');

      const result = await sendPasswordResetEmail({
        email: 'user@example.com',
        name: 'Test User',
        resetToken: 'reset123xyz',
      });

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Password Reset'),
        })
      );
    });

    it('should include reset link in email', async () => {
      const { sendPasswordResetEmail } = await import('@/lib/email');

      await sendPasswordResetEmail({
        email: 'user@example.com',
        name: 'Test User',
        resetToken: 'reset123xyz',
      });

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('reset123xyz');
      expect(emailCall.html).toContain('reset-password');
    });

    it('should include expiration warning in reset email', async () => {
      const { sendPasswordResetEmail } = await import('@/lib/email');

      await sendPasswordResetEmail({
        email: 'user@example.com',
        name: 'Test User',
        resetToken: 'reset123xyz',
      });

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('expire');
    });
  });

  describe('Purchase Confirmation Emails', () => {
    it('should send purchase confirmation email', async () => {
      const { sendPurchaseConfirmationEmail } = await import('@/lib/email');

      const result = await sendPurchaseConfirmationEmail({
        email: 'buyer@example.com',
        name: 'Buyer Name',
        productName: 'Test Product',
        amount: 100,
        downloadUrl: 'https://example.com/download/abc123',
      });

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'buyer@example.com',
          subject: expect.stringContaining('Purchase Confirmation'),
        })
      );
    });

    it('should include product details in confirmation email', async () => {
      const { sendPurchaseConfirmationEmail } = await import('@/lib/email');

      await sendPurchaseConfirmationEmail({
        email: 'buyer@example.com',
        name: 'Buyer Name',
        productName: 'My E-book',
        amount: 299,
        downloadUrl: 'https://example.com/download/abc123',
      });

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('My E-book');
      expect(emailCall.html).toContain('299');
    });

    it('should include download link in confirmation email', async () => {
      const { sendPurchaseConfirmationEmail } = await import('@/lib/email');

      await sendPurchaseConfirmationEmail({
        email: 'buyer@example.com',
        name: 'Buyer Name',
        productName: 'Test Product',
        amount: 100,
        downloadUrl: 'https://example.com/download/abc123',
      });

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('download');
      expect(emailCall.html).toContain('abc123');
    });

    it('should format currency correctly in email', async () => {
      const { sendPurchaseConfirmationEmail } = await import('@/lib/email');

      await sendPurchaseConfirmationEmail({
        email: 'buyer@example.com',
        name: 'Buyer Name',
        productName: 'Test Product',
        amount: 1234.56,
        downloadUrl: 'https://example.com/download/abc123',
      });

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      // Should include PHP currency symbol
      expect(emailCall.html).toMatch(/₱|PHP/);
    });
  });

  describe('Email Templates', () => {
    it('should render email template with variables', async () => {
      const { renderEmailTemplate } = await import('@/lib/email');

      const html = renderEmailTemplate('welcome', {
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(html).toContain('John Doe');
      expect(html).toContain('welcome');
    });

    it('should include branding in email templates', async () => {
      const { renderEmailTemplate } = await import('@/lib/email');

      const html = renderEmailTemplate('welcome', {
        name: 'Test User',
      });

      expect(html).toContain('Dotload');
    });

    it('should escape HTML in template variables', async () => {
      const { renderEmailTemplate } = await import('@/lib/email');

      const html = renderEmailTemplate('welcome', {
        name: '<script>alert(1)</script>',
      });

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('Email Queue and Retry', () => {
    it('should retry failed email sends', async () => {
      mockTransporter.sendMail
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          messageId: 'test-message-id',
          accepted: ['recipient@example.com'],
        });

      const { sendEmailWithRetry } = await import('@/lib/email');

      const result = await sendEmailWithRetry({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      }, 2);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      mockTransporter.sendMail.mockRejectedValue(
        new Error('Permanent failure')
      );

      const { sendEmailWithRetry } = await import('@/lib/email');

      const result = await sendEmailWithRetry({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      }, 3);

      expect(result.success).toBe(false);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3);
    });
  });

  describe('Email Provider Configuration', () => {
    it('should use correct provider based on environment', async () => {
      process.env.EMAIL_PROVIDER = 'smtp';
      const { getEmailProvider } = await import('@/lib/email');

      const provider = getEmailProvider();
      expect(provider).toBe('smtp');
    });

    it('should validate SMTP configuration', async () => {
      const { validateEmailConfig } = await import('@/lib/email');

      process.env.EMAIL_PROVIDER = 'smtp';
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '587';

      const isValid = await validateEmailConfig();
      expect(isValid).toBe(true);
    });

    it('should fail validation with missing config', async () => {
      const { validateEmailConfig } = await import('@/lib/email');

      delete process.env.SMTP_HOST;

      const isValid = await validateEmailConfig();
      expect(isValid).toBe(false);
    });
  });

  describe('Email Rate Limiting', () => {
    it('should enforce rate limits per recipient', async () => {
      const { checkEmailRateLimit } = await import('@/lib/email');

      const email = 'user@example.com';

      // First 5 should pass
      for (let i = 0; i < 5; i++) {
        expect(await checkEmailRateLimit(email)).toBe(true);
      }

      // 6th should fail (assuming limit is 5 per hour)
      expect(await checkEmailRateLimit(email)).toBe(false);
    });
  });
});
