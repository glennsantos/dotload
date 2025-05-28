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
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden mb-6">
      <div className="flex overflow-x-auto py-2 px-2 justify-evenly">
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
                "flex flex-1 justify-center items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-lg",
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
