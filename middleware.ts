import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';

// Enable more verbose logging
const DEBUG = true;
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[MIDDLEWARE] ${message}`, ...args);
    // In middleware, we can't use process.stderr.write, so we only use console.log
  }
};

const JWT_SECRET = process.env.JWT_SECRET!.trim(); // Ensure no whitespace

// List of public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login', 
  '/register', 
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/uploads',
  '/uploads/*',
  // Product pages (public)
  '/p',
  '/p/*',
  // Purchase creation (public - used during checkout)
  '/api/purchases',
  // Old download endpoints (deprecated)
  '/api/files/secure-download',
  '/api/files/secure-download/*',
  '/api/files/direct-download',
  '/api/files/direct-download/*',
  // New download endpoints
  '/api/downloads/secure',
  '/api/downloads/secure/*'
];

// Routes that require authentication but not email verification
const AUTH_ONLY_ROUTES = [
  '/verify-email'
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const referer = request.headers.get('referer') || 'direct';

  // Debug logging for all requests with page context
  debugLog(`=== REQUEST START ===`);
  debugLog(`Processing request to: ${pathname}`);
  debugLog(`Referer: ${referer}`);
  debugLog(`Method: ${request.method}`);
  debugLog(`User-Agent: ${request.headers.get('user-agent')?.substring(0, 50)}...`);
  
  // Check if the route is public FIRST - don't process auth for public routes
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    if (route.endsWith('/*')) {
      return pathname.startsWith(route.slice(0, -2));
    }
    return pathname === route;
  });
  
  debugLog(`Route analysis for ${pathname}:`);
  debugLog(`- Is in PUBLIC_ROUTES: ${isPublicRoute}`);
  debugLog(`- PUBLIC_ROUTES:`, PUBLIC_ROUTES);
  debugLog(`- Checking each public route:`);
  PUBLIC_ROUTES.forEach(route => {
    if (route.endsWith('/*')) {
      const matches = pathname.startsWith(route.slice(0, -2));
      debugLog(`  - ${route}: ${matches} (wildcard check: ${pathname} starts with ${route.slice(0, -2)})`);
    } else {
      const matches = pathname === route;
      debugLog(`  - ${route}: ${matches} (exact match)`);
    }
  });
  
  if (isPublicRoute) {
    debugLog(`✅ Public route, skipping auth check: ${pathname}`);
    debugLog(`=== REQUEST END (PUBLIC) ===`);
    return NextResponse.next();
  }
  
  debugLog(`🔒 Protected route detected: ${pathname}`);
  
  // Get token from cookies
  const token = request.cookies.get('token')?.value;
  debugLog(`Token present: ${!!token}`);
  debugLog(`Token length: ${token?.length || 0}`);
  if (token) {
    debugLog(`Token preview: ${token.substring(0, 50)}...`);
  }
  
  // If no token, redirect to login with return URL
  if (!token) {
    debugLog(`❌ No token found, redirecting to login`);
    debugLog(`Redirect reason: Missing authentication token`);
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    debugLog(`Redirecting to: ${url.toString()}`);
    debugLog(`=== REQUEST END (NO TOKEN) ===`);
    return NextResponse.redirect(url);
  }

  // Verify token using jose
  try {
    debugLog(`🔍 Starting token verification...`);
    debugLog(`JWT Secret available: ${!!JWT_SECRET}`);
    debugLog(`JWT Secret length: ${JWT_SECRET.length}`);
    
    // Create secret key for jose
    const secret = new TextEncoder().encode(JWT_SECRET);
    
    // Verify the token using jose
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'], // Specify the expected algorithm
    });
    
    // Cast payload to include our custom fields
    const decoded = payload as JWTPayload & { userId: string; email: string; emailVerified?: boolean };
    
    debugLog(`✅ Token verification successful`);
    debugLog(`User ID: ${decoded.userId}`);
    debugLog(`Email: ${decoded.email}`);
    debugLog(`Issued at: ${new Date((decoded.iat || 0) * 1000).toISOString()}`);
    debugLog(`Expires at: ${new Date((decoded.exp || 0) * 1000).toISOString()}`);
    debugLog(`Email verified: ${decoded.emailVerified}`);
    
    // Additional validation
    if (!decoded.userId || !decoded.email) {
      debugLog(`❌ Invalid token payload - missing userId or email`);
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(pathname));
      debugLog(`=== REQUEST END (INVALID PAYLOAD) ===`);
      return NextResponse.redirect(url);
    }
    
    // Check if the route requires email verification
    const requiresVerification = !AUTH_ONLY_ROUTES.some(route => pathname === route || pathname.startsWith(route));
    
    // If email verification is required but the user's email is not verified
    if (requiresVerification && decoded.emailVerified === false) {
      debugLog(`❌ Email verification required but not verified`);
      debugLog(`=== REQUEST END (EMAIL NOT VERIFIED) ===`);
      return NextResponse.redirect(new URL('/verify-email', request.url));
    }
    
    debugLog(`✅ Authentication successful for: ${pathname}`);
    debugLog(`=== REQUEST END (SUCCESS) ===`);
    return NextResponse.next();
  } catch (error) {
    // Invalid token, redirect to login
    debugLog(`❌ Token verification failed:`, error);
    if (error instanceof Error) {
      debugLog(`Error name: ${error.name}`);
      debugLog(`Error message: ${error.message}`);
    }
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.nextUrl.pathname));
    debugLog(`Redirecting to: ${url.toString()}`);
    debugLog(`=== REQUEST END (TOKEN INVALID) ===`);
    return NextResponse.redirect(url);
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    // Protected pages
    '/dashboard',
    '/dashboard/:path*',
    '/products',
    '/products/:path*',
    '/transactions',
    '/transactions/:path*',
    '/purchases',
    '/purchases/:path*',
    '/settings',
    '/settings/:path*',
    '/buyer-dashboard',
    '/buyer-dashboard/:path*',
    '/create-product',
    '/create-product/:path*',
    '/edit-product',
    '/edit-product/:path*',
    // Protected API routes
    '/api/products',
    '/api/products/:path*',
    '/api/transactions',
    '/api/transactions/:path*',
    '/api/auth/me',
    '/api/auth/user-status',
    '/api/auth/create-from-purchase',
    '/api/auth/change-password',
    '/api/user/:path*'
  ]
}
