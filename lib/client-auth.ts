"use client";

/**
 * Client-side authentication utilities with localStorage fallback
 * This file contains utilities for managing authentication state on the client side
 * Note: We use HTTP-only cookies for authentication, so tokens are not accessible via JavaScript
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Get token from localStorage (fallback when cookies fail)
 */
function getTokenFromStorage(): string | null {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

/**
 * Set token in localStorage (fallback when cookies fail)
 */
function setTokenInStorage(token: string): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem('auth_token', token);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Remove token from localStorage
 */
function removeTokenFromStorage(): void {
  if (!isBrowser) return;
  try {
    localStorage.removeItem('auth_token');
  } catch {
    // Ignore storage errors
  }
}

/**
 * Make authenticated requests with both cookies and Authorization header
 */
export function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getTokenFromStorage();
  
  return fetch(url, {
    ...options,
    credentials: 'include', // Include cookies
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }), // Add token from localStorage
      ...options.headers
    }
  });
}

/**
 * Check if the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  if (!isBrowser) return false;
  
  try {
    const response = await fetchWithAuth('/api/auth/me');
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
    const response = await fetchWithAuth('/api/auth/me');
    
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
 * Store auth token after login
 */
export function storeAuthToken(token: string): void {
  setTokenInStorage(token);
}

/**
 * Clear auth token on logout
 */
export function clearAuthToken(): void {
  removeTokenFromStorage();
}

/**
 * Initialize auth - check if user is authenticated and store token if provided
 */
export async function initAuth(token?: string): Promise<any | null> {
  if (!isBrowser) return null;
  
  // If token provided (from login), store it
  if (token) {
    storeAuthToken(token);
  }
  
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
