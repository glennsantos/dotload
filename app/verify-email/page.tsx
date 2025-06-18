"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setVerificationStatus('error');
      setErrorMessage('Verification token is missing');
      return;
    }

    // Verify the email token
    const verifyEmail = async () => {
      try {
        // Add a timeout to the fetch to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(`/api/auth/verify-email?token=${token}`, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Verification successful:', data);
          setVerificationStatus('success');
          // Redirect to login page after 3 seconds
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 3000);
        } else {
          const data = await response.json();
          console.error('Verification API error response:', data);
          setVerificationStatus('error');
          setErrorMessage(data.error || 'Failed to verify email');
        }
      } catch (error) {
        const errorObj = {
          error,
          token,
          timestamp: new Date().toISOString(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : ''
        };
        console.error('Email verification client error:', errorObj);
        setVerificationStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred during verification');
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Email Verification
          </h2>
        </div>
        
        <div className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow">
          {verificationStatus === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Verifying your email...</p>
            </div>
          )}
          
          {verificationStatus === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <p className="mt-4 text-lg font-medium text-foreground">Email verified successfully!</p>
              <p className="mt-2 text-muted-foreground">You will be redirected to the login page shortly.</p>
              <Link href="/login" className="mt-4 inline-block text-primary hover:underline">
                Click here if you are not redirected
              </Link>
            </div>
          )}
          
          {verificationStatus === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="mt-4 text-lg font-medium text-foreground">Verification failed</p>
              <p className="mt-2 text-muted-foreground">{errorMessage}</p>
              <div className="mt-4 space-y-2">
                <p>You can:</p>
                <Link href="/login" className="block text-primary hover:underline">
                  Go to login page
                </Link>
                <button 
                  onClick={async () => {
                    try {
                      const email = prompt('Please enter your email to resend verification link:');
                      if (!email) return;
                      
                      // Add timeout protection
                      const controller = new AbortController();
                      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
                      
                      const response = await fetch('/api/auth/verify-email', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Cache-Control': 'no-cache',
                          'Pragma': 'no-cache'
                        },
                        body: JSON.stringify({ email }),
                        signal: controller.signal
                      });
                      
                      clearTimeout(timeoutId);
                      
                      if (response.ok) {
                        const data = await response.json();
                        console.log('Resend verification response:', data);
                        alert('Verification email sent. Please check your inbox.');
                      } else {
                        const data = await response.json();
                        console.error('Resend verification error:', data);
                        alert(data.error || 'Failed to send verification email');
                      }
                    } catch (error) {
                      const errorObj = {
                        error,
                        timestamp: new Date().toISOString(),
                        errorMessage: error instanceof Error ? error.message : 'Unknown error',
                        stack: error instanceof Error ? error.stack : ''
                      };
                      console.error('Error resending verification:', errorObj);
                      alert(error instanceof Error ? `Error: ${error.message}` : 'An unexpected error occurred');
                    }
                  }}
                  className="block text-primary hover:underline"
                >
                  Resend verification email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
