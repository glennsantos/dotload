import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify, type JWTPayload } from 'jose'
import { prisma } from "@/lib/prisma"

// Enable debugging
const DEBUG = true;
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, ...args);
    // Also log to stderr for better visibility in Next.js logs
    process.stderr.write(`[DEBUG] ${message} ${args.map(a => JSON.stringify(a)).join(' ')}\n`);
  }
};


export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    debugLog('=== AUTH/ME REQUEST START ===');
    debugLog('Request URL:', request.url);
    debugLog('Request headers:', Object.fromEntries(request.headers.entries()));
    
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    debugLog('All cookies received:', allCookies.map(c => ({ name: c.name, value: c.value?.substring(0, 20) + '...', hasValue: !!c.value })));
    
    const token = cookieStore.get('token');
    debugLog('Token cookie found:', token ? 'Yes' : 'No');
    if (token) {
      debugLog('Token value length:', token.value?.length);
      debugLog('Token value preview:', token.value?.substring(0, 50) + '...');
    }
    
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
    const JWT_SECRET = process.env.JWT_SECRET;
    
    if (!JWT_SECRET) {
      debugLog('JWT_SECRET is not defined');
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    console.log('JWT_SECRET available');
    try {
      // Create secret key for jose
      const secret = new TextEncoder().encode(JWT_SECRET);
      
      // Verify the token using jose
      const { payload } = await jwtVerify(tokenValue, secret, {
        algorithms: ['HS256'],
      });
      
      // Cast payload to include our custom fields
      const decoded = payload as JWTPayload & { userId: string, email: string };
      
      debugLog('Token verified, userId:', decoded.userId);
      
      // Get user from database
      debugLog('Fetching user from database...');
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          storeLogoPath: true,
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
