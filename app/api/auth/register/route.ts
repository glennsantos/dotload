import { NextRequest } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';
import { createErrorResponse, createSuccessResponse, ERROR_RESPONSES } from '@/lib/api-utils';

// Ensure dynamic rendering for this route
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password Strength Validation
const validatePasswordStrength = (password: string) => {
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

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    // Validate JWT_SECRET
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return ERROR_RESPONSES.serverError('Server configuration error');
    }

    // Validate email
    if (!emailRegex.test(email)) {
      return ERROR_RESPONSES.validationError('Invalid email format');
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return createErrorResponse(
        'Password does not meet requirements',
        400,
        { details: passwordValidation.requirements.join(', '), code: 'PASSWORD_REQUIREMENTS' }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return createErrorResponse(
        'Email already in use',
        400,
        { code: 'EMAIL_IN_USE' }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        verificationToken,
        verificationTokenExpiry,
        emailVerified: false // Explicitly set emailVerified to false
      },
      select: {
        id: true,
        email: true,
        name: true,
        verificationToken: true,
        verificationTokenExpiry: true
      }
    });

    // Send verification email in the background
    sendVerificationEmail(email, verificationToken, name || 'User')
      .catch(error => {
        console.error('Failed to send verification email:', error);
      });

    // Return success response without setting auth cookie
    return createSuccessResponse(
      { 
        message: 'User registered successfully. Please check your email to verify your account.',
        requiresVerification: true,
        userId: user.id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle Prisma-specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      // Unique constraint violation
      if (error.code === 'P2002') {
        return createErrorResponse(
          'Email already in use',
          400,
          { 
            details: 'A user with this email already exists',
            code: 'EMAIL_ALREADY_EXISTS'
          }
        );
      }
    }

    return ERROR_RESPONSES.serverError(
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
}
