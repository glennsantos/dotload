import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

// Enable debugging
const DEBUG = true;
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, ...args);
    // Also log to stderr for better visibility in Next.js logs
    process.stderr.write(`[DEBUG] ${message} ${args.map(a => JSON.stringify(a)).join(' ')}\n`);
  }
};

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    debugLog('Checking for auth token...');
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    debugLog('All cookies:', allCookies.map(c => c.name));
    
    const token = cookieStore.get('token');
    debugLog('Token found:', token ? 'Yes' : 'No');
    
    // Also check for token in Authorization header as fallback
    const authHeader = request.headers.get('Authorization');
    debugLog('Authorization header:', authHeader ? 'Present' : 'Not present');
    
    let tokenValue = token?.value;
    
    // If no cookie token but Authorization header exists, try to extract token
    if (!tokenValue && authHeader && authHeader.startsWith('Bearer ')) {
      tokenValue = authHeader.substring(7);
      debugLog('Using token from Authorization header');
    }
    
    if (!tokenValue) {
      debugLog('No valid token found in cookies or headers');
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify token
    debugLog('Verifying token...');
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_please_set_in_env';
    try {
      const decoded = jwt.verify(tokenValue, JWT_SECRET) as { userId: string, email: string };
      debugLog('Token verified, userId:', decoded.userId);
      
      // Get user from database
      debugLog('Fetching user from database...');
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      if (!user) {
        debugLog('User not found in database for id:', decoded.userId);
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }
      
      debugLog('User found:', user);
      return NextResponse.json({ user }, { status: 200 });
    } catch (tokenError) {
      debugLog('Token verification failed:', tokenError);
      return NextResponse.json(
        { message: 'Invalid token', details: tokenError instanceof Error ? tokenError.message : String(tokenError) },
        { status: 401 }
      );
    }
  } catch (error) {
    debugLog('Auth check error:', error);
    return NextResponse.json(
      { message: 'An error occurred while checking authentication', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
    debugLog('Database connection closed');
  }
}
