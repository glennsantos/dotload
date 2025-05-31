"use client";

import { X, LogOut, Settings, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getClientUser } from "@/lib/client-auth-utils";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

type MenuItem = {
  label: string;
  icon: React.ReactNode;
  href: string;
  isActive?: boolean;
};

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [userData, setUserData] = useState({
    userName: "User",
    userEmail: "",
    userLogo: ""
  });
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
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
      }
    };
    
    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-3/4 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col sm:max-w-xs",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-stone-800">Menu</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-stone-100 text-stone-500"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className="px-6 py-4">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-medium text-lg overflow-hidden">
              {userData.userLogo ? (
                <img 
                  src={userData.userLogo} 
                  alt="User Logo" 
                  className="h-full w-full object-cover"
                />
              ) : (
                userData.userName?.[0]?.toUpperCase() || 'T'
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-stone-900">{userData.userName}</p>
              {userData.userEmail && (
                <p className="text-xs text-stone-500">{userData.userEmail}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="px-6 py-4">
          <h3 className="text-sm font-medium text-stone-800 mb-3">Actions</h3>
          <Button 
            asChild
            className="w-full"
          >
            <Link href="/create-product" onClick={onClose}>
              <Plus className="h-5 w-5 mr-2" />
              Create Product
            </Link>
          </Button>
        </div>

        {/* Account Section */}
        <div className="py-6 mt-4 mx-6 border-t border-stone-200">
          <h3 className="text-sm font-medium text-stone-800 mb-3">Account</h3>
          <ul className="space-y-3 pl-4">
            <li>
              <Link href="/settings" className="cursor-pointer flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </li>
            <li>
              <Link href="/api/auth/logout" className="cursor-pointer flex items-center">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
