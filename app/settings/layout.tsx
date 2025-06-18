"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, StoreIcon, UserIcon, CreditCardIcon, ChevronDown } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const tabs = [
    { name: "Account", path: "/settings", icon: <UserIcon size={16} /> },
    { name: "Brand Settings", path: "/settings/brand", icon: <StoreIcon size={16} /> },
    { name: "Billing", path: "/settings/billing", icon: <CreditCardIcon size={16} /> },
  ]
  
  // Find active tab
  const activeTab = tabs.find(tab => pathname === tab.path) || tabs[0]

  return (
    <>
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border py-2">
        {/* Back to Dashboard Link */}
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center w-full border-b border-border rounded-lg p-2 transition-colors">
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
              <h1 className="text-xl sm:text-2xl font-light text-foreground">Settings</h1>
              <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground font-light">Manage your account and brand preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 mt-32">

      {/* Settings Tabs */}
      <div className="claude-card overflow-hidden mb-8">
        {/* Mobile Dropdown */}
        <div className="md:hidden relative w-full">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between bg-background px-4 py-3 text-sm font-light rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-2">
              {activeTab.icon}
              <span>{activeTab.name}</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "transform rotate-180")} />
          </button>
          
          {isOpen && (
            <div className="mt-1 mx-6 py-1 bg-background rounded-xl border border-border fixed inset-x-0 mx-2 z-50 px-2 py-2 shadow-lg">
              {tabs.map((tab) => {
                const isActive = pathname === tab.path
                
                return (
                  <Link
                    key={tab.name}
                    href={tab.path}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-light whitespace-nowrap transition-colors w-full rounded-lg",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {tab.icon}
                    {tab.name}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
        
        {/* Desktop Tabs */}
        <div className="hidden md:flex overflow-x-auto py-2 px-2 justify-evenly">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path
            
            return (
              <Link
                key={tab.name}
                href={tab.path}
                className={cn(
                  "flex flex-1 justify-center items-center gap-2 px-4 py-3 text-sm font-light whitespace-nowrap transition-colors rounded-lg",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {tab.icon}
                {tab.name}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Page Content */}
      {children}
    </div>
    </>
  )
}
