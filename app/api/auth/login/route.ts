import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from "@/lib/prisma";
import { createErrorResponse, createSuccessResponse, ERROR_RESPONSES } from '@/lib/api-utils';

// Ensure dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Enable more verbose logging
const DEBUG = process.env.NODE_ENV !== 'production';
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
};

const JWT_SECRET = process.env.JWT_SECRET?.trim();

export async function POST(req: NextRequest) {
  try {
    debugLog('Login process starting');
    
    // Validate JWT_SECRET
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return ERROR_RESPONSES.serverError('Server configuration error');
    }

    // Log database connection status
    try {
      debugLog('Attempting to connect to PostgreSQL database');
      await prisma.$connect();
      debugLog('PostgreSQL database connection successful');
    } catch (connectionError) {
      debugLog('PostgreSQL database connection failed', connectionError);
      console.error('[Prisma] Database connection failed:', connectionError);
      return ERROR_RESPONSES.databaseError('Failed to connect to database');
    }

    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return ERROR_RESPONSES.validationError('Email and password are required');
    }

    // Find user by email
    let user;
    debugLog(`Attempting to find user with email: ${email}`);
    try {
      user = await prisma.user.findUnique({
        where: { email },
      });
      
      // Log Prisma query results
      if (user) {
        debugLog('User found in PostgreSQL database', { 
          id: user.id,
          email: user.email,
          name: user.name,
          hasPassword: !!user.password
        });
      } else {
        debugLog(`No user found with email: ${email}`);
      }

      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
    } catch (userLookupError) {
      debugLog('Error looking up user', userLookupError);
      return NextResponse.json({ error: 'Error looking up user' }, { status: 500 });
    }

    // Check password
    debugLog('Comparing provided password with stored hash');
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
      debugLog(`Password comparison result: ${isPasswordValid}`);
      
      if (!isPasswordValid) {
        debugLog('Password validation failed');
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
      debugLog('Password validation successful');
      
      // Check if email is verified
      if (user.emailVerified === false) {
        debugLog('Email not verified');
        return NextResponse.json({ 
          error: 'Email not verified', 
          requiresVerification: true,
          email: user.email
        }, { status: 403 });
      }
      debugLog('Email verification status:', user.emailVerified);
    } catch (passwordError) {
      debugLog('Error comparing passwords', passwordError);
      return NextResponse.json({ error: 'Error validating credentials' }, { status: 500 });
    }

    // Generate JWT token
    debugLog('Generating JWT token');
    let token;
    try {
      // Log details before token generation
      console.log('Token Generation - User ID:', user.id);
      console.log('Token Generation - User Email:', user.email);
      console.log('Token Generation - JWT Secret:', JWT_SECRET);
      console.log('Token Generation - JWT Secret Length:', JWT_SECRET.length);
      
      token = jwt.sign(
        { userId: user.id, email: user.email }, 
        JWT_SECRET, 
        { 
          expiresIn: '24h',
          algorithm: 'HS256' // Explicitly set algorithm
        }
      );
      
      // Log token details after generation
      console.log('Generated Token:', token);
      console.log('Generated Token Length:', token.length);
      
      debugLog('JWT token generated successfully');
    } catch (tokenError) {
      // Log detailed error information
      console.error('Token Generation Error:', tokenError);
      if (tokenError instanceof Error) {
        console.error('Error Name:', tokenError.name);
        console.error('Error Message:', tokenError.message);
        console.error('Error Stack:', tokenError.stack);
      }
      
      debugLog('Error generating JWT token', tokenError);
      return NextResponse.json({ error: 'Error during authentication' }, { status: 500 });
    }

    // Log successful login
    debugLog(`User logged in successfully`, { email, userId: user.id });

    // Create a response with a secure, HTTP-only cookie
    debugLog('Creating response with HTTP-only cookie');
    try {
      const response = NextResponse.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token: token
      }, { status: 200 });

      // Set the token as an HTTP-only, secure cookie
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      });
      
      debugLog('HTTP-only cookie set successfully');
      return response;
    } catch (responseError) {
      debugLog('Error creating response', responseError);
      return NextResponse.json({ error: 'Error during authentication' }, { status: 500 });
    }

  } catch (error) {
    debugLog('Unexpected error during login process', error);
    
    // Log additional error details
    if (error instanceof Error) {
      debugLog('Error details', { 
        name: error.name, 
        message: error.message,
        stack: error.stack
      });
    }
    
    // Ensure Prisma connection is closed
    try {
      debugLog('Attempting to disconnect from database after error');
      await prisma.$disconnect();
      debugLog('Database disconnected successfully after error');
    } catch (disconnectError) {
      debugLog('Error disconnecting from database', disconnectError);
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    // Ensure Prisma connection is always closed
    debugLog('Ensuring database connection is closed in finally block');
    await prisma.$disconnect();
    debugLog('Login request processing completed');
  }
}
