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

export function CTASection() {
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
    <section className="py-16 bg-stone-900 text-white text-center">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-light mb-4">
          Ready to Start Selling?
        </h2>
        <p className="mb-8">
          Join thousands of creators already using Alacart
        </p>
        <Button
          asChild
          variant="default" 
          size="lg" 
          className="text-lg py-6 px-8"
        >
          <Link href={user ? "/create-product" : "/register"} className="flex items-center gap-2">
            {user ? 'Create New Product' : 'Get Started Free'} <ArrowRight size={18} />
          </Link>
        </Button>
      </div>
    </section>
  );
}
