"use client";

/**
 * Client-side authentication utilities
 * This file contains utilities for managing authentication state on the client side
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Get the authentication token from localStorage
 */
export function getAuthToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem('auth_token');
}

/**
 * Set the authentication token in localStorage
 */
export function setAuthToken(token: string): void {
  if (!isBrowser) return;
  localStorage.setItem('auth_token', token);
}

/**
 * Remove the authentication token from localStorage
 */
export function removeAuthToken(): void {
  if (!isBrowser) return;
  localStorage.removeItem('auth_token');
}

/**
 * Check if the user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Add the authentication token to fetch requests
 */
export function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  
  // Create headers with Authorization if token exists
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Return fetch with updated headers
  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * Initialize auth from server-side token
 * Call this function when the app loads to sync the token from cookies to localStorage
 */
export function initAuth(serverToken?: string): void {
  if (!isBrowser) return;
  
  // If server provided a token, store it
  if (serverToken) {
    setAuthToken(serverToken);
    return;
  }
  
  // Otherwise, check if we need to fetch the current user
  const token = getAuthToken();
  if (token) {
    // Verify the token is still valid by fetching the current user
    fetchWithAuth('/api/auth/me')
      .then(response => {
        if (!response.ok) {
          // If token is invalid, remove it
          removeAuthToken();
        }
      })
      .catch(() => {
        // On error, remove the token
        removeAuthToken();
      });
  }
}
