import { cookies } from 'next/headers';
import { verify, JwtPayload } from 'jsonwebtoken';
import { prisma } from './prisma';

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
    
    // Verify and decode the token
    const decoded = verify(token, JWT_SECRET) as JwtPayload & { 
      userId: string; 
      email: string;
    };
    
    // Get user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true }
    });
    
    return user;
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
    
    // Verify and decode the token
    const decoded = verify(token, JWT_SECRET) as JwtPayload & { 
      userId: string; 
    };
    
    return decoded.userId;
  } catch (error) {
    console.error('Error getting user ID from token:', error);
    return null;
  }
}
