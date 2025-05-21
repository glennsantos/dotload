'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Declare Xendit types
declare global {
  interface Window {
    Xendit: {
      setPublishableKey: (key: string) => void;
      card: {
        validateCardNumber: (cardNumber: string) => boolean;
        validateExpiry: (month: string, year: string) => boolean;
        validateCvn: (cvn: string) => boolean;
        createToken: (
          data: {
            amount: number;
            card_number: string;
            card_exp_month: string;
            card_exp_year: string;
            card_cvn: string;
            is_multiple_use: boolean;
            external_id: string;
            should_authenticate: boolean;
            card_holder_email: string;
            card_holder_first_name: string;
            card_holder_last_name: string;
            card_holder_phone_number: string;
          },
          callback: (err: any, response: any) => void
        ) => void;
      };
    };
  }
}

interface CreditCardFormProps {
  purchaseId: string;
  amount: number;
  currency: string;
  email: string;
  phoneNumber: string;
  onSuccess: (accessCode: string) => void;
  onError: (message: string) => void;
}

export default function CreditCardForm({
  purchaseId,
  amount,
  currency,
  email,
  phoneNumber,
  onSuccess,
  onError
}: CreditCardFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showThreeDSFrame, setShowThreeDSFrame] = useState(false);
  const [threeDSUrl, setThreeDSUrl] = useState('');
  const [tokenId, setTokenId] = useState<string | null>(null);
  
  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpMonth, setCardExpMonth] = useState('');
  const [cardExpYear, setCardExpYear] = useState('');
  const [cardCvn, setCardCvn] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cardholderEmail, setCardholderEmail] = useState(email);
  const [cardholderPhone, setCardholderPhone] = useState(phoneNumber);
  
  // Load Xendit.js
  useEffect(() => {
    console.log('[CreditCardForm] Initializing Xendit.js');
    const script = document.createElement('script');
    script.src = 'https://js.xendit.co/v1/xendit.min.js';
    script.async = true;
    script.onload = () => {
      console.log('[CreditCardForm] Xendit.js loaded successfully');
      // Get the public key from environment variable
      const publicKey = process.env.NEXT_PUBLIC_XENDIT_PUBLIC_KEY;
      if (publicKey) {
        console.log('[CreditCardForm] Setting Xendit publishable key');
        window.Xendit.setPublishableKey(publicKey);
        console.log('[CreditCardForm] Xendit initialized successfully');
      } else {
        console.error('[CreditCardForm] Xendit public key not found');
        setError('Payment configuration error. Please contact support.');
      }
    };
    
    script.onerror = () => {
      console.error('[CreditCardForm] Failed to load Xendit.js');
      setError('Failed to load payment system. Please refresh and try again.');
    };
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);
  
  // Handle form submission - this initiates the tokenization process
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsTokenizing(true);
    setError(null);
    console.log('[CreditCardForm] Form submitted, starting tokenization process');
    console.log('[CreditCardForm] Purchase ID:', purchaseId);
    console.log('[CreditCardForm] Amount:', amount, currency);
    
    // Validate card details
    if (!window.Xendit) {
      console.error('[CreditCardForm] Xendit.js not loaded');
      setError('Payment system not loaded. Please refresh the page and try again.');
      setIsLoading(false);
      setIsTokenizing(false);
      return;
    }
    
    console.log('[CreditCardForm] Xendit.js is loaded, proceeding with validation');
    
    // Validate card number
    console.log('[CreditCardForm] Validating card number');
    if (!window.Xendit.card.validateCardNumber(cardNumber)) {
      console.error('[CreditCardForm] Invalid card number');
      setError('Invalid card number');
      setIsLoading(false);
      setIsTokenizing(false);
      return;
    }
    console.log('[CreditCardForm] Card number validation passed');
    
    // Validate expiry date
    console.log('[CreditCardForm] Validating expiry date:', cardExpMonth, cardExpYear);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-indexed
    
    // Convert year to 4-digit format if needed (YY to YYYY)
    const fullYear = cardExpYear.length === 2 
      ? 2000 + parseInt(cardExpYear, 10) 
      : parseInt(cardExpYear, 10);
      
    const expiryMonth = parseInt(cardExpMonth, 10);
    
    if (expiryMonth < 1 || expiryMonth > 12) {
      setError('Invalid expiry month');
      return;
    }
    
    // Create a date object for the last day of the expiry month
    const expiryDate = new Date(fullYear, expiryMonth, 0);
    const currentDate = new Date();
    
    if (expiryDate <= currentDate) {
      setError('Card has expired');
      return;
    }
    
    // Validate CVN
    console.log('[CreditCardForm] Validating CVN');
    if (!window.Xendit.card.validateCvn(cardCvn)) {
      console.error('[CreditCardForm] Invalid CVN');
      setError('Invalid CVN');
      setIsLoading(false);
      setIsTokenizing(false);
      return;
    }
    console.log('[CreditCardForm] CVN validation passed');
    
    // Validate other fields
    if (!cardholderName.trim()) {
      setError('Cardholder name is required');
      setIsLoading(false);
      setIsTokenizing(false);
      return;
    }

    const formatPhoneNumber = (phone: string): string => {
      const trimmedPhone = phone.trim();

      // If it already starts with +, assume it's an attempt at E.164.
      // Clean it to ensure it's `+` followed by digits only.
      if (trimmedPhone.startsWith('+')) {
        const digitsAfterPlus = trimmedPhone.substring(1).replace(/\D/g, '');
        return `+${digitsAfterPlus}`;
      }

      // No '+', so process as a local or national number.
      // Remove all non-digits.
      const digits = trimmedPhone.replace(/\D/g, '');

      // Priority 1: PH local mobile format starting with '09' (e.g., 09xxxxxxxxx)
      if (digits.startsWith('09') && digits.length === 11) {
        return `+63${digits.substring(1)}`;
      }

      // Priority 2: PH national mobile format (e.g., 9xxxxxxxxx, 10 digits)
      if (digits.length === 10 && digits.startsWith('9')) {
        return `+63${digits}`;
      }

      // Priority 3: Number starts with a country code (e.g., 63 for PH, 1 for US) but is missing the '+'
      // This regex /^[1-9]\d{6,14}$/ checks if it starts with a non-zero digit
      // (like a country code) and has a total length of 7-15 digits (typical for international numbers).
      if (/^[1-9]\d{6,14}$/.test(digits)) {
          return `+${digits}`;
      }
      
      // Fallback: return cleaned digits. The E.164 regex check after this function will determine validity.
      return digits; 
    };

    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    // Validate E.164 format
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(formattedPhone)) {
      setError('Invalid phone number format. Please include country code (e.g., +63XXXXXXXXXX)');
      setIsLoading(false);
      setIsTokenizing(false);
      return;
    }
    
    if (!email.trim() || !email.includes('@')) {
      setError('Valid email is required');
      setIsLoading(false);
      setIsTokenizing(false);
      return;
    }
    
    if (!formattedPhone.trim()) {
      setError('Phone number is required');
      setIsLoading(false);
      setIsTokenizing(false);
      return;
    }
    
    // Create external ID
    const externalId = `card_${purchaseId}_${Date.now()}`;
    console.log('[CreditCardForm] Generated external ID:', externalId);
    
    console.log('[CreditCardForm] Starting card tokenization with Xendit');
    // Create token with Xendit
    // Format phone number to E.164 format (e.g., +631234567890)
    
    
    // Prepare the card data for tokenization
    const cardData = {
      amount: amount,
      card_number: cardNumber.replace(/\s+/g, ''),
      card_exp_month: expiryMonth.toString().padStart(2, '0'),
      card_exp_year: fullYear.toString(),
      card_cvn: cardCvn,
      is_multiple_use: false,
      external_id: externalId,
      should_authenticate: true,
      card_holder_email: email,
      card_holder_first_name: cardholderName.split(' ')[0],
      card_holder_last_name: cardholderName.split(' ').slice(1).join(' ') || cardholderName.split(' ')[0],
      card_holder_phone_number: formattedPhone
    };
    
    window.Xendit.card.createToken(cardData, (err: any, creditCardToken: any) => {
      console.log('[CreditCardForm] Received response from Xendit tokenization');
      if (err) {
        console.error('[CreditCardForm] Tokenization error:', err);
        setError(err.message || 'Error processing card. Please try again.');
        setIsLoading(false);
        setIsTokenizing(false);
        return;
      }
      
      console.log('[CreditCardForm] Tokenization successful, token status:', creditCardToken.status);
      
      setTokenId(creditCardToken.id);
      console.log('[CreditCardForm] Token ID set:', creditCardToken.id);
      
      if (creditCardToken.status === 'VERIFIED') {
        console.log('[CreditCardForm] Token verified, proceeding to payment');
        // Token is verified, process the payment
        processPayment(creditCardToken.id);
      } else if (creditCardToken.status === 'IN_REVIEW') {
        console.log('[CreditCardForm] 3DS authentication required');
        console.log('[CreditCardForm] 3DS URL:', creditCardToken.payer_authentication_url);
        // 3DS authentication required
        setThreeDSUrl(creditCardToken.payer_authentication_url);
        setShowThreeDSFrame(true);
        
        console.log('[CreditCardForm] Setting up 3DS message listener');
        // Set up message listener for 3DS completion
        window.addEventListener('message', async (event) => {
          console.log('[CreditCardForm] Received message event:', event.data);
          // Check if the message is from Xendit
          if (event.data && event.data.xendit_3ds_status) {
            console.log('[CreditCardForm] 3DS status received:', event.data.xendit_3ds_status);
            setShowThreeDSFrame(false);
            
            if (event.data.xendit_3ds_status === 'success') {
              console.log('[CreditCardForm] 3DS verification successful');
              // 3DS verification successful, process payment with token
              processPayment(creditCardToken.id);
            } else {
              console.error('[CreditCardForm] 3DS verification failed');
              // 3DS verification failed
              setError('3D Secure verification failed. Please try again.');
              setIsLoading(false);
              setIsTokenizing(false);
            }
          }
        }, { once: true });
      } else if (creditCardToken.status === 'FAILED') {
        console.error('[CreditCardForm] Token creation failed:', creditCardToken.failure_reason);
        setError(creditCardToken.failure_reason || 'Card verification failed. Please try another card.');
        setIsLoading(false);
        setIsTokenizing(false);
      } else {
        console.log('[CreditCardForm] Unexpected token status:', creditCardToken.status);
      }
    });
  };
  
  // Process payment with token
  const processPayment = async (tokenId: string) => {
    try {
      console.log(`[CreditCardForm] Processing payment with token: ${tokenId}`);
      console.log('[CreditCardForm] Purchase ID:', purchaseId);
      console.log('[CreditCardForm] Amount:', amount, currency);
      setIsLoading(true);
      setIsTokenizing(false);
      
      console.log('[CreditCardForm] Sending token to backend for processing');
      const response = await fetch('/api/payments/xendit/card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchaseId,
          tokenId,
          amount,
          currency
        }),
      });
      
      console.log('[CreditCardForm] Backend response status:', response.status);
      
      const data = await response.json();
      console.log('[CreditCardForm] Backend response data:', data);
      
      if (!response.ok) {
        console.error('[CreditCardForm] Payment processing error:', data);
        throw new Error(data.details || data.error || 'Payment processing failed');
      }
      
      console.log('[CreditCardForm] Payment response processed successfully');
      
      if (data.requiresAuth && data.authUrl) {
        console.log('[CreditCardForm] Additional 3DS authentication required');
        console.log('[CreditCardForm] 3DS Auth URL:', data.authUrl);
        // Open 3DS authentication URL in an iframe
        setThreeDSUrl(data.authUrl);
        setShowThreeDSFrame(true);
        return;
      }
      
      if (data.success && data.accessCode) {
        console.log('[CreditCardForm] Payment successful! Access code:', data.accessCode);
        // Payment successful
        onSuccess(data.accessCode);
      } else if (data.paymentId) {
        console.log('[CreditCardForm] Payment pending, polling for status. Payment ID:', data.paymentId);
        // Payment is pending, poll for status
        pollPaymentStatus(data.paymentId);
      } else {
        console.error('[CreditCardForm] Invalid response from payment server');
        throw new Error('Invalid response from payment server');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment processing failed');
      setIsLoading(false);
      setIsTokenizing(false);
      onError(error instanceof Error ? error.message : 'Payment processing failed');
    }
  };
  
  // Poll for payment status
  const pollPaymentStatus = async (paymentId: string) => {
    try {
      console.log(`[CreditCardForm] Polling payment status for ID: ${paymentId}`);
      const response = await fetch(`/api/payments/xendit/card?paymentId=${paymentId}`);
      const data = await response.json();
      console.log('[CreditCardForm] Payment status response:', data);
      
      if (!response.ok) {
        console.error('[CreditCardForm] Error checking payment status:', data);
        throw new Error(data.details || data.error || 'Error checking payment status');
      }
      
      if (data.success && data.status === 'completed' && data.accessCode) {
        console.log('[CreditCardForm] Payment completed successfully!');
        // Payment completed successfully
        onSuccess(data.accessCode);
      } else if (data.status === 'failed') {
        console.error('[CreditCardForm] Payment failed:', data.message);
        // Payment failed
        throw new Error(data.message || 'Payment failed');
      } else {
        console.log('[CreditCardForm] Payment still pending, polling again in 3 seconds');
        // Payment still pending, poll again after a delay
        setTimeout(() => pollPaymentStatus(paymentId), 3000);
      }
    } catch (error) {
      console.error('[CreditCardForm] Payment status check error:', error);
      setError(error instanceof Error ? error.message : 'Payment status check failed');
      setIsLoading(false);
      setIsTokenizing(false);
      onError(error instanceof Error ? error.message : 'Payment status check failed');
    }
  };
  
  // Close 3DS frame
  const closeThreeDSFrame = () => {
    console.log('[CreditCardForm] 3DS frame closed by user');
    setShowThreeDSFrame(false);
    setIsLoading(false);
    setIsTokenizing(false);
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Credit Card Payment</CardTitle>
          <CardDescription>
            Enter your card details to complete the purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardExpMonth">Expiry Month (MM)</Label>
                <Input
                  id="cardExpMonth"
                  placeholder="MM"
                  value={cardExpMonth}
                  onChange={(e) => setCardExpMonth(e.target.value)}
                  disabled={isLoading}
                  required
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardExpYear">Expiry Year (YY)</Label>
                <Input
                  id="cardExpYear"
                  placeholder="YY"
                  value={cardExpYear}
                  onChange={(e) => {
                    // Allow only numbers and limit to 4 digits
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setCardExpYear(value);
                  }}
                  disabled={isLoading}
                  required
                  maxLength={4}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cardCvn">CVV/CVC</Label>
              <Input
                id="cardCvn"
                placeholder="123"
                value={cardCvn}
                onChange={(e) => setCardCvn(e.target.value)}
                disabled={isLoading}
                required
                maxLength={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                placeholder="John Doe"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            

            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || isTokenizing}
            >
              {isLoading || isTokenizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isTokenizing ? 'Securing card details...' : 'Processing payment...'}
                </>
              ) : (
                `Pay ${new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currency,
                }).format(amount)}`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* 3DS Authentication Modal */}
      {showThreeDSFrame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Card Authentication</h3>
              <button 
                onClick={closeThreeDSFrame}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
              <iframe
                src={threeDSUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                id="three-ds-frame"
                title="3D Secure Authentication"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Please complete the authentication process to proceed with your payment.
              Do not close this window until the process is complete.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
