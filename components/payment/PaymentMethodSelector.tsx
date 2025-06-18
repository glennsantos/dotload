'use client';

import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import CreditCardForm from './CreditCardForm';
import EWalletForm from './EWalletForm'; // Assuming you have this component

interface PaymentMethodSelectorProps {
  purchaseId: string;
  amount: number;
  currency: string;
  email: string;
  phoneNumber: string;
  onSuccess: (accessCode: string) => void;
  onError: (message: string) => void;
}

type PaymentMethod = 'card' | 'gcash' | 'grabpay' | 'shopeepay' | 'paymaya';

export default function PaymentMethodSelector({
  purchaseId,
  amount,
  currency,
  email,
  phoneNumber,
  onSuccess,
  onError
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Select Payment Method</h3>
        <RadioGroup 
          value={selectedMethod} 
          onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted cursor-pointer">
            <RadioGroupItem value="card" id="card" />
            <Label htmlFor="card" className="flex items-center cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Credit / Debit Card
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted cursor-pointer">
            <RadioGroupItem value="gcash" id="gcash" />
            <Label htmlFor="gcash" className="flex items-center cursor-pointer">
              <img src="/images/gcash-logo.png" alt="GCash" className="h-5 w-5 mr-2" />
              GCash
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted cursor-pointer">
            <RadioGroupItem value="grabpay" id="grabpay" />
            <Label htmlFor="grabpay" className="flex items-center cursor-pointer">
              <img src="/images/grabpay-logo.png" alt="GrabPay" className="h-5 w-5 mr-2" />
              GrabPay
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted cursor-pointer">
            <RadioGroupItem value="shopeepay" id="shopeepay" />
            <Label htmlFor="shopeepay" className="flex items-center cursor-pointer">
              <img src="/images/shopeepay-logo.png" alt="ShopeePay" className="h-5 w-5 mr-2" />
              ShopeePay
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted cursor-pointer">
            <RadioGroupItem value="paymaya" id="paymaya" />
            <Label htmlFor="paymaya" className="flex items-center cursor-pointer">
              <img src="/images/paymaya-logo.png" alt="PayMaya" className="h-5 w-5 mr-2" />
              PayMaya
            </Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="mt-6">
        {selectedMethod === 'card' ? (
          <CreditCardForm
            purchaseId={purchaseId}
            amount={amount}
            currency={currency}
            email={email}
            phoneNumber={phoneNumber}
            onSuccess={onSuccess}
            onError={onError}
          />
        ) : (
          <EWalletForm
            purchaseId={purchaseId}
            amount={amount}
            currency={currency}
            ewalletType={selectedMethod.toUpperCase() as any}
            onSuccess={onSuccess}
            onError={onError}
          />
        )}
      </div>
    </div>
  );
}
