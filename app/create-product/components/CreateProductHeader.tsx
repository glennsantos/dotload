"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus, Menu, ChevronDown, Settings, LogOut, ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { getClientUser } from "@/lib/client-auth-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CreateProductHeader() {
  const [userData, setUserData] = useState({
    userName: "User",
    userEmail: "",
    userLogo: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const user = await getClientUser();
        
        if (user) {
          setUserData({
            userName: user.name || 'User',
            userEmail: user.email || '',
            userLogo: user.storeLogoPath || ''
          });
        } else {
          console.warn('No user found or not authenticated');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm border-b border-stone-200 py-2">
        {/* Back to Dashboard button */}
        <Link href="/products" className="text-sm text-stone-500 hover:text-stone-700">
          <span className="flex items-center pl-4 mt-2 pb-4 border-b border-stone-200">
            <ChevronLeft size={16} className="mr-1" />
            Back to Dashboard
          </span>
        </Link>
        <div className="flex justify-between items-center h-16 px-4 sm:px-6">
          <div className="flex items-center space-x-3 sm:space-x-4 my-6">
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
              <h1 className="text-xl sm:text-2xl font-light text-stone-800">Create Product</h1>
              <p className="hidden sm:block text-xs sm:text-sm text-stone-500 font-light">Build your checkout page</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
           
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-9 w-9 rounded-full relative overflow-hidden hover:bg-stone-100"
                  >
                    <div className="h-9 w-9 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600 font-medium text-sm">
                      {userData.userLogo ? <Image src={userData.userLogo} alt="User Logo" width={40} height={40} /> : userData.userName ? userData.userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userData.userName || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground break-all">
                        {userData.userEmail || 'No email provided'}
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
            <div className="md:hidden">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 rounded-full relative overflow-hidden hover:bg-stone-100"
              >
                <div className="h-9 w-9 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600 font-medium text-sm">
                  {userData.userLogo ? <Image src={userData.userLogo} alt="User Logo" width={40} height={40} /> : userData.userName ? userData.userName.charAt(0).toUpperCase() : 'U'}
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="h-16"></div>
    </>
  );
}
