/**
 * Client-side authentication utilities
 * These functions can be used in client components
 */

export interface ClientAuthUser {
  id: string;
  email: string;
  name?: string | null;
  storeLogoPath?: string | null;
}

/**
 * Get the current authenticated user from the API
 * This is a client-side function that can be used in client components
 */
export async function getClientUser(): Promise<ClientAuthUser | null> {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.user || data;
  } catch (error) {
    console.error('Error getting client user:', error);
    return null;
  }
}
