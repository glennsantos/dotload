"use client"

import Link from "next/link"
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Back to Dashboard Link */}
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-black flex items-center">
          <ChevronLeft size={16} className="mr-1" />
          Back to Dashboard
        </Link>
      </div>

      {/* Settings Tabs */}
      <div className="flex bg-white rounded-full shadow-sm border border-stone-200 mb-8 p-1.5">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.path}
            className={`flex-1 px-6 py-2 text-center text-sm font-light rounded-full ${
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
  )
}
