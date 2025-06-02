'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

// Create a context for the auth state
const AuthStateContext = createContext<AuthState | undefined>(undefined);

// Event name for auth state changes
const AUTH_STATE_CHANGE_EVENT = 'auth-state-change';

// Custom event for auth state changes
const createAuthStateChangeEvent = (user: User | null) => {
  return new CustomEvent(AUTH_STATE_CHANGE_EVENT, { detail: { user } });
};

export function AuthStateProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to check authentication status
  const checkAuth = async () => {
    try {
      setLoading(true);
      // First check localStorage
      const storedUser = localStorage.getItem('auth-user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUserState(parsedUser);
          // Still verify with the server in the background
          await verifyWithServer();
          return;
        } catch (e) {
          console.error('Error parsing stored user:', e);
          localStorage.removeItem('auth-user');
        }
      }
      
      // If no stored user or parsing failed, check with server
      await verifyWithServer();
    } catch (error) {
      console.error('Error checking auth:', error);
      setUserState(null);
      localStorage.removeItem('auth-user');
    } finally {
      setLoading(false);
    }
  };

  // Verify authentication with the server
  const verifyWithServer = async () => {
    try {
      const response = await fetch('/api/auth/check-session');
      if (response.ok) {
        const data = await response.json();
        const serverUser = data.user;
        
        // Update localStorage and state if user changed
        if (serverUser) {
          localStorage.setItem('auth-user', JSON.stringify(serverUser));
          setUserState(serverUser);
        } else {
          localStorage.removeItem('auth-user');
          setUserState(null);
        }
      } else {
        localStorage.removeItem('auth-user');
        setUserState(null);
      }
    } catch (error) {
      console.error('Error verifying with server:', error);
      localStorage.removeItem('auth-user');
      setUserState(null);
    }
  };

  // Function to set user and dispatch event
  const setUser = (newUser: User | null) => {
    if (newUser) {
      localStorage.setItem('auth-user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('auth-user');
    }
    setUserState(newUser);
    window.dispatchEvent(createAuthStateChangeEvent(newUser));
  };

  // Function to handle logout
  const logout = async () => {
    try {
      // Call logout API endpoint
      await fetch('/api/auth/logout', { method: 'POST' });
      // Clear local state
      localStorage.removeItem('auth-user');
      setUserState(null);
      window.dispatchEvent(createAuthStateChangeEvent(null));
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Listen for auth state changes from other tabs/components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-user') {
        if (e.newValue) {
          try {
            const newUser = JSON.parse(e.newValue);
            setUserState(newUser);
          } catch (error) {
            console.error('Error parsing user from storage event:', error);
          }
        } else {
          setUserState(null);
        }
      }
    };

    const handleAuthStateChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ user: User | null }>;
      setUserState(customEvent.detail.user);
    };

    // Check auth on mount
    checkAuth();

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange);

    // Clean up
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange);
    };
  }, []);

  return (
    <AuthStateContext.Provider value={{ user, loading, checkAuth, setUser, logout }}>
      {children}
    </AuthStateContext.Provider>
  );
}

export function useAuthState() {
  const context = useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error('useAuthState must be used within an AuthStateProvider');
  }
  return context;
}

// Utility function to wrap the app with the provider
export function withAuthState<T extends object>(Component: React.ComponentType<T>) {
  return function WithAuthState(props: T) {
    return (
      <AuthStateProvider>
        <Component {...props} />
      </AuthStateProvider>
    );
  };
}
