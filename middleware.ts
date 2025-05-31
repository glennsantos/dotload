import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';

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

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Debug logging for all requests
  console.log(`[MIDDLEWARE] Processing request to: ${pathname}`);
  
  // Explicitly allow secure download routes (both old and new endpoints)
  if (pathname.startsWith('/api/files/secure-download') || 
      pathname.startsWith('/api/files/direct-download') ||
      pathname.startsWith('/api/downloads/secure')) {
    console.log(`[MIDDLEWARE] Allowing access to: ${pathname}`);
    return NextResponse.next();
  }
  
  debugLog('Checking for auth token...');
  
  // Get all cookies for debugging
  const allCookies = request.cookies.getAll();
  debugLog('All cookies:', allCookies);
  
  // Try to get the token from cookies
  const token = request.cookies.get('token')?.value;
  
  // Check for Authorization header as fallback
  const authHeader = request.headers.get('Authorization');
  debugLog('Authorization header:', authHeader ? 'Present' : 'Not present');
  
  // Additional debug for cookie issues in production
  debugLog('Cookie header:', request.headers.get('cookie'));
  debugLog('Token cookie specifically:', request.cookies.get('token'));
  
  // Debug logging
  console.log(`Middleware processing path: ${pathname}`);
  console.log(`Token exists: ${!!token}`);
  debugLog('Token found:', token ? 'Yes' : 'No');
  
  // Check for client-side auth token in localStorage (sent via Authorization header)
  // This is a fallback mechanism for when cookies aren't working properly

  // No longer redirecting dashboard to products page
  // Dashboard now shows its own content

  // Check if the route is public
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // If no token, check for Authorization header as fallback
  let tokenToUse = token;
  if (!tokenToUse && authHeader && authHeader.startsWith('Bearer ')) {
    tokenToUse = authHeader.substring(7); // Remove 'Bearer ' prefix
    debugLog('Using token from Authorization header');
  }
  
  // If still no token, redirect to login
  if (!tokenToUse) {
    debugLog('No valid token found in cookies or headers');
    
    // Get the domain from environment variables for consistent redirection
    const DOMAIN = process.env.DOMAIN || 'localhost:3000';
    const BASE_URL = DOMAIN.startsWith('http') ? DOMAIN : `http://${DOMAIN}`;
    
    // Use BASE_URL for redirection to ensure consistent domain
    const url = new URL('/login', BASE_URL);
    url.searchParams.set('callbackUrl', encodeURI(pathname === '/dashboard' ? '/products' : pathname));
    return NextResponse.redirect(url);
  }

  // Verify token
  try {
    // Log token details for debugging
    debugLog('JWT Secret length:', JWT_SECRET?.length);
    debugLog('Token exists:', !!tokenToUse);
    debugLog('Token Length:', tokenToUse?.length);
    
    if (!tokenToUse) {
      throw new Error('No token provided');
    }
    
    // Decode the token to get user information
    // Use a try-catch block specifically for the verification to handle errors gracefully
    try {
      debugLog('Attempting to verify token');
      const decoded = verify(tokenToUse, JWT_SECRET, {
        algorithms: ['HS256'], // Specify the expected algorithm
        maxAge: '7d' // Match the token expiration from login route
      }) as JwtPayload & { userId: string; email: string; emailVerified?: boolean };
      
      // Additional validation
      if (!decoded.userId || !decoded.email) {
        console.error('Invalid token payload');
        throw new Error('Invalid token payload');
      }
      
      // Log decoded token details
      debugLog('Token verified successfully');
      debugLog('Decoded Token:', {
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
      
      // Token is valid, proceed with the request
      const response = NextResponse.next();
      
      // If token was from Authorization header, set it as a cookie for subsequent requests
      if (token === null && authHeader) {
        debugLog('Setting token cookie from Authorization header');
        response.cookies.set('token', tokenToUse, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax', // Changed from 'strict' to 'lax' to allow cross-site navigation
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: '/',
          // Ensure domain is set correctly for production
          domain: process.env.COOKIE_DOMAIN || undefined
        });
        
        // Log cookie setting details
        debugLog('Setting auth cookie with options:', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: '7 days',
          path: '/',
          domain: process.env.COOKIE_DOMAIN || undefined
        });
      }
      
      return response;
    } catch (verifyError) {
      console.error('Token verification error:', verifyError);
      throw verifyError; // Re-throw to be caught by the outer catch block
    }
  } catch (error) {
    // Invalid token, redirect to login
    console.error('Middleware auth error:', error instanceof Error ? error.message : 'Unknown error');
    
    // Get the domain from environment variables for consistent redirection
    const DOMAIN = process.env.DOMAIN || 'localhost:3000';
    const BASE_URL = DOMAIN.startsWith('http') ? DOMAIN : `http://${DOMAIN}`;
    
    // Use BASE_URL for redirection to ensure consistent domain
    const url = new URL('/login', BASE_URL);
    url.searchParams.set('callbackUrl', encodeURI(request.nextUrl.pathname));
    return NextResponse.redirect(url);
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    // Match all routes except static files, _next, and specific API endpoints
    '/((?!_next/static|_next/image|_next/data|favicon.ico).*)',
    // Match API routes but exclude specific endpoints
    '/(api/(?!files/secure-download|files/direct-download|downloads/secure|downloads/file).*)'
  ]
}
