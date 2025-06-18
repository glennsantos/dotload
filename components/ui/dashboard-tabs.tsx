"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, ShoppingCart, Package, Tag, Users, ShoppingBag, Percent, ChevronDown } from "lucide-react"
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
  const [isOpen, setIsOpen] = useState(false);
  
  // Define all tabs
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
      icon: <Percent className="h-4 w-4" />,
      href: "/dashboard/promos"
    },
    {
      label: "Customers",
      icon: <Users className="h-4 w-4" />,
      href: "/dashboard/customers"
    }
  ];

  // Find active tab
  const activeTabItem = tabs.find(tab => {
    return activeTab 
      ? tab.label.toLowerCase() === activeTab.toLowerCase()
      : pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
  }) || tabs[0];

  return (
    <div className="claude-card rounded-2xl overflow-hidden mb-12 mt-6">
      {/* Mobile Dropdown */}
      <div className="md:hidden relative w-full">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-transparent px-4 py-2 text-sm font-light rounded-lg text-foreground"
        >
          <div className="flex items-center gap-2">
            {activeTabItem.icon}
            <span>{activeTabItem.label}</span>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "transform rotate-180")} />
        </button>
        
        {isOpen && (
          <div className="mt-1 mx-6 py-1 claude-card rounded-xl fixed inset-x-0 mx-2 z-50 px-2 py-2">
            {tabs.map((tab) => {
              const isActive = activeTab 
                ? tab.label.toLowerCase() === activeTab.toLowerCase()
                : pathname === tab.href || 
                  (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
              
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-light whitespace-nowrap transition-colors w-full",
                    isActive 
                      ? "bg-primary/10 text-primary rounded-lg" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Desktop Tabs */}
      <div className="hidden md:flex overflow-x-auto py-2 px-2 justify-evenly">
        {tabs.map((tab) => {
          const isActive = activeTab 
            ? tab.label.toLowerCase() === activeTab.toLowerCase()
            : pathname === tab.href || 
              (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
          
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                "flex flex-1 justify-center items-center gap-2 px-4 py-2 text-sm font-light whitespace-nowrap transition-colors rounded-lg",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
