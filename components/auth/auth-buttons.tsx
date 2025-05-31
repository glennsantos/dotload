'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  email: string;
  name?: string;
}

export function AuthButtons() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        // Use the appropriate API endpoint to check user session
        const response = await fetch('/api/auth/check-session');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user || null);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

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
