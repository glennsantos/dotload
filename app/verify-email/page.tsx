"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

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
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        
        if (response.ok) {
          setVerificationStatus('success');
          // Redirect to login page after 3 seconds
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 3000);
        } else {
          const data = await response.json();
          setVerificationStatus('error');
          setErrorMessage(data.error || 'Failed to verify email');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setVerificationStatus('error');
        setErrorMessage('An unexpected error occurred');
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>
        
        <div className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow">
          {verificationStatus === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
              <p className="mt-4 text-gray-600">Verifying your email...</p>
            </div>
          )}
          
          {verificationStatus === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-4 text-lg font-medium text-gray-900">Email verified successfully!</p>
              <p className="mt-2 text-gray-600">You will be redirected to the login page shortly.</p>
              <Link href="/login" className="mt-4 inline-block text-blue-600 hover:underline">
                Click here if you are not redirected
              </Link>
            </div>
          )}
          
          {verificationStatus === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="mt-4 text-lg font-medium text-gray-900">Verification failed</p>
              <p className="mt-2 text-gray-600">{errorMessage}</p>
              <div className="mt-4 space-y-2">
                <p>You can:</p>
                <Link href="/login" className="block text-blue-600 hover:underline">
                  Go to login page
                </Link>
                <button 
                  onClick={async () => {
                    try {
                      const email = prompt('Please enter your email to resend verification link:');
                      if (!email) return;
                      
                      const response = await fetch('/api/auth/verify-email', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email }),
                      });
                      
                      if (response.ok) {
                        alert('Verification email sent. Please check your inbox.');
                      } else {
                        const data = await response.json();
                        alert(data.error || 'Failed to send verification email');
                      }
                    } catch (error) {
                      console.error('Error resending verification:', error);
                      alert('An unexpected error occurred');
                    }
                  }}
                  className="block text-blue-600 hover:underline"
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
