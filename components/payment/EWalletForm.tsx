'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface EWalletFormProps {
  purchaseId: string;
  amount: number;
  currency: string;
  ewalletType: 'GCASH' | 'GRABPAY' | 'SHOPEEPAY' | 'PAYMAYA';
  onSuccess: (accessCode: string) => void;
  onError: (message: string) => void;
}

export default function EWalletForm({
  purchaseId,
  amount,
  currency,
  ewalletType,
  onSuccess,
  onError
}: EWalletFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Validate mobile number
    if (!mobileNumber.trim()) {
      setError('Mobile number is required');
      setIsLoading(false);
      return;
    }
    
    // Validate email
    if (!email.trim() || !email.includes('@')) {
      setError('Valid email is required');
      setIsLoading(false);
      return;
    }
    
    // Validate name
    if (!name.trim()) {
      setError('Name is required');
      setIsLoading(false);
      return;
    }
    
    try {
      // Call the API to initiate e-wallet payment
      const response = await fetch('/api/payments/xendit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchaseId,
          paymentMethod: `ewallet_${ewalletType.toLowerCase()}`,
          mobileNumber,
          amount,
          currency,
          channelCode: ewalletType,
          email,
          name
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Payment processing failed');
      }
      
      // Handle redirect to e-wallet
      if (data.actions && data.actions.length > 0) {
        const checkoutAction = data.actions.find(
          (action: any) => action.action === 'CHECKOUT_URL'
        );
        
        if (checkoutAction && checkoutAction.url) {
          // Redirect to e-wallet checkout
          window.location.href = checkoutAction.url;
          return;
        }
      }
      
      // If payment is already completed
      if (data.success && data.accessCode) {
        onSuccess(data.accessCode);
      } else if (data.paymentId) {
        // Payment is pending, poll for status
        pollPaymentStatus(data.paymentId);
      } else {
        throw new Error('Invalid response from payment server');
      }
    } catch (error) {
      console.error('E-wallet payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment processing failed');
      setIsLoading(false);
      onError(error instanceof Error ? error.message : 'Payment processing failed');
    }
  };
  
  // Poll for payment status
  const pollPaymentStatus = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/xendit/status?paymentId=${paymentId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Payment status check failed');
      }
      
      if (data.status === 'completed' && data.accessCode) {
        // Payment completed
        onSuccess(data.accessCode);
      } else if (data.status === 'failed') {
        // Payment failed
        throw new Error(data.message || 'Payment failed');
      } else {
        // Payment still pending, poll again after a delay
        setTimeout(() => pollPaymentStatus(paymentId), 2000);
      }
    } catch (error) {
      console.error('Payment status check error:', error);
      setError(error instanceof Error ? error.message : 'Payment processing failed');
      setIsLoading(false);
      onError(error instanceof Error ? error.message : 'Payment processing failed');
    }
  };
  
  // Get e-wallet logo and name
  const getEWalletInfo = () => {
    switch (ewalletType) {
      case 'GCASH':
        return { name: 'GCash', logo: '/images/gcash-logo.png' };
      case 'GRABPAY':
        return { name: 'GrabPay', logo: '/images/grabpay-logo.png' };
      case 'SHOPEEPAY':
        return { name: 'ShopeePay', logo: '/images/shopeepay-logo.png' };
      case 'PAYMAYA':
        return { name: 'PayMaya', logo: '/images/paymaya-logo.png' };
      default:
        return { name: 'E-Wallet', logo: '' };
    }
  };
  
  const { name: walletName, logo } = getEWalletInfo();
  
  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {logo && <img src={logo} alt={walletName} className="h-6 w-6 mr-2" />}
            {walletName} Payment
          </CardTitle>
          <CardDescription>
            Enter your details to complete the purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                placeholder="+639123456789"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the mobile number registered with your {walletName} account
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay with ${walletName} ${new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currency,
                }).format(amount)}`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
