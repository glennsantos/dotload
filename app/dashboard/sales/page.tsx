"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Download, Filter, Settings, LogOut, ShoppingCart, DollarSign, Users, Wallet, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { DashboardTabs } from '@/components/ui/dashboard-tabs';
import { StatsCard } from '@/components/ui/stats-card';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { fetchWithAuth } from '@/lib/client-auth';

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

export default function SalesPage() {
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
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [userLogo, setUserLogo] = useState("");

  // Fetch transactions data and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user data and transactions in parallel
        const [authResponse, transactionsResponse] = await Promise.all([
          fetchWithAuth('/api/auth/me'),
          fetchWithAuth(`/api/transactions?page=${pagination.page}&limit=${pagination.limit}`)
        ]);
        
        if (authResponse.status === 401 || authResponse.status === 403) {
          // Let middleware handle the redirect
          return;
        }
        
        // Get user data for welcome message
        if (authResponse.ok) {
          const userData = await authResponse.json();
          const user = userData.user || userData;
          setUserName(user.name || 'User');
          setUserEmail(user.email || '');
          setUserLogo(user.storeLogoPath || '');
        }
        
        if (!transactionsResponse.ok) {
          throw new Error('Failed to fetch transactions data');
        }
        
        const data = await transactionsResponse.json();
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
    
    fetchData();
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
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100';
      case 'pending':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
      case 'failed':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-stone-100 text-stone-800 hover:bg-stone-100';
    }
  };

  // Get transaction type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100';
      case 'payout':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'fee':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
      default:
        return 'bg-stone-100 text-stone-800 hover:bg-stone-100';
    }
  };

  // Get transaction amount color
  const getAmountColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-emerald-700';
      case 'payout':
      case 'fee':
        return 'text-red-600';
      default:
        return 'text-foreground';
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
    <div className="max-w-7xl mx-auto p-6">
      <DashboardHeader />

      {/* Horizontal Tab Menu */}
      <DashboardTabs activeTab="sales" />

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatsCard
          title="Current Balance"
          value={formatCurrency(summary.currentBalance || 0)}
          subtitle="Total balance in your account"
          icon={<Landmark className="h-5 w-5 text-primary" />}
          iconClassName="bg-primary/10"
        />
        
        <div className="claude-card rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-light text-muted-foreground">Available Balance</h3>
              <p className="text-2xl font-normal mt-1 text-foreground">{formatCurrency(summary.availableBalance || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Available for withdrawal</p>
            </div>
            <div className="p-2 rounded-xl bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </div>
            <Button 
              onClick={() => router.push('/payout')}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-light"
            >
              Request Payout
            </Button>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-light text-foreground">Sales Transactions</h2>
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
        
        {isLoading ? (
          <div className="claude-card rounded-lg p-4 sm:p-6">
            <div className="flex justify-center items-center h-40">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 bg-stone-200 rounded-full mb-4"></div>
                <div className="h-4 w-40 bg-stone-200 rounded mb-3"></div>
                <div className="h-3 w-32 bg-stone-200 rounded"></div>
              </div>
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="rounded-lg">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 claude-card rounded-lg p-4 sm:p-6">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2 text-foreground">No sales yet</p>
            <p className="text-sm text-muted-foreground mb-6">Start selling to see transactions here!</p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-light">
                    <Link href="/create-product">+ Create A Product</Link>
                  </Button>
                </div>
              ) : (
          <div className="claude-card rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border">
              <p className="text-sm text-muted-foreground">
                Showing {filteredTransactions.length} of {pagination.total} transactions
              </p>
            </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-border hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div>
                          <div className="font-medium text-foreground">{transaction.description}</div>
                                {transaction.reference && (
                            <div className="text-xs text-muted-foreground mt-1">
                                    Reference: {transaction.reference} ({transaction.referenceType})
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                        <div className="text-sm text-muted-foreground">
                                {formatDate(transaction.createdAt)}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={getTypeBadgeColor(transaction.type)}>
                                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={getStatusBadgeColor(transaction.status)}>
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className={`font-medium whitespace-nowrap ${getAmountColor(transaction.type)}`}>
                                {getAmountPrefix(transaction.type)}{formatCurrency(transaction.amount, transaction.currency)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center p-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
