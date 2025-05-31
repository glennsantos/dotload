'use client';

import { ReactNode, useEffect } from 'react';
import { AuthStateProvider, useAuthState } from '@/hooks/use-auth-state';

interface User {
  id: string;
  email: string;
  name?: string;
}

// This component initializes the auth state with server-provided user data
function AuthStateInitializer({ 
  initialUser, 
  children 
}: { 
  initialUser: User | null;
  children: ReactNode;
}) {
  const { setUser } = useAuthState();
  
  // Initialize auth state with server data on mount
  useEffect(() => {
    if (initialUser) {
      // Store the initial user in localStorage and auth state
      localStorage.setItem('auth-user', JSON.stringify(initialUser));
      setUser(initialUser);
    }
  }, [initialUser, setUser]);
  
  return <>{children}</>;
}

// Wrapper component that provides auth state and initializes it
export function AuthProviderWrapper({ 
  initialUser, 
  children 
}: { 
  initialUser: User | null;
  children: ReactNode;
}) {
  return (
    <AuthStateProvider>
      <AuthStateInitializer initialUser={initialUser}>
        {children}
      </AuthStateInitializer>
    </AuthStateProvider>
  );
}
