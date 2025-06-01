import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify, type JWTPayload } from 'jose'
import { prisma } from "@/lib/prisma"

// Enable debugging
const DEBUG = true;
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[AUTH/ME] ${message}`, ...args);
    // Also log to stderr for better visibility in Next.js logs
    process.stderr.write(`[AUTH/ME] ${message} ${args.map(a => JSON.stringify(a)).join(' ')}\n`);
  }
};


export async function GET(request: NextRequest) {
  try {
    // Get page context from referer
    const referer = request.headers.get('referer') || 'direct';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    debugLog('=== AUTH/ME REQUEST START ===');
    debugLog(`Request from page: ${referer}`);
    debugLog(`User agent: ${userAgent.substring(0, 100)}...`);
    debugLog(`Request URL: ${request.url}`);
    debugLog(`Request method: ${request.method}`);
    debugLog(`Timestamp: ${new Date().toISOString()}`);
    
    // Log all request headers for debugging
    const headers = Object.fromEntries(request.headers.entries());
    debugLog('Request headers:', headers);
    
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    debugLog('All cookies received:', allCookies.map(c => ({ 
      name: c.name, 
      value: c.value?.substring(0, 20) + '...', 
      hasValue: !!c.value,
      length: c.value?.length || 0
    })));
    
    const token = cookieStore.get('token');
    debugLog(`Token cookie found: ${token ? 'Yes' : 'No'}`);
    if (token) {
      debugLog(`Token value length: ${token.value?.length}`);
      debugLog(`Token value preview: ${token.value?.substring(0, 50)}...`);
    }
    
    // Also check for token in Authorization header as fallback
    const authHeader = request.headers.get('Authorization');
    debugLog(`Authorization header: ${authHeader ? 'Present' : 'Not present'}`);
    if (authHeader) {
      debugLog(`Auth header preview: ${authHeader.substring(0, 50)}...`);
    }
    
    let tokenValue = token?.value;
    
    // If no cookie token but Authorization header exists, try to extract token
    if (!tokenValue && authHeader && authHeader.startsWith('Bearer ')) {
      tokenValue = authHeader.substring(7);
      debugLog('Using token from Authorization header');
    }
    
    if (!tokenValue) {
      debugLog(`❌ No valid token found in cookies or headers`);
      debugLog(`Request source: ${referer}`);
      debugLog('=== AUTH/ME REQUEST END (NO TOKEN) ===');
      return NextResponse.json(
        { message: 'Unauthorized', source: 'no_token' },
        { status: 401 }
      );
    }
    
    // Verify token
    debugLog('🔍 Starting token verification...');
    const JWT_SECRET = process.env.JWT_SECRET;
    
    if (!JWT_SECRET) {
      debugLog('❌ JWT_SECRET is not defined');
      debugLog('=== AUTH/ME REQUEST END (NO SECRET) ===');
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    debugLog(`JWT_SECRET available: ${!!JWT_SECRET}`);
    debugLog(`JWT_SECRET length: ${JWT_SECRET.length}`);
    
    try {
      // Create secret key for jose
      const secret = new TextEncoder().encode(JWT_SECRET);
      
      // Verify the token using jose
      const { payload } = await jwtVerify(tokenValue, secret, {
        algorithms: ['HS256'],
      });
      
      // Cast payload to include our custom fields
      const decoded = payload as JWTPayload & { userId: string, email: string };
      
      debugLog('✅ Token verification successful');
      debugLog(`User ID: ${decoded.userId}`);
      debugLog(`Email: ${decoded.email}`);
      debugLog(`Token issued at: ${new Date((decoded.iat || 0) * 1000).toISOString()}`);
      debugLog(`Token expires at: ${new Date((decoded.exp || 0) * 1000).toISOString()}`);
      debugLog(`Time until expiry: ${Math.round(((decoded.exp || 0) * 1000 - Date.now()) / 1000 / 60)} minutes`);
      
      // Get user from database
      debugLog('🔍 Fetching user from database...');
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
        debugLog(`❌ User not found in database for id: ${decoded.userId}`);
        debugLog('=== AUTH/ME REQUEST END (USER NOT FOUND) ===');
        return NextResponse.json(
          { message: 'User not found', source: 'user_not_found' },
          { status: 404 }
        );
      }
      
      debugLog('✅ User found in database');
      debugLog(`User details: ${JSON.stringify(user)}`);
      debugLog(`Request source: ${referer}`);
      debugLog('=== AUTH/ME REQUEST END (SUCCESS) ===');
      
      return NextResponse.json({ user }, { status: 200 });
    } catch (tokenError) {
      debugLog('❌ Token verification failed:', tokenError);
      if (tokenError instanceof Error) {
        debugLog(`Token error name: ${tokenError.name}`);
        debugLog(`Token error message: ${tokenError.message}`);
      }
      debugLog(`Request source: ${referer}`);
      debugLog('=== AUTH/ME REQUEST END (TOKEN INVALID) ===');
      return NextResponse.json(
        { message: 'Invalid token', details: tokenError instanceof Error ? tokenError.message : String(tokenError), source: 'invalid_token' },
        { status: 401 }
      );
    }
  } catch (error) {
    debugLog('❌ Auth check error:', error);
    if (error instanceof Error) {
      debugLog(`General error name: ${error.name}`);
      debugLog(`General error message: ${error.message}`);
      debugLog(`General error stack: ${error.stack}`);
    }
    debugLog('=== AUTH/ME REQUEST END (ERROR) ===');
    return NextResponse.json(
      { message: 'An error occurred while checking authentication', error: error instanceof Error ? error.message : String(error), source: 'server_error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
    debugLog('Database connection closed');
  }
}
