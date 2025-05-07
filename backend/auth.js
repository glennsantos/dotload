import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password Strength Validation
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid: 
      password.length >= minLength && 
      hasUpperCase && 
      hasLowerCase && 
      hasNumbers && 
      hasSpecialChar,
    requirements: [
      password.length < minLength && 'At least 8 characters long',
      !hasUpperCase && 'Contains an uppercase letter',
      !hasLowerCase && 'Contains a lowercase letter',
      !hasNumbers && 'Contains a number',
      !hasSpecialChar && 'Contains a special character'
    ].filter(Boolean)
  };
};

// User Registration
export const registerUser = async (req, res) => {
  const registrationStartTime = Date.now();
  const requestId = crypto.randomUUID(); // Add unique request tracking

  console.log(`[Registration Request] ID: ${requestId}, Timestamp: ${new Date().toISOString()}`);

  try {
    const { email, password, name } = req.body;
    console.log(`[Registration Request] Attempting to register email: ${email}, Request ID: ${requestId}`);

    // Validate email
    if (!emailRegex.test(email)) {
      console.warn(`[Registration Validation] Invalid email format: ${email}, Request ID: ${requestId}`);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      console.warn(`[Registration Validation] Weak password for email: ${email}, Request ID: ${requestId}`, {
        requirements: passwordValidation.requirements
      });
      return res.status(400).json({ 
        error: 'Password does not meet strength requirements',
        requirements: passwordValidation.requirements 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.warn(`[Registration Conflict] Email already in use: ${email}, Request ID: ${requestId}`);
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null  // Allow optional name
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    const registrationDuration = Date.now() - registrationStartTime;
    console.log(`[Registration Success] User registered: ${email}, User ID: ${user.id}, Request ID: ${requestId}, Duration: ${registrationDuration}ms`);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    console.error(`[Registration Error] Request ID: ${requestId}, Error:`, error);
    res.status(500).json({ 
      error: 'Registration failed', 
      details: error.message || 'An unexpected error occurred',
      requestId 
    });
  }
};

// User Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email format
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed', 
      details: error.message || 'An unexpected error occurred' 
    });
  }
};

// Authentication Middleware
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed', 
      details: error.message || 'An unexpected error occurred' 
    });
  }
};
// Duplicate function removed
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

// Authentication Middleware
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Failed to authenticate token' });
  }
};

// Get User Profile
export const getUserProfile = async (req, res) => {
  try {
    // req.user is set by authenticateToken middleware
    res.json(req.user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
  }
};
