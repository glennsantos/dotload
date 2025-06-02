/**
 * ============================================================================
 * BACKEND TESTS - AUTHENTICATION
 * ============================================================================
 * 
 * Tests for authentication API endpoints including:
 * - User registration
 * - User login/sign in
 * - Session management
 * - Password reset
 * - Email verification
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

// Mock bcrypt
const mockBcrypt = {
  compare: jest.fn(),
  hash: jest.fn(),
};

// Mock JWT
const mockJWT = {
  sign: jest.fn(),
  verify: jest.fn(),
};

// Mock email service
const mockEmailService = {
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('bcryptjs', () => mockBcrypt);

jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
  jwtVerify: jest.fn(),
}));

jest.mock('@/lib/email', () => mockEmailService);

describe('Authentication API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env.JWT_SECRET = 'test-jwt-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login - Successful Sign In', () => {
    it('should successfully authenticate user with valid credentials', async () => {
      // Mock user data
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        emailVerified: true,
      };

      // Setup mocks
      mockPrisma.$connect.mockResolvedValue(undefined);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);

      // Import the login handler
      const { POST } = await import('@/app/api/auth/login/route');

      // Create mock request
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Execute the request
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.message).toBe('Login successful');
      expect(data.user).toEqual({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(data.token).toBeDefined();

      // Verify database calls
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
    });

    it('should set secure HTTP-only cookie with JWT token', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        emailVerified: true,
      };

      mockPrisma.$connect.mockResolvedValue(undefined);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);

      const { POST } = await import('@/app/api/auth/login/route');

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);

      // Check that Set-Cookie header is present
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toContain('token=');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('SameSite=lax');
    });
  });

  describe('POST /api/auth/login - Error Scenarios', () => {
    it('should reject login with invalid email', async () => {
      mockPrisma.$connect.mockResolvedValue(undefined);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const { POST } = await import('@/app/api/auth/login/route');

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password: 'hashed-password',
        emailVerified: true,
      };

      mockPrisma.$connect.mockResolvedValue(undefined);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      const { POST } = await import('@/app/api/auth/login/route');

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid email or password');
    });

    it('should reject login for unverified email', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password: 'hashed-password',
        emailVerified: false,
      };

      mockPrisma.$connect.mockResolvedValue(undefined);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);

      const { POST } = await import('@/app/api/auth/login/route');

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Email not verified');
      expect(data.requiresVerification).toBe(true);
      expect(data.email).toBe('test@example.com');
    });

    it('should handle missing credentials', async () => {
      const { POST } = await import('@/app/api/auth/login/route');

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: '',
          password: '',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and password are required');
    });

    it('should handle database connection errors', async () => {
      mockPrisma.$connect.mockRejectedValue(new Error('Database connection failed'));

      const { POST } = await import('@/app/api/auth/login/route');

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database connection error');
    });
  });

  describe('POST /api/auth/register - User Registration', () => {
    it('should successfully register a new user', async () => {
      const mockCreatedUser = {
        id: 'user123',
        email: 'newuser@example.com',
        name: 'New User',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);
      mockBcrypt.hash.mockResolvedValue('hashed-password');
      mockEmailService.sendVerificationEmail.mockResolvedValue(true);

      const { POST } = await import('@/app/api/auth/register/route');

      const formData = new FormData();
      formData.append('email', 'newuser@example.com');
      formData.append('password', 'password123');
      formData.append('name', 'New User');

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('User created successfully');
      expect(data.user).toEqual(mockCreatedUser);

      // Verify password was hashed
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12);

      // Verify verification email was sent
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should reject registration with existing email', async () => {
      const existingUser = {
        id: 'existing123',
        email: 'existing@example.com',
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      const { POST } = await import('@/app/api/auth/register/route');

      const formData = new FormData();
      formData.append('email', 'existing@example.com');
      formData.append('password', 'password123');

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User already exists');
    });
  });

  describe('GET /api/auth/check-session - Session Management', () => {
    it('should return user data for valid session', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };

      // Mock getCurrentUser function
      jest.doMock('@/lib/auth', () => ({
        getCurrentUser: jest.fn().mockResolvedValue(mockUser),
      }));

      const { GET } = await import('@/app/api/auth/check-session/route');

      const request = new NextRequest('http://localhost:3000/api/auth/check-session');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toEqual(mockUser);
    });

    it('should return null for invalid session', async () => {
      jest.doMock('@/lib/auth', () => ({
        getCurrentUser: jest.fn().mockResolvedValue(null),
      }));

      const { GET } = await import('@/app/api/auth/check-session/route');

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toBeNull();
    });
  });

  describe('POST /api/auth/logout - User Logout', () => {
    it('should successfully logout user and clear cookies', async () => {
      const { POST } = await import('@/app/api/auth/logout/route');

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Logged out successfully');

      // Check that cookie is cleared
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toContain('token=');
      expect(setCookieHeader).toContain('Max-Age=0');
    });
  });
}); 