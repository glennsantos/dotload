import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface EWalletPaymentFormProps {
  productId: string;
  purchaseId: string;
  amount: number;
  currency?: string;
}

export default function EWalletPaymentForm({ 
  productId, 
  purchaseId, 
  amount, 
  currency = 'PHP' 
}: EWalletPaymentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [mobileNumber, setMobileNumber] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobileNumber) {
      toast.error('Please enter your mobile number');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/payments/xendit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchaseId,
          paymentMethod,
          mobileNumber,
          amount,
          currency
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
      } else if (data.redirectUrl) {
        // For backward compatibility
        console.log(`Redirecting to: ${data.redirectUrl}`);
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
        <Label>Select Payment Method</Label>
        <RadioGroup 
          value={paymentMethod} 
          onValueChange={setPaymentMethod}
          className="grid grid-cols-2 gap-4"
        >
          <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted">
            <RadioGroupItem value="gcash" id="gcash" />
            <Label htmlFor="gcash" className="cursor-pointer">GCash</Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted">
            <RadioGroupItem value="grabpay" id="grabpay" />
            <Label htmlFor="grabpay" className="cursor-pointer">GrabPay</Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted">
            <RadioGroupItem value="shopeepay" id="shopeepay" />
            <Label htmlFor="shopeepay" className="cursor-pointer">ShopeePay</Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted">
            <RadioGroupItem value="maya" id="maya" />
            <Label htmlFor="maya" className="cursor-pointer">Maya</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="mobileNumber">Mobile Number</Label>
        <Input
          id="mobileNumber"
          type="tel"
          placeholder="e.g. 09123456789"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          required
        />
        <p className="text-sm text-gray-500">
          Enter the mobile number associated with your e-wallet account
        </p>
      </div>
      
      <div className="pt-4">
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Processing...' : `Pay ${currency} ${amount.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
}
