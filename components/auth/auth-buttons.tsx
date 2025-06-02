'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthState } from '@/hooks/use-auth-state';

export function AuthButtons() {
  const { user, loading } = useAuthState();

  if (loading) {
    // Return a minimal loading state to avoid layout shift
    return <div className="flex items-center gap-3 opacity-0">Loading...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Button asChild variant="default">
          <Link href="/dashboard">
            <span>Dashboard</span>
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button asChild variant="outline">
        <Link href="/login">Sign In</Link>
      </Button>
      <Button asChild variant="default">
        <Link href="/register">Get Started</Link>
      </Button>
    </div>
  );
}
