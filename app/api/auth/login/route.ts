import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Enable more verbose logging
const DEBUG = true;
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, ...args);
    // Also log to stderr for better visibility in Next.js logs
    process.stderr.write(`[DEBUG] ${message} ${args.map(a => JSON.stringify(a)).join(' ')}\n`);
  }
};

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_please_set_in_env';

export async function POST(req: NextRequest) {
  try {
    debugLog('Login process starting');
    
    // Log database connection status
    try {
      debugLog('Attempting to connect to PostgreSQL database');
      await prisma.$connect();
      debugLog('PostgreSQL database connection successful');
    } catch (connectionError) {
      debugLog('PostgreSQL database connection failed', connectionError);
      console.error('[Prisma] Database connection failed:', connectionError);
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
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
      token = jwt.sign(
        { userId: user.id, email: user.email }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      );
      debugLog('JWT token generated successfully');
    } catch (tokenError) {
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
