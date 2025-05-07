import Link from "next/link"
import Image from "next/image"
import { Plus, TrendingUp, Users, DollarSign } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-normal">Dashboard</h1>
        <Link href="/products/new" className="px-4 py-2 bg-black text-white rounded-md flex items-center gap-2">
          <Plus size={18} /> New Product
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="border rounded-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium">Revenue</h2>
            <DollarSign className="text-green-500" size={20} />
          </div>
          <p className="text-3xl font-bold">$0</p>
          <p className="text-sm text-gray-500">Last 30 days</p>
        </div>

        <div className="border rounded-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium">Sales</h2>
            <TrendingUp className="text-blue-500" size={20} />
          </div>
          <p className="text-3xl font-bold">0</p>
          <p className="text-sm text-gray-500">Last 30 days</p>
        </div>

        <div className="border rounded-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium">Customers</h2>
            <Users className="text-purple-500" size={20} />
          </div>
          <p className="text-3xl font-bold">0</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
      </div>

      <div className="border rounded-md p-8 text-center mb-8">
        <Image
          src="/placeholder.svg?key=37o07"
          alt="Create your first product"
          width={200}
          height={200}
          className="mx-auto mb-4"
        />
        <h2 className="text-xl font-medium mb-2">Create your first product</h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Start selling digital products, courses, or memberships. Set up your product in minutes.
        </p>
        <Link href="/products/new" className="px-4 py-2 bg-black text-white rounded-md inline-flex items-center gap-2">
          <Plus size={18} /> Create Product
        </Link>
      </div>

      <div className="border rounded-md p-6">
        <h2 className="text-xl font-medium mb-4">Recent Activity</h2>
        <div className="text-center py-8">
          <p className="text-gray-500">No recent activity to display</p>
          <p className="text-sm text-gray-400 mt-2">Activity will appear here once you start selling</p>
        </div>
      </div>
    </div>
  )
}
