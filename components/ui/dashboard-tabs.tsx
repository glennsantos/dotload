"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, ShoppingCart, Package, Tag, Users, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

interface TabItem {
  label: string
  icon: React.ReactNode
  href: string
}

interface DashboardTabsProps {
  activeTab?: string
  hideAdvancedTabs?: boolean
}

export function DashboardTabs({ activeTab, hideAdvancedTabs }: DashboardTabsProps) {
  const pathname = usePathname();
  const [hasProducts, setHasProducts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user has products
  useEffect(() => {
    async function checkProducts() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/products');
        
        if (response.ok) {
          const data = await response.json();
          setHasProducts(data.length > 0);
        }
      } catch (error) {
        console.error('Error checking products:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkProducts();
  }, []);
  
  // Define all possible tabs
  const allTabs: TabItem[] = [
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
      label: "Purchases",
      icon: <ShoppingBag className="h-4 w-4" />,
      href: "/dashboard/purchases"
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
  ];
  
  // Filter tabs based on whether the user has products
  const visibleTabs = allTabs.filter(tab => {
    // Always show Overview, Products, and Purchases tabs
    if (
      tab.label === "Overview" || 
      tab.label === "Products" || 
      tab.label === "Purchases"
    ) {
      return true;
    }
    
    // Only show Sales, Promos, and Customers tabs if user has products
    return hasProducts && !hideAdvancedTabs;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden mb-6">
      <div className="flex overflow-x-auto py-2 px-2 justify-evenly">
        {visibleTabs.map((tab) => {
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
