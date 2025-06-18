import { cookies } from 'next/headers';
import { jwtVerify, type JWTPayload } from 'jose';
import { supabaseUserService } from './supabase-db';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

// Enable more verbose logging
const DEBUG = true;
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, ...args);
    // Also log to stderr for better visibility in Next.js logs
    process.stderr.write(`[DEBUG] ${message} ${args.map(a => JSON.stringify(a)).join(' ')}\n`);
  }
};

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_please_set_in_env';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  storeLogoPath?: string | null;
}

/**
 * Get the auth token from cookies or Authorization header
 */
export async function getAuthToken(request?: NextRequest): Promise<string | null> {
  try {
    debugLog('Checking for auth token...');
    
    // Get all cookies for debugging
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    debugLog('All cookies:', allCookies);
    
    // Try to get token from cookies
    const tokenCookie = cookieStore.get('token');
    const token = tokenCookie?.value;
    debugLog('Token found:', token ? 'Yes' : 'No');
    
    // If token exists in cookies, return it
    if (token) {
      return token;
    }
    
    // Try to get token from Authorization header if request is provided
    if (request) {
      try {
        const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
        debugLog('Authorization header:', authHeader ? 'Present' : 'Not present');
        
        // If Authorization header exists and starts with Bearer, extract the token
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const headerToken = authHeader.substring(7); // Remove 'Bearer ' prefix
          debugLog('Using token from Authorization header');
          return headerToken;
        }
      } catch (headerError) {
        console.error('Error accessing request headers:', headerError);
        debugLog('Error accessing request headers');
      }
    } else {
      // In server components where we don't have access to the request object
      // We can only use the cookies method
      debugLog('No request object provided, skipping Authorization header check');
    }
    
    // Already handled in the try/catch block above
    
    // No valid token found
    debugLog('No valid token found in cookies or headers');
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Get the current authenticated user from the JWT token
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Get the token
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }
    
    // Create secret key for jose
    const secret = new TextEncoder().encode(JWT_SECRET);
    
    // Verify and decode the token using jose
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    
    // Cast payload to include our custom fields
    const decoded = payload as JWTPayload & { 
      userId: string; 
      email: string;
    };
    
    // Get user from Supabase to ensure they still exist
    const user = await supabaseUserService.findUserById(decoded.userId);
    
    if (!user) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      storeLogoPath: user.storeLogoPath
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get just the user ID from the JWT token
 */
export async function getAuthUserId(): Promise<string | null> {
  try {
    // Get the token
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }
    
    // Create secret key for jose
    const secret = new TextEncoder().encode(JWT_SECRET);
    
    // Verify and decode the token using jose
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    
    // Cast payload to include our custom fields
    const decoded = payload as JWTPayload & { 
      userId: string; 
    };
    
    return decoded.userId;
  } catch (error) {
    console.error('Error getting user ID from token:', error);
    return null;
  }
}
