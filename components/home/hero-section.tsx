'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name?: string;
}

export function HeroSection() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
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

  return (
    <section className="py-32 text-center">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl lg:text-6xl text-stone-900 mb-8 leading-tight">
          <span className="block font-extralight">Create Professional</span>
          <span className="text-7xl block font-medium">Checkout Pages</span>
          <span className="block font-extralight">in Minutes</span>
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-stone-600 mb-12">
          The fastest way to sell digital and physical products online. Build stunning,
          conversion-optimized checkout pages with zero coding required.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          {loading ? (
            <div className="h-14 opacity-0">Loading...</div>
          ) : user ? (
            <>
              <Button asChild variant="default" size="lg" className="text-lg py-6 px-8">
                <Link href="/create-product" className="flex items-center gap-2">
                  Create New Product <ArrowRight size={18} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg py-6 px-8">
                <Link href="/dashboard" className="flex items-center gap-2">
                  View Dashboard 
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="default" size="lg" className="text-lg py-6 px-8">
                <Link href="/register" className="flex items-center gap-2">
                  Get Started Free <ArrowRight size={18} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg py-6 px-8">
                <Link href="/login">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
