"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Download, Filter, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// Define types for our data
type Transaction = {
  id: string;
  amount: number;
  currency: string;
  type: 'income' | 'payout' | 'fee';
  status: 'completed' | 'pending' | 'failed';
  description: string;
  reference?: string;
  referenceType?: string;
  createdAt: string;
};

type Summary = {
  totalIncome: number;
  totalPayouts: number;
  totalFees: number;
  currentBalance: number;
  availableBalance: number;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function TransactionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalIncome: 0,
    totalPayouts: 0,
    totalFees: 0,
    currentBalance: 0,
    availableBalance: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  // Fetch transactions data
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/transactions?page=${pagination.page}&limit=${pagination.limit}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login if unauthorized
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch transactions data');
        }
        
        const data = await response.json();
        setTransactions(data.transactions || []);
        setSummary(data.summary || {
          totalIncome: 0,
          totalPayouts: 0,
          totalFees: 0,
          currentBalance: 0,
          availableBalance: 0,
        });
        setPagination(data.pagination || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast({
          title: 'Error',
          description: 'Failed to load transactions information',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [router, toast, pagination.page, pagination.limit]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        page: newPage,
      }));
    }
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  // Filter transactions based on selected filter
  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get transaction type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-blue-100 text-blue-800';
      case 'payout':
        return 'bg-purple-100 text-purple-800';
      case 'fee':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get transaction amount color
  const getAmountColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600';
      case 'payout':
      case 'fee':
        return 'text-red-600';
      default:
        return '';
    }
  };

  // Get transaction amount prefix
  const getAmountPrefix = (type: string) => {
    switch (type) {
      case 'income':
        return '+';
      case 'payout':
      case 'fee':
        return '-';
      default:
        return '';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <p>Loading transactions information...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Transactions</h1>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalIncome)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalPayouts)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(summary.currentBalance)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Available Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(summary.availableBalance)}</p>
                {summary.availableBalance > 0 && (
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/payout')}
                    className="w-full whitespace-normal py-6"
                  >
                    <Wallet className="h-4 w-4 mr-2" /> Request Payout
                  </Button>
                </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transaction History</CardTitle>
                <Select value={filter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="income">Income Only</SelectItem>
                    <SelectItem value="payout">Payouts Only</SelectItem>
                    <SelectItem value="fee">Fees Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CardDescription>
                Showing {filteredTransactions.length} of {pagination.total} transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="space-y-4 min-w-[600px]">
                    {filteredTransactions.map((transaction) => (
                      <div key={transaction.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1 pr-4">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                              <h3 className="font-medium truncate">{transaction.description}</h3>
                              <Badge className={getTypeBadgeColor(transaction.type)}>
                                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                              </Badge>
                              <Badge className={getStatusBadgeColor(transaction.status)}>
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(transaction.createdAt)}
                            </p>
                            {transaction.reference && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                Reference: {transaction.reference} ({transaction.referenceType})
                              </p>
                            )}
                          </div>
                          <div className={`text-lg font-semibold whitespace-nowrap ${getAmountColor(transaction.type)}`}>
                            {getAmountPrefix(transaction.type)}{formatCurrency(transaction.amount, transaction.currency)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            {pagination.totalPages > 1 && (
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
