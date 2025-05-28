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
import { setAuthToken } from '@/lib/client-auth';

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
        // Store the token in localStorage for client-side auth
        if (data.token) {
          setAuthToken(data.token);
          console.log('Auth token stored in localStorage');
        }
        
        // Dispatch auth:login event to update UI components
        window.dispatchEvent(new CustomEvent('auth:login', {
          detail: { user: data.user }
        }));
        
        // Use window.location for a full page reload to ensure clean state
        // This helps ensure the cookie is properly set before navigation
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
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-stone-800">Welcome Back</CardTitle>
          <CardDescription className="text-stone-600 font-light">
            Log in to access your alaCart products
          </CardDescription>
        </CardHeader>
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
                <span className="flex items-center font-light">Logging in... <ArrowRight className="ml-2 h-4 w-4 animate-pulse" /></span>
              ) : (
                'Log In'
              )}
            </Button>
          </form>
          <div className="text-center mt-4 text-sm text-stone-600 font-light">
            Don't have an account? {' '}
            <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-light">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
