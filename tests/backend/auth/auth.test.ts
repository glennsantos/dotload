/**
 * ============================================================================
 * BACKEND TESTS - AUTHENTICATION API
 * ============================================================================
 * 
 * Tests for authentication API endpoints including:
 * - User login and registration
 * - Session management
 * - Password validation
 * - Error handling
 */

// Polyfill for TextEncoder/TextDecoder in Node.js test environment
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock jose before any imports
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    // @ts-ignore
    sign: jest.fn().mockResolvedValue('mock_jwt_token'),
  })),
  // @ts-ignore
  jwtVerify: jest.fn().mockResolvedValue({
    payload: { userId: 'user123', email: 'test@example.com' }
  }),
}));

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Declare global helper function
declare global {
  var createMockNextRequest: (url: string, init?: any) => any;
}

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: jest.fn() as jest.MockedFunction<any>,
    create: jest.fn() as jest.MockedFunction<any>,
    update: jest.fn() as jest.MockedFunction<any>,
  },
  $connect: jest.fn() as jest.MockedFunction<any>,
  $disconnect: jest.fn() as jest.MockedFunction<any>,
};

// Mock bcryptjs
const mockBcrypt = {
  hash: jest.fn() as jest.MockedFunction<any>,
  compare: jest.fn() as jest.MockedFunction<any>,
};

// Mock email service
const mockEmailService = {
  sendVerificationEmail: jest.fn() as jest.MockedFunction<any>,
  sendPasswordResetEmail: jest.fn() as jest.MockedFunction<any>,
};

// Mock Next.js cookies
const mockCookies = {
  set: jest.fn() as jest.MockedFunction<any>,
  get: jest.fn() as jest.MockedFunction<any>,
  delete: jest.fn() as jest.MockedFunction<any>,
};

// Apply mocks
jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('bcryptjs', () => mockBcrypt);
jest.mock('@/lib/email', () => mockEmailService);
jest.mock('next/headers', () => ({
  cookies: () => mockCookies,
}));

// Store authenticated user data for use across tests
let authenticatedUser: any = null;
let authToken: string = 'mock_jwt_token';

describe('Authentication API Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockBcrypt.hash.mockResolvedValue('hashed_password');
    mockBcrypt.compare.mockResolvedValue(true);
    mockPrisma.$connect.mockResolvedValue(undefined);
    mockPrisma.$disconnect.mockResolvedValue(undefined);
    
    // Set up default user for tests
    authenticatedUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password',
      emailVerified: true,
    };
    authToken = 'mock_jwt_token';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/auth/login - User Authentication', () => {
    it('should successfully authenticate user with valid credentials', async () => {
      // Mock user data
      mockPrisma.user.findUnique.mockResolvedValue(authenticatedUser);
      mockBcrypt.compare.mockResolvedValue(true);

      const { POST } = await import('@/app/api/auth/login/route');

      const request = createMockNextRequest('http://localhost:2222/api/auth/login', {
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

      expect(response.status).toBe(200);
      expect(data.message).toBe('Login successful');
      expect(data.user).toEqual({
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        name: authenticatedUser.name,
      });
      expect(data.token).toBe('mock_jwt_token');
      
      // Verify database calls
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
    });

    it('should reject login with invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(authenticatedUser);
      mockBcrypt.compare.mockResolvedValue(false);

      const { POST } = await import('@/app/api/auth/login/route');

      const request = createMockNextRequest('http://localhost:2222/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrong_password',
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

    it('should reject login for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const { POST } = await import('@/app/api/auth/login/route');

      const request = createMockNextRequest('http://localhost:2222/api/auth/login', {
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

    it('should reject login for unverified email', async () => {
      const unverifiedUser = {
        ...authenticatedUser,
        emailVerified: false,
      };
      
      mockPrisma.user.findUnique.mockResolvedValue(unverifiedUser);
      mockBcrypt.compare.mockResolvedValue(true);

      const { POST } = await import('@/app/api/auth/login/route');

      const request = createMockNextRequest('http://localhost:2222/api/auth/login', {
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

      const request = createMockNextRequest('http://localhost:2222/api/auth/login', {
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

      const request = createMockNextRequest('http://localhost:2222/api/auth/login', {
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

  describe('GET /api/auth/login - Method Not Allowed', () => {
    it('should return 405 for GET requests', async () => {
      const { GET } = await import('@/app/api/auth/login/route');

      const request = createMockNextRequest('http://localhost:2222/api/auth/login', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.message).toBe('Please use POST method for login');
    });
  });

  describe('Authentication State Management', () => {
    it('should store authenticated user data for subsequent tests', async () => {
      // This test ensures we have authenticated user data available
      expect(authenticatedUser).toBeDefined();
      expect(authenticatedUser.id).toBe('user123');
      expect(authenticatedUser.email).toBe('test@example.com');
      expect(authToken).toBe('mock_jwt_token');
    });

    it('should provide auth token for API requests', async () => {
      // This test verifies we can use the auth token in subsequent API calls
      expect(authToken).toBeDefined();
      expect(typeof authToken).toBe('string');
      expect(authToken.length).toBeGreaterThan(0);
    });
  });
});

// Export authenticated user data for use in other test files
export { authenticatedUser, authToken }; 