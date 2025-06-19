"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, LogOut, Plus, Percent, Copy, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DashboardTabs } from '@/components/ui/dashboard-tabs';
import { StatsCard } from '@/components/ui/stats-card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

// Define types for our data
type DiscountCode = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  productId: string | null;
  productName?: string;
  createdAt: string;
};

export default function PromosPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [products, setProducts] = useState<Array<{id: string, name: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("User");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("User");
  const [userLogo, setUserLogo] = useState("User");
  
  // Form state for creating a new discount code
  const [newCode, setNewCode] = useState({
    code: '',
    type: 'percentage',
    value: '',
    maxUses: '',
    expiresAt: '',
    productId: 'all'
  });

  // Fetch discount codes and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user data, discount codes, and products in parallel
        const [authResponse, discountCodesResponse, productsResponse] = await Promise.all([
          fetch('/api/auth/me', { credentials: 'include' }),
          fetch('/api/discount-codes', { credentials: 'include' }),
          fetch('/api/products', { credentials: 'include' })
        ]);
        
        if (authResponse.status === 401 || authResponse.status === 403) {
          // Let middleware handle the redirect
          return;
        }
        
        // Get user data for welcome message
        if (authResponse.ok) {
          const userData = await authResponse.json();
          if (userData.user && userData.user.name) {
            setUserName(userData.user.name);
            setUserEmail(userData.user.email);
            setUserLogo(userData.user.storeLogoPath);
          }
        }
        
        if (!discountCodesResponse.ok) {
          throw new Error('Failed to fetch discount codes');
        }
        
        const discountData = await discountCodesResponse.json();
        setDiscountCodes(discountData || []);

        // Fetch products for the dropdown
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          if (Array.isArray(productsData)) {
            setProducts(productsData.map(product => ({
              id: product.id,
              name: product.name
            })));
          }
        }

        // Check for product query parameter and pre-select it
        const urlParams = new URLSearchParams(window.location.search);
        const productParam = urlParams.get('product');
        if (productParam) {
          setNewCode(prev => ({ ...prev, productId: productParam }));
          // Auto-open the dialog if coming from a product page
          setIsDialogOpen(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast({
          title: 'Error',
          description: 'Failed to load data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [router, toast]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCode(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setNewCode(prev => ({ ...prev, [name]: value }));
  };

  // Create a new discount code
  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...newCode,
        value: parseFloat(newCode.value),
        maxUses: newCode.maxUses ? parseInt(newCode.maxUses) : null,
        productId: newCode.productId === 'all' ? null : newCode.productId,
        expiresAt: newCode.expiresAt || null
      };
      
      const response = await fetch('/api/discount-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to create discount code');
      }
      
      const newDiscountCode = await response.json();
      
      setDiscountCodes(prev => [newDiscountCode, ...prev]);
      setIsDialogOpen(false);
      setNewCode({
        code: '',
        type: 'percentage',
        value: '',
        maxUses: '',
        expiresAt: '',
        productId: 'all'
      });
      
      toast({
        title: 'Success',
        description: 'Discount code created successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create discount code',
        variant: 'destructive',
      });
    }
  };

  // Delete a discount code
  const handleDeleteCode = async (id: string) => {
    try {
      const response = await fetch(`/api/discount-codes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete discount code');
      }
      
      setDiscountCodes(prev => prev.filter(code => code.id !== id));
      
      toast({
        title: 'Success',
        description: 'Discount code deleted successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete discount code',
        variant: 'destructive',
      });
    }
  };

  // Copy discount code to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    
    toast({
      title: 'Copied!',
      description: `Code "${code}" copied to clipboard`,
    });
    
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never expires';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Format discount value
  const formatDiscountValue = (type: string, value: number) => {
    if (type === 'percentage') {
      return `${value}%`;
    } else {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
      }).format(value);
    }
  };

  // Stats data for the cards
  const statsData = [
    { 
      title: "Active Codes", 
      value: String(discountCodes.filter(code => code.isActive).length), 
      subtitle: "Currently available",
      icon: <Percent className="h-5 w-5 text-primary" />,
      iconClassName: "bg-primary/10"
    },
    { 
      title: "Total Redemptions", 
      value: String(discountCodes.reduce((sum, code) => sum + code.usedCount, 0)), 
      subtitle: "Times codes were used",
      icon: <Check className="h-5 w-5 text-primary" />,
      iconClassName: "bg-primary/10"
    },
    { 
      title: "Product-Specific", 
      value: String(discountCodes.filter(code => code.productId !== null).length), 
      subtitle: "Codes for specific products",
      icon: <Percent className="h-5 w-5 text-primary" />,
      iconClassName: "bg-primary/10"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <DashboardHeader />
      
      {/* Horizontal Tab Menu */}
      <DashboardTabs activeTab="promos" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statsData.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={isNaN(Number(stat.value)) ? 0 : Number(stat.value).toLocaleString()}
            subtitle={stat.subtitle}
            icon={stat.icon}
            iconClassName={stat.iconClassName}
          />
        ))}
      </div>

      {/* Discount Codes Section */}
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
                  <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                  <div className="h-6 bg-muted rounded animate-pulse w-16"></div>
                  <div className="flex space-x-2 ml-auto">
                    <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                    <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                  </div>
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
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-light text-foreground">Your Discount Codes</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    Manage discount codes for your products
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-light">
                      <Plus className="h-4 w-4 mr-2" /> Create Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="font-light">Create New Discount Code</DialogTitle>
                      <DialogDescription>
                        Create a new discount code for your products. Click save when you're done.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateCode}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="code" className="text-right">
                            Code
                          </Label>
                          <Input
                            id="code"
                            name="code"
                            value={newCode.code}
                            onChange={handleInputChange}
                            placeholder="SUMMER20"
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="type" className="text-right">
                            Type
                          </Label>
                          <Select
                            value={newCode.type}
                            onValueChange={(value) => handleSelectChange('type', value)}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="value" className="text-right">
                            Value
                          </Label>
                          <Input
                            id="value"
                            name="value"
                            value={newCode.value}
                            onChange={handleInputChange}
                            placeholder={newCode.type === 'percentage' ? "20" : "100"}
                            className="col-span-3"
                            type="number"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="maxUses" className="text-right">
                            Max Uses
                          </Label>
                          <Input
                            id="maxUses"
                            name="maxUses"
                            value={newCode.maxUses}
                            onChange={handleInputChange}
                            placeholder="Unlimited"
                            className="col-span-3"
                            type="number"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="expiresAt" className="text-right">
                            Expires
                          </Label>
                          <Input
                            id="expiresAt"
                            name="expiresAt"
                            value={newCode.expiresAt}
                            onChange={handleInputChange}
                            className="col-span-3"
                            type="date"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="productId" className="text-right">
                            Product
                          </Label>
                          <Select
                            value={newCode.productId}
                            onValueChange={(value) => handleSelectChange('productId', value)}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Products</SelectItem>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-light">Save Code</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {discountCodes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Percent className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
                  <p className="text-lg font-medium mb-2 text-foreground">No discount codes yet</p>
                  <p className="text-sm mb-6">Create your first discount code to boost sales</p>
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-light"
                  >
                    + Create Code
                  </Button>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left py-3 px-4 font-medium text-sm text-foreground">Code</th>
                          <th className="text-left py-3 px-4 font-medium text-sm text-foreground">Discount</th>
                          <th className="text-left py-3 px-4 font-medium text-sm text-foreground">Usage</th>
                          <th className="text-left py-3 px-4 font-medium text-sm text-foreground">Status</th>
                          <th className="text-right py-3 px-4 font-medium text-sm text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {discountCodes.map((code) => (
                          <tr key={code.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-medium text-foreground">{code.code}</div>
                              {code.productName && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Product: {code.productName}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-foreground font-medium">
                                {formatDiscountValue(code.type, code.value)}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-foreground">
                                {code.usedCount}{code.maxUses ? `/${code.maxUses}` : ''} uses
                                <div className="text-xs text-muted-foreground mt-1">
                                  Expires: {formatDate(code.expiresAt)}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={code.isActive ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}>
                                {code.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              {code.productId && (
                                <div className="mt-1">
                                  <Badge className="bg-secondary/10 text-secondary-foreground border-secondary/20">
                                    Product Specific
                                  </Badge>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-2xl"
                                  onClick={() => copyToClipboard(code.code)}
                                >
                                  {copiedCode === code.code ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">Copy</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-2xl"
                                  onClick={() => handleDeleteCode(code.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
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
