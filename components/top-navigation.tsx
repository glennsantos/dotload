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
                <div className="absolute right-0 mt-2 w-52 bg-background text-foreground rounded-2xl shadow-xl z-50 border border-border claude-card p-2">
                  <Link 
                    href="/dashboard" 
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center px-3 py-3 rounded-xl hover:bg-emerald-50 text-foreground transition-colors group"
                  >
                    <BarChart3 className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-emerald-600" />
                    <span className="font-light">Dashboard</span>
                  </Link>
                  <Link 
                    href="/settings" 
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center px-3 py-3 rounded-xl hover:bg-emerald-50 text-foreground transition-colors group"
                  >
                    <Settings className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-emerald-600" />
                    <span className="font-light">Settings</span>
                  </Link>
                  <Link 
                    href="/products" 
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center px-3 py-3 rounded-xl hover:bg-emerald-50 text-foreground transition-colors group"
                  >
                    <Package className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-emerald-600" />
                    <span className="font-light">Products</span>
                  </Link>
                  <div className="border-t border-border my-2"></div>
                  <button
                    className="flex items-center w-full px-3 py-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors group"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-light">Sign Out</span>
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
        <nav className="px-4 pt-2 pb-4 space-y-1 md:hidden bg-background/95 backdrop-blur-sm border-t border-border">
          <Link href="/products" className="flex items-center px-3 py-3 rounded-xl hover:bg-emerald-50 text-foreground transition-colors font-light" onClick={() => setMobileMenuOpen(false)}>
            <Package size={18} className="mr-3 text-muted-foreground" />
            Products
          </Link>
          
          {user && hasPurchases && (
            <Link href="/purchases" className="flex items-center px-3 py-3 rounded-xl hover:bg-emerald-50 text-foreground transition-colors font-light" onClick={() => setMobileMenuOpen(false)}>
              <ShoppingBag size={18} className="mr-3 text-muted-foreground" />
              Purchases
            </Link>
          )}
          
          {user ? (
            <>
              <Link href="/settings" className="flex items-center px-3 py-3 rounded-xl hover:bg-emerald-50 text-foreground transition-colors font-light" onClick={() => setMobileMenuOpen(false)}>
                <Settings size={18} className="mr-3 text-muted-foreground" />
                Settings
              </Link>
              <Link href="/transactions" className="flex items-center px-3 py-3 rounded-xl hover:bg-emerald-50 text-foreground transition-colors font-light" onClick={() => {
                console.log('Mobile Transactions menu item clicked');
                setMobileMenuOpen(false);
              }}>
                <BookOpen size={18} className="mr-3 text-muted-foreground" />
                Transactions
              </Link>
              <div className="border-t border-border my-2"></div>
              <button 
                className="flex items-center w-full px-3 py-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors font-light"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut size={18} className="mr-3" />
                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </>
          ) : (
            <Link href="/login" className="flex items-center px-3 py-3 rounded-xl hover:bg-emerald-50 text-foreground transition-colors font-light" onClick={() => setMobileMenuOpen(false)}>
              <User size={18} className="mr-3 text-muted-foreground" />
              Login
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}
