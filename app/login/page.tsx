"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import AuthHeader from '@/components/auth/AuthHeader';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isVerificationNeeded, setIsVerificationNeeded] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the callback URL if it exists
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  // Check for verified=true in URL params (redirected from email verification)
  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      setSuccess('Email verified successfully! You can now log in.');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsVerificationNeeded(false);
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // The server will set the HTTP-only cookie automatically
        // No need to store the token in localStorage
        console.log('Login successful - cookie set by server');
        
        // Dispatch auth:login event to update UI components
        window.dispatchEvent(new CustomEvent('auth:login', {
          detail: { user: data.user }
        }));
        
        // Check if user is primarily a buyer (has purchases but no products)
        try {
          const statusResponse = await fetch('/api/auth/user-status', {
            method: 'GET',
            credentials: 'include', // Include cookies for authentication
          });
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            
            // If the API recommends a different redirect, use that instead
            if (statusData.recommendedRedirect && statusData.recommendedRedirect !== '/dashboard') {
              // Use window.location for a full page reload to ensure clean state
              window.location.href = statusData.recommendedRedirect;
              return;
            }
          }
        } catch (statusError) {
          console.error('Error checking user status:', statusError);
          // Continue with normal redirect if status check fails
        }
        
        // Default redirect behavior if status check fails or no special redirect needed
        // Use window.location for a full page reload to ensure clean state
        window.location.href = decodeURI(callbackUrl);
      } else if (response.status === 403 && data.requiresVerification) {
        // Handle unverified email
        setIsVerificationNeeded(true);
        setVerificationEmail(data.email || email);
        setError('Your email address has not been verified.');
      } else {
        // Handle other login failures
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  const handleResendVerification = async () => {
    if (!verificationEmail) return;
    
    setIsResendingVerification(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: verificationEmail }),
      });

      if (response.ok) {
        setSuccess('Verification email sent! Please check your inbox.');
        setIsVerificationNeeded(false);
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send verification email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setIsResendingVerification(false);
    }
  };

  return (
    <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
      <div className="flex flex-col items-center mb-8">
        <Link href="/" className="mb-4">
          <Image 
            src="/logo.png" 
            alt="Alacart Logo" 
            width={100} 
            height={21} 
            className="h-auto mb-8"
            priority
          />
        </Link>
        <h1 className="text-4xl font-extralight mb-4">Welcome Back</h1>
        <p className="text-stone-600 font-light">
          Sign in to your account
        </p>
      </div>
      <Card className="w-full max-w-md py-8">
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4 rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              
              {isVerificationNeeded && (
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full rounded-2xl border-stone-300 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-light" 
                    onClick={handleResendVerification}
                    disabled={isResendingVerification}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {isResendingVerification ? 'Sending...' : 'Resend verification email'}
                  </Button>
                </div>
              )}
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 bg-emerald-50 text-emerald-800 border-emerald-200 rounded-xl">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-stone-700 font-light">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="border-stone-300 rounded-2xl h-12 font-light focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-stone-700 font-light">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="border-stone-300 rounded-2xl h-12 font-light focus:border-emerald-500 focus:ring-emerald-500"
              />
              <Link href="/forgot-password" className="text-xs text-emerald-600 hover:text-emerald-700 mt-1 block text-right font-light">
                Forgot password?
              </Link>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 font-light" 
              disabled={isLoggingIn}>
              {isLoggingIn ? (
                <span className="flex items-center font-light">Signing in... <ArrowRight className="ml-2 h-4 w-4 animate-pulse" /></span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          <div className="text-center mt-4 text-sm text-stone-600 font-light">
            Don't have an account? {' '}
            <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-light">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
