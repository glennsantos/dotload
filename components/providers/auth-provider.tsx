'use client';

import { ReactNode } from 'react';
import { AuthStateProvider } from '@/hooks/use-auth-state';

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthStateProvider>{children}</AuthStateProvider>;
}
