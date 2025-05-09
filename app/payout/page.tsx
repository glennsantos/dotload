"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Define types for our data
type Balance = {
  total: number;
  available: number;
  pending: number;
};

type PayoutFormData = {
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
};

// Fee configuration type
type FeeConfig = {
  percentageFee: number;
  fixedFee: number;
};

type FeeResponse = {
  feeConfig: FeeConfig;
  examples: {
    amount: number;
    processingFee: number;
    netAmount: number;
    percentageFeeAmount: number;
    fixedFeeAmount: number;
  };
  description: string;
};

// List of supported banks
const SUPPORTED_BANKS = [
  { code: 'BDO', name: 'Banco de Oro' },
  { code: 'BPI', name: 'Bank of the Philippine Islands' },
  { code: 'UNIONBANK', name: 'UnionBank of the Philippines' },
  { code: 'GCASH', name: 'GCash' },
];

export default function PayoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [balance, setBalance] = useState<Balance>({ total: 0, available: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [formData, setFormData] = useState<PayoutFormData>({
    amount: 0,
    bankCode: '',
    accountNumber: '',
    accountHolderName: '',
  });
  const [processingFee, setProcessingFee] = useState(0);
  const [netAmount, setNetAmount] = useState(0);
  const [feeConfig, setFeeConfig] = useState<FeeConfig>({ percentageFee: 0.10, fixedFee: 20 });
  const [feeDescription, setFeeDescription] = useState('');

  // Fetch balance data and fee configuration
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch balance data
        const balanceResponse = await fetch('/api/transactions');
        
        if (!balanceResponse.ok) {
          if (balanceResponse.status === 401) {
            // Redirect to login if unauthorized
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch balance data');
        }
        
        const balanceData = await balanceResponse.json();
        setBalance(balanceData.summary ? {
          total: balanceData.summary.totalIncome || 0,
          available: balanceData.summary.availableBalance || 0,
          pending: 0
        } : { total: 0, available: 0, pending: 0 });
        
        // Fetch fee configuration
        const feeResponse = await fetch('/api/fees');
        
        if (!feeResponse.ok) {
          throw new Error('Failed to fetch fee configuration');
        }
        
        const feeData: FeeResponse = await feeResponse.json();
        setFeeConfig(feeData.feeConfig);
        setFeeDescription(feeData.description);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast({
          title: 'Error',
          description: 'Failed to load required information',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [router, toast]);

  // Calculate processing fee based on backend configuration
  useEffect(() => {
    const calculateFee = async () => {
      try {
        if (formData.amount <= 0) {
          setProcessingFee(0);
          setNetAmount(0);
          return;
        }
        
        // Calculate processing fee using the formula: percentage + fixed fee
        const percentageFeeAmount = formData.amount * feeConfig.percentageFee;
        const totalFee = percentageFeeAmount + feeConfig.fixedFee;
        
        // Ensure fee doesn't exceed maximum percentage
        const maxFeePercentage = 0.50; // 50% maximum fee
        const maxFee = formData.amount * maxFeePercentage;
        
        const finalFee = Math.min(totalFee, maxFee);
        setProcessingFee(finalFee);
        setNetAmount(formData.amount - finalFee);
      } catch (error) {
        console.error('Error calculating fee:', error);
      }
    };
    
    calculateFee();
  }, [formData.amount, feeConfig]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
  };

  // Handle bank selection
  const handleBankChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      bankCode: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form data
    if (!formData.amount || formData.amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than zero',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.amount > balance.available) {
      toast({
        title: 'Insufficient balance',
        description: `Your available balance is ${formatCurrency(balance.available)}`,
        variant: 'destructive',
      });
      return;
    }
    
    // Verify that the net amount after fees is positive
    if (netAmount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'The amount is too small to cover the processing fee',
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.bankCode) {
      toast({
        title: 'Bank required',
        description: 'Please select a bank',
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.accountNumber) {
      toast({
        title: 'Account number required',
        description: 'Please enter your account number',
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.accountHolderName) {
      toast({
        title: 'Account holder name required',
        description: 'Please enter the account holder name',
        variant: 'destructive',
      });
      return;
    }
    
    // Move to confirmation step
    setStep('confirm');
  };

  // Handle payout confirmation
  const handleConfirmPayout = async () => {
    try {
      setIsLoading(true);
      
      // Create a reference ID for tracking this payout
      const referenceId = `payout-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Prepare payout data
      const payoutData = {
        amount: formData.amount,
        bankCode: formData.bankCode,
        accountNumber: formData.accountNumber,
        accountHolderName: formData.accountHolderName,
        referenceId: referenceId,
        // No need to send processingFee - it will be calculated on the server
      };
      
      const response = await fetch('/api/transactions/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payoutData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Payout error:', errorData);
        throw new Error(errorData.error || 'Failed to process payout');
      }
      
      const data = await response.json();
      console.log('Payout response:', data);
      
      // Show a more detailed success message
      toast({
        title: 'Payout requested',
        description: `Your payout of ${formatCurrency(formData.amount - processingFee)} has been submitted successfully. Transaction ID: ${data.payout?.id || referenceId}`,
        variant: 'default',
      });
      
      // Add a slight delay before redirecting to ensure the user sees the success message
      setTimeout(() => {
        // Redirect to transactions page
        router.push('/transactions');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Payout error:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to process payout',
        variant: 'destructive',
      });
      // Go back to form step
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  // Render payout request form
  const renderPayoutForm = () => (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push('/transactions')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Request Payout</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Available Balance</CardTitle>
          <CardDescription>
            This is the amount you can withdraw
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(balance.available)}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Request Payout</CardTitle>
          <CardDescription>
            Enter your payout details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              placeholder="0.00"
              value={formData.amount || ''}
              onChange={handleInputChange}
              min={1}
              max={balance.available}
            />
            {formData.amount > 0 && (
              <div className="text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Processing Fee ({feeConfig.percentageFee * 100}% + ₱{feeConfig.fixedFee}):</span>
                  <span>{formatCurrency(processingFee)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>You will receive:</span>
                  <span>{formatCurrency(formData.amount - processingFee)}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bankCode">Bank</Label>
            <Select value={formData.bankCode} onValueChange={handleBankChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_BANKS.map(bank => (
                  <SelectItem key={bank.code} value={bank.code}>
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              name="accountNumber"
              placeholder="Enter account number"
              value={formData.accountNumber}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accountHolderName">Account Holder Name</Label>
            <Input
              id="accountHolderName"
              name="accountHolderName"
              placeholder="Enter account holder name"
              value={formData.accountHolderName}
              onChange={handleInputChange}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={isLoading || formData.amount <= 0 || formData.amount > balance.available}
          >
            {isLoading ? 'Processing...' : 'Continue'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  // Render confirmation step
  const renderConfirmation = () => (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setStep('form')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Confirm Payout</h1>
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Please review your payout details carefully. Once submitted, this request cannot be modified.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle>Payout Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bank:</span>
              <span className="font-medium">
                {SUPPORTED_BANKS.find(b => b.code === formData.bankCode)?.name || formData.bankCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Number:</span>
              <span className="font-medium">{formData.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Holder:</span>
              <span className="font-medium">{formData.accountHolderName}</span>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">{formatCurrency(formData.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Processing Fee:</span>
              <span className="font-medium">{formatCurrency(processingFee)}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {feeDescription}
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex justify-between">
              <span className="font-bold">You will receive:</span>
              <span className="font-bold">{formatCurrency(netAmount)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            className="w-full" 
            onClick={handleConfirmPayout}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Confirm Payout'}
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setStep('form')}
            disabled={isLoading}
          >
            Back to Edit
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  // Main render function
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {isLoading && step === 'form' ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <p>Loading balance information...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          {step === 'form' && renderPayoutForm()}
          {step === 'confirm' && renderConfirmation()}
        </>
      )}
    </div>
  );
}
