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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("User");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
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
        
        // Fetch user data and discount codes in parallel
        const [authResponse, discountCodesResponse] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/discount-codes')
        ]);
        
        if (authResponse.status === 401 || authResponse.status === 403) {
          // Redirect to login if unauthorized
          router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        
        // Get user data for welcome message
        if (authResponse.ok) {
          const userData = await authResponse.json();
          if (userData.user && userData.user.name) {
            setUserName(userData.user.name);
          }
        }
        
        if (!discountCodesResponse.ok) {
          throw new Error('Failed to fetch discount codes');
        }
        
        const data = await discountCodesResponse.json();
        setDiscountCodes(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast({
          title: 'Error',
          description: 'Failed to load discount codes',
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
      icon: <Percent className="h-5 w-5 text-emerald-600" />,
      iconClassName: "bg-emerald-100"
    },
    { 
      title: "Total Redemptions", 
      value: String(discountCodes.reduce((sum, code) => sum + code.usedCount, 0)), 
      subtitle: "Times codes were used",
      icon: <Check className="h-5 w-5 text-blue-600" />,
      iconClassName: "bg-blue-100"
    },
    { 
      title: "Product-Specific", 
      value: String(discountCodes.filter(code => code.productId !== null).length), 
      subtitle: "Codes for specific products",
      icon: <Percent className="h-5 w-5 text-purple-600" />,
      iconClassName: "bg-purple-100"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <DashboardHeader userName={userName} />
      
      {/* Horizontal Tab Menu */}
      <div className="mb-8">
        <DashboardTabs activeTab="promos" />
      </div>

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
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Card className="border border-stone-200 shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-medium text-stone-800">Your Discount Codes</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Plus className="h-4 w-4 mr-2" /> Create Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New Discount Code</DialogTitle>
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
                              {/* We would fetch and map products here */}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">Save Code</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>
                Manage discount codes for your products
              </CardDescription>
            </CardHeader>
            <CardContent>
              {discountCodes.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <Percent className="mx-auto h-12 w-12 text-stone-300 mb-4" />
                  <p className="text-lg font-medium mb-2">No discount codes yet</p>
                  <p className="text-sm mb-6">Create your first discount code to boost sales</p>
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Create Code
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="space-y-4">
                    {discountCodes.map((code) => (
                      <div key={code.id} className="border border-stone-200 rounded-lg p-4 hover:bg-stone-50 transition-colors">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-2 mb-2">
                              <h3 className="font-medium text-stone-800">{code.code}</h3>
                              <Badge className={code.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-800'}>
                                {code.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              {code.productId && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  Product Specific
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-stone-500">
                              <span>Discount: {formatDiscountValue(code.type, code.value)}</span>
                              <span>Uses: {code.usedCount}{code.maxUses ? `/${code.maxUses}` : ''}</span>
                              <span>Expires: {formatDate(code.expiresAt)}</span>
                              {code.productName && <span>Product: {code.productName}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-stone-600"
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
                              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteCode(code.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
