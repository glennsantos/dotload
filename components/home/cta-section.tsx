'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuthState } from '@/hooks/use-auth-state';

export function CTASection() {
  const { user } = useAuthState();

  return (
    <section className="py-16 bg-card text-card-foreground text-center border-t border-border">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-4">
          Ready to sell your digital products?
        </h2>
        <p className="text-xl text-muted-foreground mb-8">
          Join thousands of creators who trust Dotload
        </p>
        <Button
          asChild
          size="lg"
          className="text-lg py-6 px-8"
        >
          <Link href="/register">
            Get Started Free
          </Link>
        </Button>
      </div>
    </section>
  );
}
