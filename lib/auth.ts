import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseUserService } from './supabase-db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_please_set_in_env';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Verify and decode the token using jose
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    
    // Get user from Supabase to ensure they still exist
    const user = await supabaseUserService.findUserById(userId);
    
    if (!user) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getAuthUserId(): Promise<string | null> {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Verify and decode the token using jose
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    return payload.userId as string;
  } catch (error) {
    console.error('Error getting user ID from token:', error);
    return null;
  }
}
