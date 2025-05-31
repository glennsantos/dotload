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
          // Redirect to login if unauthorized
          router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
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
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'payout':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'fee':
        return 'bg-stone-100 text-stone-800 hover:bg-stone-100';
      default:
        return 'bg-stone-100 text-stone-800 hover:bg-stone-100';
    }
  };

  // Get transaction amount color
  const getAmountColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-emerald-600';
      case 'payout':
      case 'fee':
        return 'text-red-600';
      default:
        return 'text-stone-800';
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
          value={formatCurrency(summary.currentBalance || 0, 'PHP').replace('PHP', '').trim()}
          subtitle="Total balance in your account"
          icon={<Landmark className="h-5 w-5 text-emerald-600" />}
          iconClassName="bg-emerald-100"
        />
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-light text-stone-600">Available Balance</h3>
              <p className="text-2xl font-normal mt-1">{formatCurrency(summary.availableBalance || 0, 'PHP').replace('PHP', '').trim()}</p>
              <p className="text-xs text-stone-500 mt-1">Available for withdrawal</p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-100">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <Button 
              onClick={() => router.push('/payout')}
              className="w-full sm:w-auto"
            >
              Request Payout
            </Button>
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="space-y-6 m">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Card className="border-0 shadow-none">
            <CardHeader className="px-0">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-light text-stone-800 px-0">All Sales</CardTitle>
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
            <CardContent className="px-0">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <ShoppingCart className="mx-auto h-12 w-12 text-stone-300 mb-4" />
                  <p className="text-lg font-medium mb-2">No sales yet</p>
                  <p className="text-sm mb-6">Start selling to see transactions here!</p>
                  <Button asChild className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-light">
                    <Link href="/create-product">+ Create A Product</Link>
                  </Button>
                </div>
              ) : (
                <div className="border border-stone-100 rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-white">
                          <th className="text-left py-3 px-4 font-medium text-sm text-stone-700">Description</th>
                          <th className="text-left py-3 px-4 font-medium text-sm text-stone-700">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-sm text-stone-700">Type</th>
                          <th className="text-left py-3 px-4 font-medium text-sm text-stone-700">Status</th>
                          <th className="text-right py-3 px-4 font-medium text-sm text-stone-700">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b hover:bg-stone-50">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium text-stone-800">{transaction.description}</div>
                                {transaction.reference && (
                                  <div className="text-xs text-stone-500 mt-1">
                                    Reference: {transaction.reference} ({transaction.referenceType})
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-stone-600">
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
                </div>
              )}
            </CardContent>
            {pagination.totalPages > 1 && (
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="border-stone-200 text-stone-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <div className="text-sm text-stone-500">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="border-stone-200 text-stone-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
