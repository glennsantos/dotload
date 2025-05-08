import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// List of public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login', 
  '/register', 
  '/', 
  '/verify-email',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/logout'
];

// Routes that require authentication but not email verification
const AUTH_ONLY_ROUTES = [
  '/verify-email'
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  // Redirect dashboard to products page
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/products', request.url));
  }

  // Check if the route is public
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // If no token, redirect to login with return URL
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname === '/dashboard' ? '/products' : pathname));
    return NextResponse.redirect(url);
  }

  // Verify token
  try {
    // Decode the token to get user information
    const decoded = verify(token, JWT_SECRET) as JwtPayload & { userId: string; email: string; emailVerified?: boolean };
    
    // Check if the route requires email verification
    const requiresVerification = !AUTH_ONLY_ROUTES.some(route => pathname === route || pathname.startsWith(route));
    
    // If email verification is required but the user's email is not verified
    if (requiresVerification && decoded.emailVerified === false) {
      // Redirect to email verification page
      return NextResponse.redirect(new URL('/verify-email', request.url));
    }
    
    return NextResponse.next();
  } catch (error) {
    // Invalid token, redirect to login
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.nextUrl.pathname));
    return NextResponse.redirect(url);
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    // Protect all dashboard and product routes
    '/dashboard/:path*', 
    '/products/:path*',
    '/settings/:path*',
    '/analytics/:path*',
    '/audience/:path*',
    '/help/:path*',
    // Add API routes that need protection
    '/api/products/:path*',
    '/api/users/:path*',
    '/api/files/:path*',
    // Exclude public API routes
    '/((?!api/auth/login|api/auth/register|api/auth/verify-email|api/auth/logout)api/:path*)',
  ]
}
