"use client";

import { X, LogOut, Settings, Plus, BarChart3, Package } from "lucide-react";
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
          "fixed top-0 right-0 h-full w-3/4 bg-background shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col sm:max-w-xs",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-light text-foreground">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className="px-6 py-6">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-medium text-lg overflow-hidden">
              {userData.userLogo ? (
                <img 
                  src={userData.userLogo} 
                  alt="User Logo" 
                  className="h-full w-full object-cover rounded-xl"
                />
              ) : (
                userData.userName?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-foreground">{userData.userName}</p>
              {userData.userEmail && (
                <p className="text-xs text-muted-foreground">{userData.userEmail}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="px-6 py-4">
          <h3 className="text-sm font-light text-muted-foreground mb-4">Quick Actions</h3>
          <Button 
            asChild
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-light"
          >
            <Link href="/create-product" onClick={onClose}>
              <Plus className="h-4 w-4 mr-2" />
              Create Product
            </Link>
          </Button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-6 py-4">
          <h3 className="text-sm font-light text-muted-foreground mb-4">Navigation</h3>
          <nav className="space-y-2">
            <Link 
              href="/dashboard" 
              onClick={onClose}
              className="flex items-center px-4 py-3 rounded-xl hover:bg-emerald-50 text-foreground transition-colors group"
            >
              <BarChart3 className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-emerald-600" />
              <span className="font-light">Dashboard</span>
            </Link>
            <Link 
              href="/products" 
              onClick={onClose}
              className="flex items-center px-4 py-3 rounded-xl hover:bg-emerald-50 text-foreground transition-colors group"
            >
              <Package className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-emerald-600" />
              <span className="font-light">Products</span>
            </Link>
            <Link 
              href="/settings" 
              onClick={onClose}
              className="flex items-center px-4 py-3 rounded-xl hover:bg-emerald-50 text-foreground transition-colors group"
            >
              <Settings className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-emerald-600" />
              <span className="font-light">Settings</span>
            </Link>
          </nav>
        </div>

        {/* Logout Section */}
        <div className="px-6 py-6 border-t border-border">
          <button 
            onClick={async () => {
              try {
                const response = await fetch('/api/auth/logout', { method: 'POST' });
                if (response.ok) {
                  window.location.href = '/login';
                }
              } catch (error) {
                console.error('Logout error:', error);
                window.location.href = '/login';
              }
            }}
            className="flex items-center w-full px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors group"
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span className="font-light">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
