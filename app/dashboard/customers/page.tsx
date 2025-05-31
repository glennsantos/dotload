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
  
  // Fetch customers data and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user data and customers in parallel
        const [authResponse, customersResponse] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/customers')
        ]);
        
        if (authResponse.status === 401 || authResponse.status === 403) {
          // Redirect to login if unauthorized
          router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        
        // Get user data for welcome message
        if (authResponse.ok) {
          const userData = await authResponse.json();
          setUserName(userData.name || 'User');
          setUserEmail(userData.email || '');
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
      icon: <Users className="h-5 w-5 text-emerald-600" />,
      iconClassName: "bg-emerald-100"
    },
    { 
      title: "Total Revenue", 
      value: formatCurrency(totalRevenue), 
      subtitle: "From all customers",
      icon: <LucideBanknote className="h-5 w-5 text-emerald-600" />,
      iconClassName: "bg-emerald-100"
    },
    { 
      title: "Avg. Purchase Value", 
      value: formatCurrency(customers.length ? totalRevenue / customers.length : 0), 
      subtitle: "Per customer",
      icon: <ShoppingBag className="h-5 w-5 text-emerald-600" />,
      iconClassName: "bg-emerald-100"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <DashboardHeader userName={userName} userEmail={userEmail} />
      
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
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Card className="border border-stone-100 shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-xl font-medium text-stone-800">Customer Management</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-stone-400" />
                  <Input
                    type="search"
                    placeholder="Search customers..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <CardDescription>
                {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <Users className="mx-auto h-12 w-12 text-stone-300 mb-4" />
                  <p className="text-lg font-medium mb-2">No customers yet</p>
                  <p className="text-sm mb-6">Your customer information will appear here once you make sales</p>
                  <Button asChild className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-light">
                    <Link href="/create-product">+ Create a product</Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="text-right">Purchases</TableHead>
                        <TableHead className="text-right">Total Spend</TableHead>
                        <TableHead className="text-right">Last Purchase</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.id} className="hover:bg-stone-50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 bg-stone-200 text-stone-800">
                                <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-stone-800">{customer.name}</div>
                                <div className="text-xs text-stone-500">
                                  Customer since {formatDate(customer.createdAt)}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center text-sm text-stone-600">
                                <Mail className="h-3.5 w-3.5 mr-2 text-stone-400" />
                                {customer.email}
                              </div>
                              {customer.phone && (
                                <div className="flex items-center text-sm text-stone-600">
                                  <Phone className="h-3.5 w-3.5 mr-2 text-stone-400" />
                                  {customer.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium">{customer.purchaseCount}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium text-emerald-700">{formatCurrency(customer.totalSpend)}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end text-sm text-stone-600">
                              <Calendar className="h-3.5 w-3.5 mr-2 text-stone-400" />
                              {formatDate(customer.lastPurchaseDate)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
