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
type Payout = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
};

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

// List of supported banks
const SUPPORTED_BANKS = [
  { code: 'BDO', name: 'Banco de Oro' },
  { code: 'BPI', name: 'Bank of the Philippine Islands' },
  { code: 'LANDBANK', name: 'Land Bank of the Philippines' },
  { code: 'METROBANK', name: 'Metropolitan Bank and Trust Company' },
  { code: 'PNB', name: 'Philippine National Bank' },
  { code: 'UNIONBANK', name: 'UnionBank of the Philippines' },
  { code: 'GCASH', name: 'GCash' },
];

export default function PayoutsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [balance, setBalance] = useState<Balance>({ total: 0, available: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'list' | 'form' | 'confirm'>('list');
  const [formData, setFormData] = useState<PayoutFormData>({
    amount: 0,
    bankCode: '',
    accountNumber: '',
    accountHolderName: '',
  });
  const [processingFee, setProcessingFee] = useState(0);

  // Fetch payouts and balance data
  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/payouts');
        
        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login if unauthorized
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch payout data');
        }
        
        const data = await response.json();
        setPayouts(data.payouts || []);
        setBalance(data.balance || { total: 0, available: 0, pending: 0 });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast({
          title: 'Error',
          description: 'Failed to load payout information',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPayouts();
  }, [router, toast]);

  // Calculate processing fee (5% of payout amount)
  useEffect(() => {
    setProcessingFee(formData.amount * 0.05);
  }, [formData.amount]);

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
        description: 'The requested amount exceeds your available balance',
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
      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process payout');
      }
      
      const data = await response.json();
      
      // Update local state with new payout
      setPayouts(prev => [data.payout, ...prev]);
      setBalance(prev => ({
        ...prev,
        available: prev.available - formData.amount,
        pending: prev.pending + formData.amount,
      }));
      
      // Reset form and go back to list view
      setFormData({
        amount: 0,
        bankCode: '',
        accountNumber: '',
        accountHolderName: '',
      });
      setStep('list');
      
      toast({
        title: 'Payout requested',
        description: 'Your payout request has been submitted successfully',
        variant: 'default',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to process payout',
        variant: 'destructive',
      });
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

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Render payout list view
  const renderPayoutList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payouts</h1>
        <Button 
          onClick={() => setStep('form')}
          disabled={balance.available <= 0}
        >
          Request Payout
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance.total)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance.available)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance.pending)}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Payout History</h2>
        {payouts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No payout history available
          </div>
        ) : (
          <div className="space-y-4">
            {payouts.map((payout) => (
              <Card key={payout.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{formatCurrency(payout.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {payout.bankCode} - {payout.accountNumber.replace(/\d(?=\d{4})/g, "*")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(payout.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                        payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render payout request form
  const renderPayoutForm = () => (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setStep('list')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Request Payout</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Payout Details</CardTitle>
          <CardDescription>
            Enter your payout information. A 5% processing fee will be applied.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount || ''}
              onChange={handleInputChange}
              placeholder="Enter amount"
              required
            />
            <p className="text-sm text-muted-foreground">
              Available balance: {formatCurrency(balance.available)}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bankCode">Bank</Label>
            <Select 
              value={formData.bankCode} 
              onValueChange={handleBankChange}
            >
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
              value={formData.accountNumber}
              onChange={handleInputChange}
              placeholder="Enter account number"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accountHolderName">Account Holder Name</Label>
            <Input
              id="accountHolderName"
              name="accountHolderName"
              value={formData.accountHolderName}
              onChange={handleInputChange}
              placeholder="Enter account holder name"
              required
            />
          </div>
          
          {formData.amount > 0 && (
            <div className="pt-4">
              <Separator className="my-4" />
              <div className="flex justify-between">
                <span>Amount:</span>
                <span>{formatCurrency(formData.amount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Processing Fee (5%):</span>
                <span>{formatCurrency(processingFee)}</span>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between font-bold">
                <span>You will receive:</span>
                <span>{formatCurrency(formData.amount - processingFee)}</span>
              </div>
            </div>
          )}
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
              <span className="text-muted-foreground">Processing Fee (5%):</span>
              <span className="font-medium">{formatCurrency(processingFee)}</span>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex justify-between">
              <span className="font-bold">You will receive:</span>
              <span className="font-bold">{formatCurrency(formData.amount - processingFee)}</span>
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
      {isLoading && step === 'list' ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <p>Loading payout information...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          {step === 'list' && renderPayoutList()}
          {step === 'form' && renderPayoutForm()}
          {step === 'confirm' && renderConfirmation()}
        </>
      )}
    </div>
  );
}
