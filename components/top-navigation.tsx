"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Menu, X, Search, Bell, User, LogOut, Settings, ShoppingBag, Wallet, BookOpen, BarChart3, Package } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

// Create a custom event for auth state changes
declare global {
  interface WindowEventMap {
    'auth:login': CustomEvent<{user: any}>
    'auth:logout': CustomEvent
  }
}


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
  const [hasPurchases, setHasPurchases] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const userMenuRef = useRef<HTMLDivElement>(null)
  
  // Check if current path is an auth page
  const isAuthPage = ["/login", "/register", "/forgot-password"].includes(pathname)
  
  // Check authentication status on the client side
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        // First try to use the initialUser from server-side props
        if (initialUser) {
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
          
          // Check if user has purchases for buyer dashboard link
          if (data.user?.id) {
            checkUserPurchases(data.user.id);
          }
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
    
    // Add event listeners for auth state changes
    const handleLogin = (event: CustomEvent<{user: any}>) => {
      console.log('Auth:login event received', event.detail.user);
      setUser(event.detail.user);
      if (event.detail.user?.id) {
        checkUserPurchases(event.detail.user.id);
      }
    };
    
    const handleLogout = () => {
      console.log('Auth:logout event received');
      setUser(null);
      setHasPurchases(false);
    };
    
    window.addEventListener('auth:login', handleLogin as EventListener);
    window.addEventListener('auth:logout', handleLogout);
    
    return () => {
      window.removeEventListener('auth:login', handleLogin as EventListener);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [initialUser]);
  
  // Check if user has purchases
  const checkUserPurchases = async (userId: string) => {
    try {
      const response = await fetch('/api/purchases', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        // Check if data is an array and has items
        const hasItems = Array.isArray(data) && data.length > 0;
        console.log('User has purchases:', hasItems);
        setHasPurchases(hasItems);
      }
    } catch (error) {
      console.error('Error checking user purchases:', error);
    }
  };
  
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
      // Clear localStorage token
      try {
        localStorage.removeItem('auth_token');
      } catch (e) {
        // Ignore localStorage errors
      }
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // Update user state immediately
        setUser(null)
        // Dispatch logout event
        window.dispatchEvent(new CustomEvent('auth:logout'))
        
        // Get the response data to use the redirectUrl
        const data = await response.json()
        console.log('Logout successful, redirecting to:', data.redirectUrl)
        
        // Use the redirectUrl from the response if available, otherwise fallback to /login
        if (data.redirectUrl) {
          // Use router.push instead of window.location for better cookie handling
          router.push('/login')
        } else {
          router.push('/login')
        }
      } else {
        console.error('Logout failed')
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback to local redirect in case of error
      router.push('/login')
    } finally {
      setIsLoggingOut(false)
      setMobileMenuOpen(false)
      setUserMenuOpen(false)
    }
  }

  // Don't render navigation on auth pages
  if (isAuthPage) {
    return null
  }
  
  return (
    <header className="bg-black text-white shadow-md">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/products" className="text-2xl font-bold mr-8">
                          dotload
          </Link>
        </div>

        <div className="flex items-center space-x-6">
          <Link href="/products" className="hover:text-muted-foreground">
            Products
          </Link>
          {user && (
            <Link href="/buyer-dashboard" className="hover:text-muted-foreground">
              Purchases
            </Link>
          )}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center hover:text-muted-foreground focus:outline-none"
              >
                <User size={20} />
                <span className="ml-2 hidden md:inline">{user.name || user.email}</span>
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-background text-foreground rounded-lg shadow-lg z-50 border border-border">
                  <Link 
                    href="/dashboard" 
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2 hover:bg-muted flex items-center"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link 
                    href="/settings" 
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted flex items-center"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                  <Link 
                    href="/products" 
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted flex items-center"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Products
                  </Link>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted flex items-center"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="hover:text-muted-foreground">
              <User size={20} />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="px-4 pt-2 pb-4 space-y-2 md:hidden">
          <Link href="/products" className="block py-2 hover:text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
            Products
          </Link>
          
          {user && hasPurchases && (
            <Link href="/purchases" className="block py-2 hover:text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
              <span className="flex items-center">
                <ShoppingBag size={18} className="mr-2" />
                Purchases
              </span>
            </Link>
          )}
          
          {user ? (
            <>
              <Link href="/settings" className="block py-2 hover:text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
                <span className="flex items-center">
                  <Settings size={18} className="mr-2" />
                  Settings
                </span>
              </Link>
              <Link href="/transactions" className="block py-2 hover:text-muted-foreground" onClick={() => {
                console.log('Mobile Transactions menu item clicked');
                setMobileMenuOpen(false);
              }}>
                <span className="flex items-center">
                  <BookOpen size={18} className="mr-2" />
                  Transactions
                </span>
              </Link>
              <button 
                className="flex items-center w-full py-2 text-destructive hover:text-destructive/80"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut size={18} className="mr-2" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </>
          ) : (
            <Link href="/login" className="block py-2 hover:text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
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
