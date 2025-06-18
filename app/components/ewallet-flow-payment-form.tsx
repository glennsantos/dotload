"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface EWalletFlowPaymentFormProps {
  productId: string;
  purchaseId: string;
  amount: number;
  currency?: string;
}

export default function EWalletFlowPaymentForm({ 
  productId, 
  purchaseId, 
  amount, 
  currency = 'PHP' 
}: EWalletFlowPaymentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('ewallet-flow');
  const [mobileNumber, setMobileNumber] = useState('');
  const [channelCode, setChannelCode] = useState('OVO');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobileNumber) {
      toast.error('Please enter your mobile number');
      return;
    }
    
    setLoading(true);
    
    try {
      // Step 1: Create a Customer and Payment Method
      const response = await fetch('/api/payments/xendit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchaseId,
          paymentMethod: 'ewallet-flow', // Use the new flow
          mobileNumber,
          amount,
          currency,
          channelCode
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payment');
      }
      
      // Handle the redirect response from the API
      if (data.redirect && data.redirectUrl) {
        console.log(`Redirecting to: ${data.redirectUrl}`);
        // Use window.location.href for a full page redirect
        window.location.href = data.redirectUrl;
      } else if (data.requiresAction && data.actionUrl) {
        // Redirect to the authentication URL for account linking
        console.log('Redirecting to authentication URL:', data.actionUrl);
        window.location.href = data.actionUrl;
      } else if (data.redirectUrl) {
        // For backward compatibility
        console.log('Redirecting to payment gateway:', data.redirectUrl);
        window.location.href = data.redirectUrl;
      } else {
        toast.error('No redirect URL provided');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Label>Select eWallet Provider</Label>
        <RadioGroup 
          value={channelCode} 
          onValueChange={setChannelCode}
          className="grid grid-cols-2 gap-4"
        >
          <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted">
            <RadioGroupItem value="OVO" id="ovo" />
            <Label htmlFor="ovo" className="cursor-pointer">OVO</Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted">
            <RadioGroupItem value="DANA" id="dana" />
            <Label htmlFor="dana" className="cursor-pointer">DANA</Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted">
            <RadioGroupItem value="SHOPEEPAY" id="shopeepay" />
            <Label htmlFor="shopeepay" className="cursor-pointer">ShopeePay</Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted">
            <RadioGroupItem value="LINKAJA" id="linkaja" />
            <Label htmlFor="linkaja" className="cursor-pointer">LinkAja</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="mobileNumber">Mobile Number</Label>
        <Input
          id="mobileNumber"
          type="tel"
          placeholder="e.g. +628774494404"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          required
        />
        <p className="text-sm text-gray-500">
          Enter your mobile number with country code (e.g., +62 for Indonesia)
        </p>
      </div>
      
      <div className="pt-4">
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Processing...' : `Pay ${currency} ${amount.toFixed(2)}`}
        </Button>
      </div>
      
      <div className="text-sm text-muted-foreground mt-4 p-4 bg-muted rounded-md">
        <h3 className="font-medium mb-2">How it works:</h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li>You'll be redirected to link your eWallet account</li>
          <li>Authorize the connection to your eWallet</li>
          <li>Complete the payment</li>
          <li>Return to this site to access your purchase</li>
        </ol>
      </div>
    </form>
  );
}
