import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { prisma } from "@/lib/prisma"

// Enable more verbose logging
const DEBUG = process.env.NODE_ENV === 'production' ? true : true; // Keep debugging enabled in all environments
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[LOGIN] ${message}`, ...args);
    // Also log to stderr for better visibility in Next.js logs
    process.stderr.write(`[LOGIN] ${message} ${args.map(a => JSON.stringify(a)).join(' ')}\n`);
  }
};

const JWT_SECRET = process.env.JWT_SECRET!.trim(); // Ensure no whitespace

// Also handle GET requests for direct navigation
export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Please use POST method for login' }, { status: 405 });
}

export async function POST(req: NextRequest) {
  try {
    // Get page context from referer
    const referer = req.headers.get('referer') || 'direct';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    debugLog('=== LOGIN REQUEST START ===');
    debugLog(`Request from page: ${referer}`);
    debugLog(`User agent: ${userAgent.substring(0, 100)}...`);
    debugLog(`Request URL: ${req.url}`);
    debugLog(`Timestamp: ${new Date().toISOString()}`);
    
    // Log database connection status
    try {
      debugLog('🔍 Attempting to connect to PostgreSQL database');
      await prisma.$connect();
      debugLog('✅ PostgreSQL database connection successful');
    } catch (connectionError) {
      debugLog('❌ PostgreSQL database connection failed', connectionError);
      console.error('[Prisma] Database connection failed:', connectionError);
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      debugLog('❌ Missing email or password');
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    debugLog(`🔍 Login attempt for email: ${email}`);

    // Find user by email
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
      });
      
      // Log Prisma query results
      if (user) {
        debugLog('✅ User found in PostgreSQL database', { 
          id: user.id,
          email: user.email,
          name: user.name,
          hasPassword: !!user.password,
          emailVerified: user.emailVerified
        });
      } else {
        debugLog(`❌ No user found with email: ${email}`);
      }

      if (!user) {
        debugLog('=== LOGIN REQUEST END (USER NOT FOUND) ===');
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
    } catch (userLookupError) {
      debugLog('❌ Error looking up user', userLookupError);
      return NextResponse.json({ error: 'Error looking up user' }, { status: 500 });
    }

    // Check password
    debugLog('🔍 Comparing provided password with stored hash');
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
      debugLog(`Password comparison result: ${isPasswordValid}`);
      
      if (!isPasswordValid) {
        debugLog('❌ Password validation failed');
        debugLog('=== LOGIN REQUEST END (INVALID PASSWORD) ===');
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
      debugLog('✅ Password validation successful');
      
      // Check if email is verified
      if (user.emailVerified === false) {
        debugLog('❌ Email not verified');
        debugLog('=== LOGIN REQUEST END (EMAIL NOT VERIFIED) ===');
        return NextResponse.json({ 
          error: 'Email not verified', 
          requiresVerification: true,
          email: user.email
        }, { status: 403 });
      }
      debugLog(`✅ Email verification status: ${user.emailVerified}`);
    } catch (passwordError) {
      debugLog('❌ Error comparing passwords', passwordError);
      return NextResponse.json({ error: 'Error validating credentials' }, { status: 500 });
    }

    // Generate JWT token
    debugLog('🔍 Starting JWT token generation');
    let token;
    try {
      // Log details before token generation
      debugLog(`Token generation details:`, {
        userId: user.id,
        email: user.email,
        jwtSecretLength: JWT_SECRET.length,
        timestamp: new Date().toISOString()
      });
      
      // Create secret key for jose
      const secret = new TextEncoder().encode(JWT_SECRET);
      
      // Generate token using jose
      token = await new SignJWT({ userId: user.id, email: user.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);
      
      // Log token details after generation
      debugLog('✅ JWT token generated successfully');
      debugLog(`Generated token length: ${token.length}`);
      debugLog(`Generated token preview: ${token.substring(0, 50)}...`);
      
      // Verify the token immediately to ensure it's valid
      const { jwtVerify } = await import('jose');
      const { payload } = await jwtVerify(token, secret);
      debugLog('✅ Token verification test passed');
      debugLog(`Token payload:`, payload);
      
    } catch (tokenError) {
      // Log detailed error information
      debugLog('❌ Token generation error:', tokenError);
      if (tokenError instanceof Error) {
        debugLog(`Token error name: ${tokenError.name}`);
        debugLog(`Token error message: ${tokenError.message}`);
        debugLog(`Token error stack: ${tokenError.stack}`);
      }
      
      debugLog('=== LOGIN REQUEST END (TOKEN ERROR) ===');
      return NextResponse.json({ error: 'Error during authentication' }, { status: 500 });
    }

    // Log successful login
    debugLog(`✅ User logged in successfully`, { 
      email, 
      userId: user.id,
      requestSource: referer
    });

    // Create a response with a secure, HTTP-only cookie
    debugLog('🔍 Creating response with HTTP-only cookie');
    try {
      const response = NextResponse.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token: token // Return token so client can store in localStorage as fallback
      }, { status: 200 });

      // Set the token as an HTTP-only, secure cookie
      debugLog('🔍 Setting auth cookie with options...');
      
      // Explicitly check environment and force secure to false for localhost
      const isProduction = process.env.NODE_ENV === 'production';
      const isLocalhost = req.url?.includes('localhost') || req.headers.get('host')?.includes('localhost');
      const shouldBeSecure = isProduction && !isLocalhost;
      
      const cookieOptions = {
        httpOnly: true,
        secure: shouldBeSecure,
        sameSite: 'lax' as const,
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      };
      
      debugLog('Environment details:', {
        NODE_ENV: process.env.NODE_ENV,
        isProduction,
        isLocalhost,
        shouldBeSecure,
        host: req.headers.get('host'),
        url: req.url
      });
      debugLog('Cookie options:', cookieOptions);
      
      response.cookies.set('token', token, cookieOptions);
      
      debugLog('✅ Auth cookie set successfully');
      debugLog(`Cookie secure: ${cookieOptions.secure} (MUST be false for localhost)`);
      debugLog(`Cookie sameSite: ${cookieOptions.sameSite}`);
      debugLog(`Request source: ${referer}`);
      debugLog('=== LOGIN REQUEST END (SUCCESS) ===');
      
      return response;
    } catch (responseError) {
      debugLog('❌ Error creating response', responseError);
      debugLog('=== LOGIN REQUEST END (RESPONSE ERROR) ===');
      return NextResponse.json({ error: 'Error during authentication' }, { status: 500 });
    }

  } catch (error) {
    debugLog('❌ Unexpected error during login process', error);
    
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
      debugLog('🔍 Attempting to disconnect from database after error');
      await prisma.$disconnect();
      debugLog('✅ Database disconnected successfully after error');
    } catch (disconnectError) {
      debugLog('❌ Error disconnecting from database', disconnectError);
    }
    
    debugLog('=== LOGIN REQUEST END (UNEXPECTED ERROR) ===');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    // Ensure Prisma connection is always closed
    debugLog('🔍 Ensuring database connection is closed in finally block');
    await prisma.$disconnect();
    debugLog('✅ Login request processing completed');
  }
}
