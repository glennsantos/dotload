import Link from "next/link"
import Image from "next/image"
import { Plus } from "lucide-react"
import ProductsList from "./components/ProductsList"

export default function ProductsPage() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-normal">Products</h1>
        <Link href="/products/new" className="px-4 py-2 bg-black text-white rounded-md flex items-center gap-2">
          <Plus size={18} /> New Product
        </Link>
      </div>

      <ProductsList />
    </div>
  )
}
