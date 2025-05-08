"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { User, LogOut, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";

// No longer using Radix UI components due to potential React 19 compatibility issues

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string;
  };
}

// Create a simple portal component for rendering dropdown outside the DOM hierarchy
function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  return mounted ? createPortal(children, document.body) : null;
}

export default function UserMenu({ user }: UserMenuProps) {
  console.log('UserMenu component rendered with user:', user);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Function to calculate and set menu position
  const updateMenuPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        right: window.innerWidth - rect.right - window.scrollX
      });
    }
  }, []);
  
  // Track if component is mounted on client
  useEffect(() => {
    setIsClient(true);
    
    // Add global click handler to close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };
    
    // Log debug info when menu state changes
    if (typeof window !== 'undefined' && window.debugUtils) {
      window.debugUtils.logEvent(`UserMenu: isOpen changed to ${isOpen}`);
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Redirect to login page
        router.push('/login');
      } else {
        // Handle logout error
        const errorData = await response.json();
        console.error('Logout failed:', errorData);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything on server
  if (!isClient) return null;
  
  // Use a custom dropdown implementation that doesn't rely on Radix UI
  return (
    <div className="relative">
      <Button 
        ref={buttonRef}
        variant="ghost" 
        size="icon" 
        className="rounded-full"
        onClick={() => {
          console.log('UserMenu trigger clicked, current state:', !isOpen);
          // Update position before opening menu
          updateMenuPosition();
          setIsOpen(!isOpen);
          
          // Log debug info
          if (typeof window !== 'undefined' && window.debugUtils) {
            window.debugUtils.logEvent('UserMenu button clicked');
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <User className="h-5 w-5" />
      </Button>
      
      {isOpen && (
        <Portal>
          <div 
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsOpen(false)}
            data-testid="dropdown-backdrop"
          />
          <div 
            className="fixed mt-2 w-56 rounded-md shadow-lg bg-white z-50 py-1 ring-1 ring-black ring-opacity-5 focus:outline-none"
            style={{
              top: menuPosition.top,
              right: menuPosition.right,
            }}
            data-testid="user-menu-dropdown"
          >
            {/* User info */}
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium">{user.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user.email || 'No email'}</p>
            </div>
            
            {/* Menu items */}
            <div className="py-1">
              <button
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/settings');
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </button>
              
              <button
                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                disabled={isLoading}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
