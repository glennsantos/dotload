"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus, Menu, ChevronDown, Settings, LogOut } from "lucide-react";
import { useState } from "react";
import { MobileMenu } from "./MobileMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  userName: string;
  userEmail?: string;
  userLogo?: string;
}

export function DashboardHeader({ userName, userEmail, userLogo }: DashboardHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <MobileMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        userName={userName}
        userEmail={userEmail}
        userLogo={userLogo}
      />
      
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm border-b border-stone-200 py-2">
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
              <h1 className="text-xl sm:text-2xl font-light text-stone-800">Dashboard</h1>
              <p className="hidden sm:block text-xs sm:text-sm text-stone-500 font-light">Welcome back, {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <Button
                asChild 
                variant="default"
                className="h-9 px-4 text-sm font-light"
              >
                <Link href="/create-product" className="flex items-center gap-1">
                  <Plus size={16} /> Create Product
                </Link>
              </Button>
            </div>
            
            <div className="hidden md:block">
              <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 rounded-full relative overflow-hidden hover:bg-stone-100"
            >
              <div className="h-9 w-9 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600 font-medium text-sm">
                {userLogo ? <Image src={userLogo} alt="User Logo" width={40} height={40} /> : userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground break-all">
                  {userEmail || 'No email provided'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/api/auth/logout" className="cursor-pointer flex items-center">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
            {/* Mobile profile button */}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden h-9 w-9 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600 font-medium text-sm"
              aria-label="Profile menu"
            >
              {userLogo ? <Image src={userLogo} alt="User Logo" width={40} height={40} /> : userName ? userName.charAt(0).toUpperCase() : 'U'}
            </button>
          </div>
        </div>
      </div>
      <div className="h-16"></div>
    </>
  );
}
