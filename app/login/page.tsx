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
  const callbackUrl = searchParams.get('callbackUrl') || '/products';
  
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
        // Dispatch auth:login event to update UI components
        window.dispatchEvent(new CustomEvent('auth:login', {
          detail: { user: data.user }
        }));
        // Redirect to callback URL or dashboard on successful login
        router.push(decodeURI(callbackUrl));
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
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>
            Log in to access your alaCarte products
            {callbackUrl !== '/products' && (
              <div className="mt-2 text-xs flex items-center text-muted-foreground">
                <span>You'll be redirected to: </span>
                <span className="ml-1 font-medium truncate">{decodeURI(callbackUrl)}</span>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              
              {isVerificationNeeded && (
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full" 
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
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline mt-1 block text-right">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <span className="flex items-center">Logging in... <ArrowRight className="ml-2 h-4 w-4 animate-pulse" /></span>
              ) : (
                'Log In'
              )}
            </Button>
          </form>
          <div className="text-center mt-4 text-sm">
            Don't have an account? {' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
