import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';

// Enable more verbose logging
const DEBUG = true;
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, ...args);
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
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/logout',
  '/uploads',
  '/uploads/*',
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

  // Debug logging for all requests
  console.log(`[MIDDLEWARE] Processing request to: ${pathname}`);
  
  // Check if the route is public FIRST - don't process auth for public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))) {
    console.log(`[MIDDLEWARE] Public route, skipping auth check: ${pathname}`);
    return NextResponse.next();
  }
  
  // Explicitly allow secure download routes (both old and new endpoints)
  if (pathname.startsWith('/api/files/secure-download') || 
      pathname.startsWith('/api/files/direct-download') ||
      pathname.startsWith('/api/downloads/secure')) {
    console.log(`[MIDDLEWARE] Allowing access to: ${pathname}`);
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  console.log(`[MIDDLEWARE] Token present: ${!!token}, pathname: ${pathname}`);
  
  // If no token, redirect to login with return URL
  if (!token) {
    console.log(`[MIDDLEWARE] No token found, redirecting to login`);
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  // Verify token using jose
  try {
    // Log token details for debugging
    console.log('Middleware JWT Secret available:', !!JWT_SECRET);
    console.log('Middleware Token Length:', token?.length);
    
    // Create secret key for jose
    const secret = new TextEncoder().encode(JWT_SECRET);
    
    // Verify the token using jose
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'], // Specify the expected algorithm
    });
    
    // Cast payload to include our custom fields
    const decoded = payload as JWTPayload & { userId: string; email: string; emailVerified?: boolean };
    
    // Additional validation
    if (!decoded.userId || !decoded.email) {
      console.error('Invalid token payload');
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(pathname));
      return NextResponse.redirect(url);
    }
    
    // Log decoded token details
    console.log('Middleware Decoded Token:', {
      userId: decoded.userId,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp
    });
    
    // Check if the route requires email verification
    const requiresVerification = !AUTH_ONLY_ROUTES.some(route => pathname === route || pathname.startsWith(route));
    
    // If email verification is required but the user's email is not verified
    if (requiresVerification && decoded.emailVerified === false) {
      // Redirect to email verification page
      return NextResponse.redirect(new URL('/verify-email', request.url));
    }
    
    console.log(`[MIDDLEWARE] Auth successful for: ${pathname}`);
    return NextResponse.next();
  } catch (error) {
    // Invalid token, redirect to login
    console.log(`[MIDDLEWARE] Token verification failed:`, error);
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.nextUrl.pathname));
    return NextResponse.redirect(url);
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    // Only match protected routes - exclude all public routes
    '/dashboard',
    '/dashboard/:path*',
    '/products/:path*',
    '/transactions/:path*',
    '/purchases/:path*',
    '/settings',
    '/settings/:path*',
    '/buyer-dashboard/:path*',
    '/create-product/:path*',
    // API routes that need auth (exclude public auth endpoints)
    '/api/products/:path*',
    '/api/transactions/:path*',
    '/api/purchases/:path*',
    '/api/auth/me',
    '/api/auth/user-status',
    '/api/auth/create-from-purchase'
  ]
}
