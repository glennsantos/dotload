import Link from "next/link"
import { Plus } from "lucide-react"

export default function ProductsPage() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-normal">Products</h1>
        <Link href="/products/new" className="px-4 py-2 bg-black text-white rounded-md flex items-center gap-2">
          <Plus size={18} /> New Product
        </Link>
      </div>

      <div className="border rounded-md p-8 text-center">
        <h2 className="text-xl font-medium mb-2">You don't have any products yet</h2>
        <p className="text-gray-600 mb-6">Create your first product to start selling</p>
        <Link href="/products/new" className="px-4 py-2 bg-black text-white rounded-md inline-flex items-center gap-2">
          <Plus size={18} /> Create Product
        </Link>
      </div>
    </div>
  )
}
