import Link from "next/link"
import Image from "next/image"
import { Package, TrendingUp, DollarSign, Plus, Settings, LogOut, Users, ShoppingCart, ArrowRight } from "lucide-react"
import { DashboardTabs } from "@/components/ui/dashboard-tabs"
import { StatsCard } from "@/components/ui/stats-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { formatCurrency } from "@/lib/utils"

async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    const tokenValue = token?.value;

    if (!tokenValue) return null;

    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
    const decoded = jwt.verify(tokenValue, JWT_SECRET) as { userId: string, email: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true }
    });

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Define types for purchases and transactions
type Product = {
  id: string;
  name: string;
  description?: string;
  price?: number;
  userId: string;
};

type Purchase = {
  id: string;
  email?: string;
  amount?: number;
  productId: string;
  userId?: string;
  createdAt: Date;
  product: Product;
};

async function getStats(userId: string) {
  // Get product count
  const productCount = await prisma.product.count({
    where: { userId }
  });

  // Get sales count and total revenue
  const purchases = await prisma.purchase.findMany({
    where: {
      OR: [
        { userId },
        { product: { userId } }
      ]
    },
    include: {
      product: true
    }
  }) as Purchase[];

  const salesCount = purchases.length;
  const totalRevenue = purchases.reduce((sum: number, purchase: Purchase) => sum + (purchase.amount || 0), 0);
  
  // Get customer count
  const customers = await prisma.purchase.findMany({
    where: {
      product: { userId }
    },
    select: {
      email: true
    },
    distinct: ['email']
  });

  const customerCount = customers.length;

  // Get recent transactions
  const recentTransactions = await prisma.purchase.findMany({
    where: {
      OR: [
        { userId },
        { product: { userId } }
      ]
    },
    include: {
      product: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  }) as Purchase[];

  return {
    productCount,
    salesCount,
    totalRevenue,
    customerCount,
    recentTransactions
  };
}

export default async function Dashboard() {
  // Get user data from server-side
  const user = await getCurrentUser();
  if (!user) {
    return null; // Will redirect to login in middleware
  }
  
  const userName = user.name || "User";
  const stats = await getStats(user.id);
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Dashboard Header with Welcome Message and Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Dashboard</h1>
          <p className="text-stone-600 font-light">Welcome back, {userName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            asChild
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center gap-2"
          >
            <Link href="/products/new">
              <Plus size={16} /> Create Product
            </Link>
          </Button>
          <Button 
            asChild
            variant="outline"
            className="border-stone-200 text-stone-700 hover:bg-stone-50 rounded-md"
          >
            <Link href="/settings">
              <Settings size={16} />
              <span className="sr-only md:not-sr-only md:ml-2">Settings</span>
            </Link>
          </Button>
          <Button 
            asChild
            variant="outline"
            className="border-stone-200 text-stone-700 hover:bg-stone-50 rounded-md"
          >
            <Link href="/api/auth/logout">
              <LogOut size={16} />
              <span className="sr-only md:not-sr-only md:ml-2">Logout</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Horizontal Tab Menu */}
      <div className="mb-8">
        <DashboardTabs activeTab="overview" />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Products"
          value={stats.productCount.toString()}
          subtitle="Active products"
          icon={<Package className="h-5 w-5 text-emerald-600" />}
          iconClassName="bg-emerald-100"
        />
        
        <StatsCard
          title="Total Sales"
          value={stats.salesCount.toString()}
          subtitle="Completed orders"
          icon={<ShoppingCart className="h-5 w-5 text-blue-600" />}
          iconClassName="bg-blue-100"
        />
        
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          subtitle="Total earnings"
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          iconClassName="bg-green-100"
        />
        
        <StatsCard
          title="Customers"
          value={stats.customerCount.toString()}
          subtitle="Unique customers"
          icon={<Users className="h-5 w-5 text-purple-600" />}
          iconClassName="bg-purple-100"
        />
      </div>

      {/* Recent Sales Section */}
      <div className="border border-stone-200 rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-stone-800">Recent Sales</h2>
          <Button asChild variant="outline" size="sm" className="text-sm">
            <Link href="/dashboard/sales" className="flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
        
        {stats.recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="mx-auto h-12 w-12 text-stone-300 mb-4" />
            <p className="text-lg font-medium mb-2">No sales yet</p>
            <p className="text-sm text-stone-500 mb-6">Start selling to see transactions here!</p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link href="/products/new">Create a product</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.recentTransactions.map((transaction: Purchase) => (
              <div key={transaction.id} className="border border-stone-200 rounded-lg p-4 hover:bg-stone-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                      <h3 className="font-medium truncate text-stone-800">{transaction.product.name}</h3>
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        Completed
                      </Badge>
                    </div>
                    <p className="text-sm text-stone-500">
                      {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {transaction.email && (
                      <p className="text-xs text-stone-500 mt-1 truncate">
                        Customer: {transaction.email}
                      </p>
                    )}
                  </div>
                  <div className="text-lg font-semibold whitespace-nowrap text-green-600">
                    {formatCurrency(transaction.amount || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
