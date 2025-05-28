"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Upload, Store } from "lucide-react"
import Image from "next/image"

export default function SettingsPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Store branding state
  const [storeName, setStoreName] = useState("")
  const [storeDescription, setStoreDescription] = useState("")
  const [storeLogo, setStoreLogo] = useState<string | null>(null)
  const [headerImage, setHeaderImage] = useState<string | null>(null)
  const [isSavingBranding, setIsSavingBranding] = useState(false)
  const [brandingMessage, setBrandingMessage] = useState({ type: "", text: "" })
  
  // Refs for file inputs
  const logoInputRef = useRef<HTMLInputElement>(null)
  const headerInputRef = useRef<HTMLInputElement>(null)

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setBrandingMessage({ type: "error", text: "Logo must be JPG, PNG, or WebP format" });
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setBrandingMessage({ type: "error", text: "Logo must be less than 2MB" });
      return;
    }
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setStoreLogo(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle header image file selection
  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setBrandingMessage({ type: "error", text: "Header image must be JPG, PNG, or WebP format" });
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setBrandingMessage({ type: "error", text: "Header image must be less than 2MB" });
      return;
    }
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setHeaderImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle store branding form submission
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrandingMessage({ type: "", text: "" });
    setIsSavingBranding(true);
    
    try {
      // Create form data object
      const formData = new FormData();
      formData.append('storeName', storeName);
      formData.append('storeDescription', storeDescription);
      
      // Get the actual File objects from the refs
      const logoFile = logoInputRef.current?.files?.[0];
      const headerFile = headerInputRef.current?.files?.[0];
      
      // Only append files if they are new uploads
      if (logoFile) {
        formData.append('logoFile', logoFile);
      }
      
      if (headerFile) {
        formData.append('headerFile', headerFile);
      }
      
      // Send the form data to the API
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, browser will set it with boundary for FormData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update store settings');
      }
      
      const data = await response.json();
      
      // Update local state with the returned data
      if (data.user) {
        setStoreName(data.user.storeName || '');
        setStoreDescription(data.user.storeDescription || '');
        setStoreLogo(data.user.storeLogoPath || null);
        setHeaderImage(data.user.storeHeaderPath || null);
      }
      
      setBrandingMessage({ type: "success", text: "Store settings updated successfully" });
    } catch (error) {
      console.error('Save branding error:', error);
      setBrandingMessage({ type: "error", text: error instanceof Error ? error.message : 'Failed to update store settings' });
    } finally {
      setIsSavingBranding(false);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        // Fetch user settings including store branding
        const response = await fetch('/api/user/settings', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          router.push('/login')
          return
        }

        const data = await response.json()
        setUser(data.user)
        
        // Set store branding state from user data
        if (data.user) {
          setStoreName(data.user.storeName || '')
          setStoreDescription(data.user.storeDescription || '')
          setStoreLogo(data.user.storeLogoPath || null)
          setHeaderImage(data.user.storeHeaderPath || null)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset message
    setMessage({ type: "", text: "" })
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords don't match" })
      return
    }
    
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" })
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: "success", text: "Password changed successfully" })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setMessage({ type: "error", text: data.message || "Failed to change password" })
      }
    } catch (error) {
      console.error('Change password error:', error)
      setMessage({ type: "error", text: "An error occurred. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-normal">Settings</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <button className="flex items-center justify-center p-6 bg-white rounded-md border border-stone-200 hover:bg-stone-50">
          <div className="text-center">
            <div className="inline-flex items-center justify-center">
              <Store className="h-6 w-6 text-emerald-600 mr-2" />
              <span className="text-lg font-normal">Store Settings</span>
            </div>
          </div>
        </button>
        
        <button className="flex items-center justify-center p-6 bg-white rounded-md border border-stone-200 hover:bg-stone-50">
          <div className="text-center">
            <div className="inline-flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="10" r="3"></circle>
                <path d="M7 20.662V19c0-1.657 2.239-3 5-3s5 1.343 5 3v1.662"></path>
              </svg>
              <span className="text-lg font-normal">Account</span>
            </div>
          </div>
        </button>
      </div>
      
      <div className="bg-white rounded-md shadow-sm border border-stone-200 p-6 mb-8">
        <h2 className="text-xl font-normal mb-6">Store Branding</h2>
        <p className="text-stone-600 font-light mb-6">Customize your store's appearance (optional)</p>
        
        {brandingMessage.text && (
          <div className={`p-4 mb-6 rounded-md ${brandingMessage.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
            {brandingMessage.text}
          </div>
        )}
        
        <form onSubmit={handleSaveBranding} className="space-y-6">
          <div>
            <label htmlFor="store-name" className="block text-sm font-medium text-stone-700 mb-1">Store Name</label>
            <input
              id="store-name"
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Digital Craft Co."
              className="w-full p-2 border border-stone-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          
          <div>
            <label htmlFor="store-description" className="block text-sm font-medium text-stone-700 mb-1">Store Description</label>
            <textarea
              id="store-description"
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              placeholder="Describe your store..."
              rows={4}
              className="w-full p-2 border border-stone-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Store Logo</label>
              <div className="relative h-32 w-32 border-2 border-dashed border-stone-300 rounded-md flex items-center justify-center overflow-hidden">
                {storeLogo ? (
                  <Image 
                    src={storeLogo} 
                    alt="Store logo" 
                    fill 
                    className="object-cover" 
                    unoptimized={storeLogo.startsWith('data:')} 
                  />
                ) : (
                  <Store className="h-12 w-12 text-stone-400" />
                )}
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="mt-2 px-4 py-2 bg-white border border-stone-300 rounded-md text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Upload Logo
                </button>
                <p className="text-xs text-stone-500 mt-2">JPG, PNG, WebP (max 2MB)</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Header Image</label>
              <div className="relative h-32 w-full border-2 border-dashed border-stone-300 rounded-md flex items-center justify-center overflow-hidden">
                {headerImage ? (
                  <Image 
                    src={headerImage} 
                    alt="Header image" 
                    fill 
                    className="object-cover" 
                    unoptimized={headerImage.startsWith('data:')} 
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-12 w-12 text-stone-400" />
                    <span className="text-stone-500 text-sm mt-2">Upload header image</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={headerInputRef}
                  onChange={handleHeaderChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => headerInputRef.current?.click()}
                  className="mt-2 px-4 py-2 bg-white border border-stone-300 rounded-md text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Upload Header
                </button>
                <p className="text-xs text-stone-500 mt-2">JPG, PNG, WebP (max 2MB)</p>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isSavingBranding}
          >
            {isSavingBranding ? "Saving..." : "Update Store Settings"}
          </button>
        </form>
      </div>
      
      <div className="bg-white rounded-md shadow-sm border border-stone-200 p-6 mb-8">
        <h2 className="text-xl font-normal mb-4">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
            <p className="p-2 bg-stone-50 rounded-md border border-stone-200">{user.name || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <p className="p-2 bg-stone-50 rounded-md border border-stone-200">{user.email}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-md shadow-sm border border-stone-200 p-6">
        <h2 className="text-xl font-normal mb-4">Change Password</h2>
        
        {message.text && (
          <div className={`p-4 mb-4 rounded-md ${message.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleChangePassword}>
          <div className="mb-4">
            <label htmlFor="current-password" className="block text-sm font-medium text-stone-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2 border border-stone-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="new-password" className="block text-sm font-medium text-stone-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border border-stone-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                required
                minLength={8}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirm-password" className="block text-sm font-medium text-stone-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border border-stone-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  )
}
