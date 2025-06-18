"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, LogOut, Users, Mail, Phone, Calendar, DollarSign, ShoppingBag, Search, LucideBanknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DashboardTabs } from '@/components/ui/dashboard-tabs';
import { StatsCard } from '@/components/ui/stats-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

// Define types for our data
type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  purchaseCount: number;
  totalSpend: number;
  lastPurchaseDate: string;
  createdAt: string;
};

export default function CustomersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState('');
  const [userLogo, setUserLogo] = useState("");
  
  // Fetch customers data and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user data and customers in parallel
        const [authResponse, customersResponse] = await Promise.all([
          fetch('/api/auth/me', { credentials: 'include' }),
          fetch('/api/customers', { credentials: 'include' })
        ]);
        
        if (authResponse.status === 401 || authResponse.status === 403) {
          // Let middleware handle the redirect
          return;
        }
        
        // Get user data for welcome message
        if (authResponse.ok) {
          const userData = await authResponse.json();
          setUserName(userData.name || 'User');
          setUserEmail(userData.email || '');
          setUserLogo(userData.storeLogoPath || '');
        }
        
        if (!customersResponse.ok) {
          throw new Error('Failed to fetch customers data');
        }
        
        const data = await customersResponse.json();
        setCustomers(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast({
          title: 'Error',
          description: 'Failed to load customers information',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [router, toast]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      (customer.phone && customer.phone.includes(query))
    );
  });

  // Calculate total revenue
  const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpend, 0);

  // Stats data for the cards
  const statsData = [
    { 
      title: "Total Customers", 
      value: String(customers.length), 
      subtitle: "All time customers",
      icon: <Users className="h-5 w-5 text-primary" />,
      iconClassName: "bg-primary/10"
    },
    { 
      title: "Total Revenue", 
      value: formatCurrency(totalRevenue), 
      subtitle: "From all customers",
      icon: <LucideBanknote className="h-5 w-5 text-primary" />,
      iconClassName: "bg-primary/10"
    },
    { 
      title: "Avg. Purchase Value", 
      value: formatCurrency(customers.length ? totalRevenue / customers.length : 0), 
      subtitle: "Per customer",
      icon: <ShoppingBag className="h-5 w-5 text-primary" />,
      iconClassName: "bg-primary/10"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <DashboardHeader />
      
      {/* Horizontal Tab Menu */}
      <DashboardTabs activeTab="customers" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statsData.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            iconClassName={stat.iconClassName}
          />
        ))}
      </div>

      {/* Customers Section */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="claude-card p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-2">
                <div className="h-6 bg-muted rounded animate-pulse w-48"></div>
                <div className="h-4 bg-muted rounded animate-pulse w-64"></div>
              </div>
              <div className="h-10 bg-muted rounded-2xl animate-pulse w-32"></div>
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                  <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
                    <div className="h-3 bg-muted rounded animate-pulse w-24"></div>
                  </div>
                  <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="claude-card">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="claude-card">
            <CardHeader className="px-6 py-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-xl font-light text-foreground">Customer Management</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'} found
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search customers..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
                  <p className="text-lg font-medium mb-2 text-foreground">No customers yet</p>
                  <p className="text-sm mb-6">Your customer information will appear here once you make sales</p>
                  <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-light">
                    <Link href="/create-product">+ Create a product</Link>
                  </Button>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left py-3 px-4 font-medium text-sm text-foreground">Customer</th>
                          <th className="text-left py-3 px-4 font-medium text-sm text-foreground">Contact</th>
                          <th className="text-right py-3 px-4 font-medium text-sm text-foreground">Purchases</th>
                          <th className="text-right py-3 px-4 font-medium text-sm text-foreground">Total Spend</th>
                          <th className="text-right py-3 px-4 font-medium text-sm text-foreground">Last Purchase</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.map((customer) => (
                          <tr key={customer.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 bg-muted text-foreground">
                                  <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-foreground">{customer.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Customer since {formatDate(customer.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center text-sm text-foreground">
                                  <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                  {customer.email}
                                </div>
                                {customer.phone && (
                                  <div className="flex items-center text-sm text-foreground">
                                    <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                    {customer.phone}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="font-medium text-foreground">{customer.purchaseCount}</div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="font-medium text-primary">{formatCurrency(customer.totalSpend)}</div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end text-sm text-foreground">
                                <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                {formatDate(customer.lastPurchaseDate)}
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
          </div>
        )}
      </div>
    </div>
  );
}
