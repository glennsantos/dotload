"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Menu, X, Search, Bell, User, LogOut, Settings } from "lucide-react"
import { useRouter } from "next/navigation"



interface TopNavigationProps {
  user?: {
    id?: string;
    name?: string | null;
    email?: string;
  } | null;
}

export default function TopNavigation({ user: initialUser }: TopNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [user, setUser] = useState(initialUser)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const userMenuRef = useRef<HTMLDivElement>(null)
  
  // Log initial user data from server
  console.log('Initial user data from server:', initialUser)
  
  // Check authentication status on the client side
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        console.log('Checking auth on client side...');
        
        // First try to use the initialUser from server-side props
        if (initialUser) {
          console.log('Using server-provided user data:', initialUser);
          setUser(initialUser);
          setIsLoading(false);
          return;
        }
        
        // If no server-side user data, make client-side request
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Include credentials to send cookies
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Client-side auth check successful:', data.user);
          setUser(data.user);
        } else {
          const errorText = await response.text();
          console.log('Client-side auth check failed:', errorText);
          // Check if we need to redirect to login
          if (response.status === 401) {
            console.log('User is not authenticated, showing login options');
          }
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [initialUser]);
  
  // Log user state changes
  useEffect(() => {
    console.log('Current user state:', user);
  }, [user]);

  // Handle clicks outside the user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        router.push('/login')
      } else {
        console.error('Logout failed')
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
      setMobileMenuOpen(false)
      setUserMenuOpen(false)
    }
  }

  return (
    <header className="bg-black text-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <Link href="/products" className="text-2xl font-bold mr-8">
            alaCarte
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link href="/products" className="hover:text-gray-300">
              Products
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <button className="hover:text-gray-300">
            <Search size={20} />
          </button>
          <button className="hover:text-gray-300">
            <Bell size={20} />
          </button>
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center hover:text-gray-300 focus:outline-none"
              >
                <User size={20} />
                <span className="ml-2 hidden md:inline">{user.name || user.email}</span>
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-md shadow-xl z-20">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                    <p className="font-medium">{user.name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link 
                    href="/settings" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings size={16} className="mr-2" />
                    Settings
                  </Link>
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOut size={16} className="mr-2" />
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="hover:text-gray-300">
              <User size={20} />
            </Link>
          )}
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="px-4 pt-2 pb-4 space-y-2 md:hidden">
          <Link href="/products" className="block py-2 hover:text-gray-300" onClick={() => setMobileMenuOpen(false)}>
            Products
          </Link>
          
          {user ? (
            <>
              <Link href="/settings" className="block py-2 hover:text-gray-300" onClick={() => setMobileMenuOpen(false)}>
                <span className="flex items-center">
                  <Settings size={18} className="mr-2" />
                  Settings
                </span>
              </Link>
              <Link href="/help" className="block py-2 hover:text-gray-300" onClick={() => setMobileMenuOpen(false)}>
                Help
              </Link>
              <button 
                className="flex items-center w-full py-2 text-red-400 hover:text-red-300"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut size={18} className="mr-2" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </>
          ) : (
            <Link href="/login" className="block py-2 hover:text-gray-300" onClick={() => setMobileMenuOpen(false)}>
              <span className="flex items-center">
                <User size={18} className="mr-2" />
                Login
              </span>
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}
