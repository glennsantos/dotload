"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Settings, LogOut, ArrowLeft, ArrowRight, Download, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from '@/components/ui/separator';
import { DashboardTabs } from '@/components/ui/dashboard-tabs';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

// Define types for our data
type Purchase = {
  id: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  email: string;
  productId: string;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    files?: {
      id: string;
      filename: string;
      path: string;
    }[];
  };
  createdAt: string;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function PurchasesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
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

  // Fetch purchases data and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user data and purchases in parallel
        const [authResponse, purchasesResponse] = await Promise.all([
          fetch('/api/auth/me'),
          fetch(`/api/purchases?page=${pagination.page}&limit=${pagination.limit}&includeFiles=true`)
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
        }
        
        if (!purchasesResponse.ok) {
          throw new Error('Failed to fetch purchases data');
        }
        
        const data = await purchasesResponse.json();
        setPurchases(data.purchases || []);
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
          description: 'Failed to load purchases information',
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
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  // Filter purchases based on selected filter
  const filteredPurchases = purchases.filter(purchase => {
    if (filter === 'all') return true;
    return purchase.status === filter;
  });

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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
      hour12: true
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

  return (
    <div className="max-w-7xl mx-auto p-6">
      <DashboardHeader userName={userName} userEmail={userEmail} />

      {/* Horizontal Tab Menu */}
      <DashboardTabs activeTab="purchases" />

      {/* Purchases Section */}
      <div className="space-y-6">
        {isLoading ? (
          <Card className="border border-stone-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-center items-center h-40">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 bg-stone-200 rounded-full mb-4"></div>
                  <div className="h-4 w-40 bg-stone-200 rounded mb-3"></div>
                  <div className="h-3 w-32 bg-stone-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Alert variant="destructive" className="rounded-lg">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Card className="border border-stone-200 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl font-medium text-stone-800">Your Purchases</CardTitle>
                <CardDescription>Showing {filteredPurchases.length} of {pagination.total} purchases</CardDescription>
              </div>
              <div className="w-full sm:w-auto ml-auto">
                <Select value={filter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-full sm:w-[180px] border-stone-300 rounded-lg">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Purchases</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredPurchases.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <ShoppingBag className="mx-auto h-12 w-12 text-stone-300 mb-4" />
                  <p className="text-lg font-medium mb-2">No purchases yet</p>
                  <p className="text-sm mb-6">You haven't made any purchases yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="space-y-4 min-w-[600px]">
                    {filteredPurchases.map((purchase) => (
                      <div key={purchase.id} className="border border-stone-200 rounded-lg p-4 hover:bg-stone-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1 pr-4">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                              <h3 className="font-medium truncate text-stone-800">{purchase.product.name}</h3>
                              <Badge className={getStatusBadgeColor(purchase.status)}>
                                {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-sm text-stone-500">
                              {formatDate(purchase.createdAt)}
                            </p>
                            <p className="text-xs text-stone-500 mt-1 truncate">
                              Order ID: {purchase.id}
                            </p>
                            
                            {/* Display download buttons for completed purchases with files */}
                            {purchase.status === 'completed' && purchase.product.files && purchase.product.files.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-stone-600 mb-2">Download Files:</p>
                                <div className="flex flex-wrap gap-2">
                                  {purchase.product.files.map((file) => (
                                    <Button 
                                      key={file.id} 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-xs h-8 px-2 py-1 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                                      onClick={() => window.open(`/api/downloads/file/${file.id}`, '_blank')}
                                    >
                                      <Download className="h-3 w-3 mr-1" />
                                      {file.filename}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-lg font-semibold whitespace-nowrap text-green-600">
                            {formatCurrency(purchase.amount, purchase.currency)}
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
