import Link from "next/link"
import Image from "next/image"
import { Plus, Search } from "lucide-react"
import ProductsList from "./components/ProductsList"

export default function ProductsPage() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-normal">Products</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search"
              className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <Link href="/products/new" className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md flex items-center gap-2">
            <Plus size={18} /> New product
          </Link>
        </div>
      </div>
      <ProductsList />
    </div>
  )
}
