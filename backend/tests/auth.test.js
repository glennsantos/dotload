import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../server.js';

// Use an in-memory SQLite database for testing
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test_secret_key';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Ensure clean database before tests
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up and disconnect
  await prisma.$disconnect();
});

describe('Authentication API', () => {
  // Test user data
  const testUser = {
    email: 'test@example.com',
    password: 'securePassword123!',
    name: 'Test User'
  };

  // Clean up database before and after tests
  beforeAll(async () => {
    // Delete existing test user if exists
    await prisma.user.deleteMany({
      where: { email: testUser.email }
    });
  });

  afterAll(async () => {
    // Clean up and disconnect
    await prisma.user.deleteMany({
      where: { email: testUser.email }
    });
    await prisma.$disconnect();
  });

  // Registration Tests
  describe('User Registration', () => {
    it('should successfully register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject registration with existing email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Attempt duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email already in use');
    });

    it('should reject registration with invalid email', async () => {
      const invalidUser = {
        ...testUser,
        email: 'invalidemail'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid email format');
    });
  });

  // Login Tests
  describe('User Login', () => {
    beforeEach(async () => {
      // Ensure test user exists
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
    });

    it('should successfully login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongPassword'
        });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'somePassword'
        });

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  // Profile Tests
  describe('User Profile', () => {
    let authToken;

    beforeEach(async () => {
      // Register user and get login token
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      authToken = loginResponse.body.token;
    });

    it('should retrieve user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject profile retrieval without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('should reject profile retrieval with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('error', 'Failed to authenticate token');
    });
  });
});
