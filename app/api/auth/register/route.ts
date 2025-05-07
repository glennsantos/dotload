import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

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

    // Validate email
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ 
        error: 'Password does not meet strength requirements',
        requirements: passwordValidation.requirements 
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
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

    return NextResponse.json({
      message: 'User registered successfully',
      user,
      token
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation
      if (error.code === 'P2002') {
        return NextResponse.json({ 
          error: 'Email already in use', 
          details: 'A user with this email already exists' 
        }, { status: 400 });
      }
    }

    return NextResponse.json({ 
      error: 'Registration failed', 
      details: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
