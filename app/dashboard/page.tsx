import Link from "next/link"
import Image from "next/image"
import { Package, TrendingUp, DollarSign, Plus, Settings, LogOut } from "lucide-react"
import { DashboardTabs } from "@/components/ui/dashboard-tabs"
import { StatsCard } from "@/components/ui/stats-card"
import { Button } from "@/components/ui/button"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

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

export default async function Dashboard() {
  // Get user data from server-side
  const user = await getCurrentUser();
  const userName = user?.name || "User"
  
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Products"
          value="0"
          subtitle="Active products"
          icon={<Package className="h-5 w-5 text-emerald-600" />}
          iconClassName="bg-emerald-100"
        />
        
        <StatsCard
          title="Total Sales"
          value="0"
          subtitle="Completed orders"
          icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
          iconClassName="bg-blue-100"
        />
        
        <StatsCard
          title="Total Revenue"
          value="$0.00"
          subtitle="Total earnings"
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          iconClassName="bg-green-100"
        />
      </div>

      {/* Recent Sales Section */}
      <div className="border border-stone-200 rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-medium text-stone-800 mb-4">Recent Sales</h2>
        <div className="text-center py-8">
          <p className="text-stone-600">No sales yet. Start selling to see transactions here!</p>
        </div>
      </div>
      
      {/* Create First Product CTA */}
      <div className="border border-stone-200 rounded-lg shadow-sm p-8 text-center mb-8">
        <Image
          src="/placeholder.svg?key=37o07"
          alt="Create your first product"
          width={200}
          height={200}
          className="mx-auto mb-4"
        />
        <h2 className="text-xl font-medium mb-2 text-stone-800">Create your first product</h2>
        <p className="text-stone-600 mb-6 max-w-md mx-auto">
          Start selling digital products, courses, or memberships. Set up your product in minutes.
        </p>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md inline-flex items-center gap-2">
          <Link href="/products/new">
            <Plus size={18} /> Create Product
          </Link>
        </Button>
      </div>
    </div>
  )
}
