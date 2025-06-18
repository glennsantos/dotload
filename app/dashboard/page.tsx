import Link from "next/link"
import { Package, TrendingUp, DollarSign, Users, ShoppingCart, LucideBanknote, ArrowRight } from "lucide-react"
import { getCurrentUser } from "@/lib/auth-utils"
import { DashboardTabs } from "@/components/ui/dashboard-tabs"
import { StatsCard } from "@/components/ui/stats-card"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"
import { redirect } from "next/navigation"

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
  const user = await getCurrentUser();

  if (!user) {
    // Explicitly redirect to login page
    redirect('/login?callbackUrl=/dashboard');
    return null;
  }

  const userName = user.name || "User";
  const stats = await getStats(user.id);
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <DashboardHeader />
      
      {/* Horizontal Tab Menu */}
      <DashboardTabs activeTab="overview" />
      
      {/* Stats Cards */}
      <div className="grid mb:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <StatsCard
          title="Total Products"
          value={stats.productCount.toString()}
          subtitle="Active products"
          icon={<Package className="h-5 w-5 text-primary" />}
          iconClassName="bg-primary/10"
        />
        
        <StatsCard
          title="Total Sales"
          value={stats.salesCount.toString()}
          subtitle="Completed orders"
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          iconClassName="bg-primary/10"
        />
        
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          subtitle="Total earnings"
          icon={<LucideBanknote className="h-5 w-5 text-primary" />}
          iconClassName="bg-primary/10"
        />
        
        <StatsCard
          title="Customers"
          value={stats.customerCount.toString()}
          subtitle="Unique customers"
          icon={<Users className="h-5 w-5 text-primary" />}
          iconClassName="bg-primary/10"
        />
      </div>

      {/* Recent Sales Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-light text-foreground">Recent Sales</h2>
          <Button asChild variant="outline" size="sm" className="text-sm">
            <Link href="/dashboard/sales" className="flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
        
        {stats.recentTransactions.length === 0 ? (
          <div className="text-center py-8 claude-card rounded-lg p-4 sm:p-6">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2 text-foreground">No sales yet</p>
            <p className="text-sm text-muted-foreground mb-6">Start selling to see transactions here!</p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-light">
              <Link href="/create-product">+ Create a product</Link>
            </Button>
          </div>
        ) : (
          <div className="claude-card rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Product</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTransactions.map((transaction: Purchase) => (
                    <tr key={transaction.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-foreground">{transaction.product.name}</div>
                          {transaction.email && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Customer: {transaction.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                          Completed
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-medium text-emerald-700">
                          {formatCurrency(transaction.amount || 0)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
