"use client";

/**
 * Client-side authentication utilities
 * This file contains utilities for managing authentication state on the client side
 * Note: We use HTTP-only cookies for authentication, so tokens are not accessible via JavaScript
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Check if the user is authenticated by making a request to the server
 * Since we use HTTP-only cookies, we can't access the token directly
 */
export async function isAuthenticated(): Promise<boolean> {
  if (!isBrowser) return false;
  
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include', // Include cookies
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get current user data from the server
 */
export async function getCurrentUser(): Promise<any | null> {
  if (!isBrowser) return null;
  
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include', // Include cookies
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.user || data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Make authenticated requests using cookies
 */
export function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // Since we use HTTP-only cookies, just ensure credentials are included
  return fetch(url, {
    ...options,
    credentials: 'include', // Include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
}

/**
 * Initialize auth - just check if user is authenticated
 */
export async function initAuth(): Promise<any | null> {
  if (!isBrowser) return null;
  
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}

/**
 * Legacy functions for backward compatibility - these now do nothing
 * since we use HTTP-only cookies
 */
export function getAuthToken(): string | null {
  console.warn('getAuthToken is deprecated - using HTTP-only cookies');
  return null;
}

export function setAuthToken(token: string): void {
  console.warn('setAuthToken is deprecated - using HTTP-only cookies');
}

export function removeAuthToken(): void {
  console.warn('removeAuthToken is deprecated - using HTTP-only cookies');
}
