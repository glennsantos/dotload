"use client"

import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, StoreIcon, UserIcon, CreditCardIcon } from "lucide-react"
import { usePathname } from "next/navigation"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const tabs = [
    { name: "Account", path: "/settings", icon: <UserIcon size={16} /> },
    { name: "Brand Settings", path: "/settings/brand", icon: <StoreIcon size={16} /> },
    { name: "Billing", path: "/settings/billing", icon: <CreditCardIcon size={16} /> },
  ]

  return (
    <>
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm border-b border-stone-200 py-2">
        {/* Back to Dashboard Link */}
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-black flex items-center w-full border-b border-stone-100 rounded-lg p-2">
          <ChevronLeft size={16} className="mr-1" />
          Back to Dashboard
        </Link>
        <div className="flex justify-between items-center h-16 px-4 sm:px-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link href="/" className="block">
              <Image 
                src="/logo.png" 
                alt="Alacart Logo" 
                width={100}
                height={28}
                className="h-6 w-auto sm:h-7"
                priority
              />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-light text-stone-800">Settings</h1>
              <p className="hidden sm:block text-xs sm:text-sm text-stone-500 font-light">Manage your account and brand preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 mt-32">

      {/* Settings Tabs */}
      <div className="flex bg-white rounded-xl shadow-sm border border-stone-200 mb-8 p-1.5">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.path}
            className={`flex-1 px-6 py-2 text-center text-sm font-light rounded-lg ${
              pathname === tab.path
                ? "bg-emerald-200 text-emerald-600"
                : "text-stone-600 hover:text-stone-800 hover:bg-stone-50"
            }`}
          >
            <div className="flex justify-center items-center gap-2">
              {tab.icon}
              {tab.name}
            </div>
          </Link>
        ))}
      </div>

      {/* Page Content */}
      {children}
    </div>
    </>
  )
}
