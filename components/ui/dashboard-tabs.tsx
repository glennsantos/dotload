"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, ShoppingCart, Package, Tag, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface TabItem {
  label: string
  icon: React.ReactNode
  href: string
}

interface DashboardTabsProps {
  activeTab?: string
}

export function DashboardTabs({ activeTab }: DashboardTabsProps) {
  const pathname = usePathname();
  
  const tabs: TabItem[] = [
    {
      label: "Overview",
      icon: <BarChart3 className="h-4 w-4" />,
      href: "/dashboard"
    },
    {
      label: "Sales",
      icon: <ShoppingCart className="h-4 w-4" />,
      href: "/dashboard/sales"
    },
    {
      label: "Products",
      icon: <Package className="h-4 w-4" />,
      href: "/products"
    },
    {
      label: "Promos",
      icon: <Tag className="h-4 w-4" />,
      href: "/dashboard/promos"
    },
    {
      label: "Customers",
      icon: <Users className="h-4 w-4" />,
      href: "/dashboard/customers"
    }
  ]

  return (
    <div className="bg-white rounded-full shadow-sm border border-stone-100 overflow-hidden mb-6">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => {
          // Check if this tab is active based on the current pathname
          const isActive = activeTab 
            ? tab.label.toLowerCase() === activeTab.toLowerCase()
            : pathname === tab.href || 
              (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
          
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                isActive 
                  ? "bg-emerald-100 text-emerald-600" 
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
              )}
            >
              {tab.icon}
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
