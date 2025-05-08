"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors or registration failures
        setError(data.error || 'Registration failed');
        return;
      }

      // Registration successful, show verification message
      setSuccess('Registration successful! Please check your email to verify your account.');
      setRegisteredEmail(email);
      // Clear the form
      setEmail('');
      setPassword('');
      setName('');
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResendVerification = async () => {
    if (!registeredEmail) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: registeredEmail }),
      });

      if (response.ok) {
        setSuccess('Verification email sent again! Please check your inbox.');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send verification email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Register to start selling your digital products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{success}</p>
                {registeredEmail && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2" 
                    onClick={handleResendVerification}
                    disabled={isSubmitting}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Sending...' : 'Resend verification email'}
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
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
                placeholder="Create a strong password"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <a href="/login" className="underline">
              Log in
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
