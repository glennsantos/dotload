"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Search, Bell, User } from "lucide-react"

export default function TopNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-black text-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <Link href="/dashboard" className="text-2xl font-bold mr-8">
            alaCarte
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link href="/dashboard" className="hover:text-gray-300">
              Dashboard
            </Link>
            <Link href="/products" className="hover:text-gray-300">
              Products
            </Link>
            <Link href="/analytics" className="hover:text-gray-300">
              Analytics
            </Link>
            <Link href="/audience" className="hover:text-gray-300">
              Audience
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <button className="hover:text-gray-300">
            <Search size={20} />
          </button>
          <button className="hover:text-gray-300">
            <Bell size={20} />
          </button>
          <button className="hover:text-gray-300">
            <User size={20} />
          </button>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="px-4 pt-2 pb-4 space-y-2 md:hidden">
          <Link href="/dashboard" className="block py-2 hover:text-gray-300" onClick={() => setMobileMenuOpen(false)}>
            Dashboard
          </Link>
          <Link href="/products" className="block py-2 hover:text-gray-300" onClick={() => setMobileMenuOpen(false)}>
            Products
          </Link>
          <Link href="/analytics" className="block py-2 hover:text-gray-300" onClick={() => setMobileMenuOpen(false)}>
            Analytics
          </Link>
          <Link href="/audience" className="block py-2 hover:text-gray-300" onClick={() => setMobileMenuOpen(false)}>
            Audience
          </Link>
          <Link href="/settings" className="block py-2 hover:text-gray-300" onClick={() => setMobileMenuOpen(false)}>
            Settings
          </Link>
          <Link href="/help" className="block py-2 hover:text-gray-300" onClick={() => setMobileMenuOpen(false)}>
            Help
          </Link>
        </nav>
      )}
    </header>
  )
}
